#!/usr/bin/env python3
"""
FastAPI Backend with EXACT Streamlit Dashboard Logic
Replicates the exact same analysis workflow as dashboard_simple.py
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import threading
import time
import random
from datetime import datetime
from typing import Dict, List, Any, Optional
import ollama

app = FastAPI(
    title="Pega Log Analyzer API - Streamlit Logic",
    description="FastAPI backend using exact same logic as dashboard_simple.py",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables (same as Streamlit)
current_logs: List[Dict[str, Any]] = []
current_analyses: List[Dict[str, Any]] = []
current_tickets: List[Dict[str, Any]] = []
current_stats: Dict[str, Any] = {
    "total_logs": 0,
    "self_healed": 0,
    "tickets_raised": 0,
    "support_hours_saved": 0,
    "monitoring_active": False,
    "start_time": datetime.now().isoformat()
}
active_connections: List[WebSocket] = []
is_monitoring = False
monitoring_thread: Optional[threading.Thread] = None

# Category tracking for Pega-style logs
current_category = 'pega_performance'
category_index = 0

# Pega-style issue categories based on actual Pega log formats
ISSUE_CATEGORIES = {
    'pega_performance': [
        "PEGA0001 - Interaction time exceeded threshold: {time}ms for {activity}",
        "PEGA0005 - Database time exceeded threshold: {db_time}ms, {db_count} operations",
        "PEGA0011 - Commit count exceeded threshold: {commit_count} commits in {time_window}s",
        "PEGA0020 - Clipboard size exceeded threshold: {size} elements, max {max_size}",
        "PEGA0041 - Agent/Queue Processor task run time exceeded: {runtime}ms",
        "PEGA0053 - Service response time exceeded threshold: {response_time}ms",
        "PEGA0073 - BIX extract duration exceeded threshold: {duration}ms",
        "PEGA0035 - Clipboard property exceeded WARN level: {property} size {size}"
    ],
    'pega_runtime': [
        "AUTH-403 - Missing privilege (authorization failure) for user {username}",
        "CONN-1001 - HTTP connector timeout: {service} connection failed after {timeout}ms",
        "CONN-JSONMAP-400 - JSON mapping failure in REST connector: {endpoint}",
        "QP-RETRYMAX - Queue Processor max retries reached: {processor_name}",
        "DB-DEADLOCK - Database deadlock detected: Transaction {tx_id} rolled back",
        "RULE-404 - Rule not found: {rule_name} in {rule_type}",
        "BIX-ORA-01653 - BIX extract failed due to Oracle tablespace issue",
        "EMAIL-READ-IO - Email listener I/O error: {error_message}",
        "DX-SECTION-INVALID - Invalid section rule in DX API: {section_name}",
        "CONN-401 - Unauthorized (HTTP 401) in REST connector: {endpoint}",
        "SOAP-FAULT-CLIENT - SOAP fault (client validation error): {service}",
        "LISTENER-PARSE-CSV - File listener CSV parsing error: {file_name}",
        "KAFKA-LAG-HIGH - Kafka topic lag exceeds threshold: {lag}ms",
        "SEARCH-REINDEX-FAIL - Search index rebuild failure: {index_name}"
    ],
    'pega_security': [
        "SECU0001 - XSS payload blocked: {payload} from IP {ip_address}",
        "SECU0006 - CSRF token validation failed: {token} for user {username}",
        "SECU0010 - OAuth2 token expired/invalid: {token_type} for {client_id}",
        "SECU0021 - Authorization denied for restricted rule: {rule_name}",
        "SECU0003 - SQL injection attempt blocked: {query} from {source}",
        "SECU0007 - Session hijacking attempt detected: {session_id}",
        "SECU0015 - Privilege escalation attempt: {username} tried {action}",
        "SECU0025 - Brute force attack detected: {attempts} attempts from {ip}"
    ],
    'pega_integration': [
        "INT-1001 - External service timeout: {service_name} after {timeout}ms",
        "INT-2001 - API rate limit exceeded: {endpoint} limit {limit}/min",
        "INT-3001 - Data transformation error: {transformation} failed",
        "INT-4001 - Message queue overflow: {queue_name} size {size}",
        "INT-5001 - Webhook delivery failed: {webhook_url} status {status}",
        "INT-6001 - File transfer error: {file_name} to {destination}",
        "INT-7001 - Database sync failure: {table_name} sync error",
        "INT-8001 - Cache synchronization error: {cache_name} update failed"
    ],
    'pega_workflow': [
        "WF-1001 - Workflow execution failed: {workflow_name} step {step}",
        "WF-2001 - Case processing error: {case_id} status update failed",
        "WF-3001 - Assignment rule failure: {rule_name} for {work_type}",
        "WF-4001 - SLA violation: {sla_name} exceeded by {duration}",
        "WF-5001 - Decision table error: {table_name} evaluation failed",
        "WF-6001 - Flow execution timeout: {flow_name} after {timeout}ms",
        "WF-7001 - Data page refresh error: {data_page} load failed",
        "WF-8001 - Declarative rule error: {rule_name} calculation failed"
    ]
}

# Initialize Mistral AI
MISTRAL_CLIENT = None
KEDB_DATA = []
TICKETS_DATA = []

def initialize_mistral():
    """Initialize Mistral AI - EXACT same as Streamlit."""
    try:
        client = ollama.Client()
        
        # Check if Mistral model is available
        try:
            models = client.list()
            if 'models' in models:
                mistral_available = any('mistral' in model.get('name', '').lower() for model in models['models'])
            else:
                mistral_available = False
            
            if not mistral_available:
                print("🔄 Pulling Mistral 7B model...")
                client.pull('mistral:7b')
                print("✅ Mistral 7B model pulled successfully!")
            else:
                print("✅ Mistral model already available!")
                
            return client
        except Exception as e:
            print(f"❌ Failed to check/pull Mistral model: {e}")
            try:
                print("🔄 Attempting to pull Mistral model...")
                client.pull('mistral:7b')
                print("✅ Mistral 7B model pulled successfully!")
                return client
            except Exception as pull_error:
                print(f"❌ Failed to pull Mistral model: {pull_error}")
                return None
            
    except ImportError:
        print("❌ Ollama not installed. Install with: pip install ollama")
        return None
    except Exception as e:
        print(f"❌ Failed to initialize Mistral: {e}")
        return None

def load_kedb():
    """Load KEDB - EXACT same as Streamlit."""
    try:
        with open('kebd.json', 'r', encoding='utf-8') as f:
            kedb_data = json.load(f)
        print(f"✅ KEDB loaded with {len(kedb_data)} error patterns")
        return kedb_data
    except FileNotFoundError:
        print("❌ KEDB file (kebd.json) not found")
        return []
    except Exception as e:
        print(f"❌ Failed to load KEDB: {e}")
        return []

# Load KEDB data
KEDB_DATA = load_kedb()

def load_tickets(frontend_version="v1"):
    """Load tickets - EXACT same as Streamlit."""
    tickets_file = 'tickets_v2.json' if frontend_version == 'v2' else 'tickets.json'
    try:
        with open(tickets_file, 'r', encoding='utf-8') as f:
            tickets_data = json.load(f)
        print(f"✅ Loaded {len(tickets_data)} existing tickets from {tickets_file}")
        return tickets_data
    except FileNotFoundError:
        print(f"ℹ️ No existing tickets file found ({tickets_file})")
        return []
    except Exception as e:
        print(f"❌ Failed to load tickets: {e}")
        return []

def save_ticket(ticket, frontend_version="v1"):
    """Save ticket - EXACT same as Streamlit."""
    global TICKETS_DATA
    try:
        TICKETS_DATA.append(ticket)
        
        # Save to both files for now (we can refine this later)
        with open('tickets.json', 'w', encoding='utf-8') as f:
            json.dump(TICKETS_DATA, f, indent=2, ensure_ascii=False)
        
        with open('tickets_v2.json', 'w', encoding='utf-8') as f:
            json.dump(TICKETS_DATA, f, indent=2, ensure_ascii=False)
            
        print(f"✅ Ticket {ticket.get('ticket_id', 'Unknown')} saved to both ticket files")
    except Exception as e:
        print(f"❌ Failed to save ticket: {e}")

def generate_demo_log():
    """Generate demo log in exact Pega format."""
    global current_category, category_index
    
    # Get current category and pattern
    category = current_category
    patterns = ISSUE_CATEGORIES[category]
    pattern_index = category_index % len(patterns)
    pattern = patterns[pattern_index]
    
    # Generate full Pega log format
    log_message = generate_pega_log_format(pattern, category)
    
    # Move to next pattern in current category
    category_index += 1
    
    # If we've gone through all patterns in this category, move to next category
    if category_index >= len(patterns):
        category_index = 0
        # Move to next category in rotation
        categories = list(ISSUE_CATEGORIES.keys())
        current_idx = categories.index(category)
        next_idx = (current_idx + 1) % len(categories)
        current_category = categories[next_idx]
    
    return log_message

def generate_pega_log_format(pattern, category):
    """Generate logs in exact Pega format with full metadata and performance metrics."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S,%f")[:-3] + " GMT"
    
    if category == 'pega_performance':
        return generate_pega_alert_log(timestamp, pattern)
    elif category in ['pega_runtime', 'pega_integration']:
        return generate_pega_rules_log(timestamp, pattern)
    elif category == 'pega_security':
        return generate_pega_security_log(timestamp, pattern)
    else:
        return generate_pega_alert_log(timestamp, pattern)

def generate_pega_alert_log(timestamp, pattern):
    """Generate PegaRULES-ALERT.log format with full metadata."""
    # Generate realistic Pega metadata
    request_id = f"{random.randint(10000, 99999)}"
    session_id = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=32))
    user_id = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=32))
    work_id = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=32))
    batch_id = f"PegaRULES-Batch-{random.randint(1, 20)}"
    queue_number = random.randint(4800, 5000)
    
    # Performance metrics
    pxRDBIOElapsed = f"{random.uniform(0.00, 0.05):.2f}"
    pxTotalReqCPU = f"{random.uniform(0.03, 0.50):.2f}"
    pxTotalReqTime = f"{random.uniform(0.04, 0.50):.2f}"
    pxRulesExecuted = random.randint(100, 1000)
    pxActivityCount = random.randint(40, 400)
    pxAlertCount = random.randint(1, 5)
    pxDBInputBytes = f"{random.randint(2000000, 3000000):,}"
    pxRulesUsed = random.randint(400, 2000)
    
    # Activity details
    activities = [
        "WORK-COVER- ADDTOCOVER #20180713T133047.805 GMT Step: 1 Circum: 0",
        "WORK- RECALCULATEANDSAVE #20250129T163912.392 GMT Step: 7 Circum: 0",
        "ASSIGN- EXECUTESLA #20190219T070031.859 GMT Step: 23 Circum: 0"
    ]
    activity = random.choice(activities)
    
    # Property details
    properties = [
        "pyWorkPage.pxCoveredInsKeys",
        ".pxCoveredInsKeys",
        "pyTempPlaceHolder",
        "pxAssignmentPage"
    ]
    property_ref = random.choice(properties)
    
    # Generate the full Pega alert log format
    log_line = f"{timestamp}*8*{pattern.split(' - ')[0]}*{request_id}*10000*{session_id}*NA*NA*{user_id}*System*TCSDPM-Covenant-Work*CovenantMo:01.01*{work_id}*N*1*{session_id}*{queue_number}*{batch_id}*STANDARD*com.pega.pegarules.data.internal.clipboard.ClipboardPropertyImpl*NA*System-Queue-ServiceLevel.ProcessEvent*Rule-Obj-Activity:EstablishContext*{activity}*NA*false*NA***pxRDBIOElapsed={pxRDBIOElapsed};pxListWithUnfilteredStreamCount=1;pxRDBIOCount=1;pxTotalReqCPU={pxTotalReqCPU};pxRunModelCount=15;pxRunWhenCount=16;pxDeclarativePageLoadElapsed=0.01;pxRulesExecuted={pxRulesExecuted};pxListRowWithUnfilteredStreamCount=1;pxOtherCount=18;pxDBInputBytes={pxDBInputBytes};pxTotalReqTime={pxTotalReqTime};pxActivityCount={pxActivityCount};pxAlertCount={pxAlertCount};pxOtherFromCacheCount=26;pxFlowCount=1;pxRunOtherRuleCount=20;pxOtherBrowseElapsed=0.00;pxDeclarativeRulesInvokedCount=2;pxInteractions=1;pxLegacyRuleAPIUsedCount=4;pxRuleCount=10;pxRulesUsed={pxRulesUsed};pxDeclarativePageLoadCount=2;pxRuleFromCacheCount=10;pxOtherIOElapsed=0.01;pxTrackedPropertyChangesCount=51;pxOtherIOCount=8;*TCSDPM-Covenant-Work-Covenant*pyWorkPage*TCSDPM-Covenant-Work-Covenant*pyWorkPage*Preconditions;RULE-OBJ-ACTIVITY {activity};doActivity Rule-Obj-Activity:AddToCover;Call AddToCover;RULE-OBJ-ACTIVITY WORK- ADDCOVEREDWORK #20240910T131725.450 GMT Step: 18 Circum: 0;24 additional frames in stack;*workPage=[removed];pyTempPlaceHolder=TempPlaceHolder;*The number of elements in this clipboard list property has exceeded WARN level.  Maximum size: 10000 Property reference: {property_ref}*"
    
    return log_line

def generate_pega_rules_log(timestamp, pattern):
    """Generate pegarules.log format with Java stack traces."""
    thread_name = f"PegaRULES-{random.choice(['MasterAgent', 'Batch-14', 'Batch-3', 'Batch-13'])}"
    requestor_id = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=32))
    
    if 'AUTH-403' in pattern:
        error_msg = f"[Indexer][Trace: '{random.randint(10000000, 99999999):x}'] Unable to connect to the service. Please examine the exception message, and check the network connectivity to the service."
        stack_trace = f"""com.pega.platform.search.indexer.ConnectionFailedException: [Track: {random.randint(10000000, 99999999):x}] Unable to complete a request to SRS. [INDEX request: POST http://172.31.112.202:8082/pega/index; timeout: 30000 ms] 
	at com.pega.platform.search.indexer.internal.srs.SRSIndexingErrorHandler.interpretException(SRSIndexingErrorHandler.java:96) ~[search.jar:?] 
	at com.pega.platform.search.indexer.internal.srs.SRSIndexingHook.sendRequest(SRSIndexingHook.java:88) ~[search.jar:?] 
	at com.pega.platform.search.indexer.internal.srs.SRSIndexingHook.sendData(SRSIndexingHook.java:69) ~[search.jar:?] 
	at com.pega.platform.indexer.internal.UniversalDataIndexer.sendBulk(UniversalDataIndexer.java:72) ~[indexer.jar:?] 
	at com.pega.platform.indexer.internal.engine.processing.request.incremental.IncrementalIndexRequestHandler.lambda$handle$0(IncrementalIndexRequestHandler.java:86) ~[indexer.jar:?] 
	at java.util.Optional.ifPresent(Optional.java:178) ~[?:?] 
	at com.pega.platform.indexer.internal.engine.processing.request.incremental.IncrementalIndexRequestHandler.handle(IncrementalIndexRequestHandler.java:84) ~[indexer.jar:?] 
	at com.pega.platform.indexer.internal.engine.processing.request.incremental.IncrementalIndexRequestHandler.handle(IncrementalIndexRequestHandler.java:50) ~[indexer.jar:?] 
	at com.pega.platform.indexer.internal.engine.processing.ProcessingGroup.runHandler(ProcessingGroup.java:63) ~[indexer.jar:?] 
	at com.pega.platform.indexer.internal.engine.processing.DefaultQueueItemDispatcher.dispatch(DefaultQueueItemDispatcher.java:71) ~[indexer.jar:?] 
	at com.pega.platform.indexer.internal.engine.dispatcher.QueueDispatchStrategy.processQueueItem(QueueDispatchStrategy.java:72) ~[indexer.jar:?] 
	at com.pega.platform.indexer.internal.engine.dispatcher.QueueDispatchStrategy.processQueueItem(QueueDispatchStrategy.java:39) ~[indexer.jar:?] 
	at com.pega.platform.search.dispatcher.internal.MultipleQueueDispatcher.dispatchIndexingQueueItem(MultipleQueueDispatcher.java:45) ~[search.jar:?] 
	at com.pega.pegarules.session.internal.mgmt.Executable.runIncrementalIndexer(Executable.java:12267) ~[prprivate-session.jar:?] 
	at com.pegarules.generated.activity.ra_action_pzbiincrementalindexerusingqp_030a605c1a7e1bec48386d1e0152becf.step2_circum0(ra_action_pzbiincrementalindexerusingqp_030a605c1a7e1bec48386d1e0152becf.java:222) ~[?:?] 
	at com.pegarules.generated.activity.ra_action_pzbiincrementalindexerusingqp_030a605c1a7e1bec48386d1e0152becf.perform(ra_action_pzbiincrementalindexerusingqp_030a605c1a7e1bec48386d1e0152becf.java:93) ~[?:?] 
	at com.pega.pegarules.session.internal.mgmt.Executable.doActivity(Executable.java:2927) ~[prprivate-session.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.asyncexecutor.execution.QPExecution.runActivity(QPExecution.java:140) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.asyncexecutor.execution.QPExecution.run(QPExecution.java:72) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.asyncexecutor.QueueProcessorExecutor.execute(QueueProcessorExecutor.java:106) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.asyncexecutor.QueueProcessorOnlyOnceExecutionStrategy.run(QueueProcessorOnlyOnceExecutionStrategy.java:175) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.asyncexecutor.QueueProcessorUsageReportingExecutionStrategy.run(QueueProcessorUsageReportingExecutionStrategy.java:83) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.asyncexecutor.QueueProcessorUsageReportingExecutionStrategy.lambda$execute$0(QueueProcessorUsageReportingExecutionStrategy.java:64) ~[d-node.jar:?] 
	at com.pega.pegarules.session.internal.PRSessionProviderImpl.performTargetActionWithLock(PRSessionProviderImpl.java:1379) ~[prprivate-session.jar:?] 
	at com.pega.pegarules.session.internal.PRSessionProviderImpl.doWithRequestorLocked(PRSessionProviderImpl.java:1122) ~[prprivate-session.jar:?] 
	at com.pega.pegarules.session.internal.PRSessionProviderImpl.doWithRequestorLocked(PRSessionProviderImpl.java:1003) ~[prprivate-session.jar:?] 
	at com.pega.pegarules.session.internal.PRSessionProviderImplForModules.doWithRequestorLocked(PRSessionProviderImplForModules.java:83) ~[prprivate-session.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.asyncexecutor.QueueProcessorUsageReportingExecutionStrategy.execute(QueueProcessorUsageReportingExecutionStrategy.java:52) ~[d-node.jar:?] 
	at com.pega.platform.executor.internal.LogContextDecorator.runInDecoratedScope(LogContextDecorator.java:38) ~[pega-executor.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.asyncexecutor.QueueProcessorDataFlowFactory$1$1.onNext(QueueProcessorDataFlowFactory.java:105) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.asyncexecutor.QueueProcessorDataFlowFactory$1$1.onNext(QueueProcessorDataFlowFactory.java:81) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.api.dataflow.DataFlowStage$StageInputSubscriber.onNext(DataFlowStage.java:566) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.api.dataflow.DataFlowStage$StageInputSubscriber.onNext(DataFlowStage.java:487) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.api.dataflow.DataFlowExecutor$QueueBasedDataFlowExecutor$2.process(DataFlowExecutor.java:405) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.api.dataflow.DataFlowExecutor$QueueBasedDataFlowExecutor.runEventLoop(DataFlowExecutor.java:217) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.api.dataflow.DataFlow$2.emit(DataFlow.java:350) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.stream.DataObservableImpl.subscribe(DataObservableImpl.java:59) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.task.strategy.ExecutionStrategy.executeDataFlow(ExecutionStrategy.java:128) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.task.strategy.MultiplePartitionExecution.executePartitions(MultiplePartitionExecution.java:87) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.service.run.ExecutePartitionsRunnable.executeDataFlowWithPartitions(ExecutePartitionsRunnable.java:86) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.service.run.ExecutePartitionsRunnable$1.run(ExecutePartitionsRunnable.java:67) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.service.run.ExecutePartitionsRunnable$1.run(ExecutePartitionsRunnable.java:62) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.util.PrpcRunnable.execute(PrpcRunnable.java:77) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.prpc.service.ServiceHelper.executeInPrpcContextInternal(ServiceHelper.java:305) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.prpc.service.ServiceHelper.executeInPrpcContext(ServiceHelper.java:150) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.service.run.ExecutePartitionsRunnable.call(ExecutePartitionsRunnable.java:62) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.dataflow.service.run.ExecutePartitionsRunnable.call(ExecutePartitionsRunnable.java:34) ~[d-node.jar:?] 
	at com.google.common.util.concurrent.TrustedListenableFutureTask$TrustedFutureInterruptibleTask.runInterruptibly(TrustedListenableFutureTask.java:131) ~[guava-33.2.1-jre.jar:?] 
	at com.google.common.util.concurrent.InterruptibleTask.run(InterruptibleTask.java:76) ~[guava-33.2.1-jre.jar:?] 
	at com.google.common.util.concurrent.TrustedListenableFutureTask.run(TrustedListenableFutureTask.java:82) ~[guava-33.2.1-jre.jar:?] 
	at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136) ~[?:?] 
	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635) ~[?:?] 
	at com.pega.dsm.dnode.util.PrpcRunnable$1.run(PrpcRunnable.java:69) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.util.PrpcRunnable$1.run(PrpcRunnable.java:66) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.util.PrpcRunnable.execute(PrpcRunnable.java:77) ~[d-node.jar:?] 
	at com.pega.dsm.dnode.impl.prpc.PrpcThreadFactory$PrpcThread.run(PrpcThreadFactory.java:168) ~[d-node.jar:?] 
Caused by: com.pega.platform.search.infrastructure.srs.SRSConnectorException: [Track: {random.randint(10000000, 99999999):x}] Unable to complete a request to SRS. [INDEX request: POST http://172.31.112.202:8082/pega/index; timeout: 30000 ms] 
	at com.pega.platform.search.infrastructure.internal.srs.SRSConnectorImpl.sendRequest(SRSConnectorImpl.java:126) ~[search.jar:?] 
	at com.pega.platform.search.indexer.internal.srs.SRSIndexingHook.sendRequest(SRSIndexingHook.java:86) ~[search.jar:?] 
	... 54 more 
Caused by: java.lang.NullPointerException"""
        
        return f"{timestamp} [, Partitions=[0,3,5]] [  STANDARD] [                    ] [                    ] (nnectionFailedExceptionHandler) ERROR  {requestor_id} System - {error_msg} \n{stack_trace}"
    
    else:
        # Generic runtime error format
        error_msg = pattern.split(' - ')[1] if ' - ' in pattern else pattern
        return f"{timestamp} [{thread_name}] [  STANDARD] [                    ] [                    ] (nnectionFailedExceptionHandler) ERROR  {requestor_id} System - {error_msg}"

def generate_pega_security_log(timestamp, pattern):
    """Generate PegaRULES-ALERTSECURITY.log format."""
    requestor_id = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=32))
    thread_name = "PegaRULES-SecurityAgent"
    
    if 'SECU0001' in pattern:
        payload = random.choice(['<script>alert("xss")</script>', 'javascript:void(0)', '<img src=x onerror=alert(1)>'])
        ip = f"{random.randint(192, 203)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}"
        return f"{timestamp} [{thread_name}] [  STANDARD] [                    ] [                    ] (SecurityFilter) WARN  {requestor_id} System - XSS payload blocked: {payload} from IP: {ip}"
    elif 'SECU0006' in pattern:
        return f"{timestamp} [{thread_name}] [  STANDARD] [                    ] [                    ] (CSRFTokenValidator) ERROR  {requestor_id} System - CSRF token validation failed for request"
    elif 'SECU0010' in pattern:
        return f"{timestamp} [{thread_name}] [  STANDARD] [                    ] [                    ] (OAuth2TokenValidator) ERROR  {requestor_id} System - OAuth2 token expired/invalid"
    elif 'SECU0021' in pattern:
        rule_name = random.choice(['ProcessCase', 'UpdateWorkItem', 'ValidateData', 'ExecuteFlow'])
        return f"{timestamp} [{thread_name}] [  STANDARD] [                    ] [                    ] (AuthorizationFilter) ERROR  {requestor_id} System - Authorization denied for restricted rule: {rule_name}"
    else:
        return f"{timestamp} [{thread_name}] [  STANDARD] [                    ] [                    ] (SecurityFilter) WARN  {requestor_id} System - {pattern}"

def generate_realistic_log_message(pattern, category):
    """Generate realistic values for Pega-style log formats."""
    if category == 'pega_performance':
        if 'PEGA0001' in pattern:
            activities = ['ProcessCase', 'UpdateWorkItem', 'ExecuteFlow', 'ValidateData']
            return pattern.format(time=random.randint(5000, 15000), activity=random.choice(activities))
        elif 'PEGA0005' in pattern:
            return pattern.format(db_time=random.randint(2000, 8000), db_count=random.randint(50, 200))
        elif 'PEGA0011' in pattern:
            return pattern.format(commit_count=random.randint(100, 500), time_window=random.randint(60, 300))
        elif 'PEGA0020' in pattern:
            return pattern.format(size=random.randint(10000, 15000), max_size=10000)
        elif 'PEGA0041' in pattern:
            return pattern.format(runtime=random.randint(30000, 120000))
        elif 'PEGA0053' in pattern:
            return pattern.format(response_time=random.randint(2000, 10000))
        elif 'PEGA0073' in pattern:
            return pattern.format(duration=random.randint(60000, 300000))
        elif 'PEGA0035' in pattern:
            properties = ['pyWorkPage', 'pxCoveredInsKeys', 'pyTempPlaceHolder', 'pxAssignmentPage']
            return pattern.format(property=random.choice(properties), size=random.randint(10000, 15000))
    
    elif category == 'pega_runtime':
        if 'AUTH-403' in pattern:
            users = ['USER_1234', 'USER_5678', 'USER_9012', 'ADMIN_001']
            return pattern.format(username=random.choice(users))
        elif 'CONN-1001' in pattern:
            services = ['payment-gateway', 'document-service', 'notification-api', 'user-service']
            return pattern.format(service=random.choice(services), timeout=random.randint(30000, 60000))
        elif 'CONN-JSONMAP-400' in pattern:
            endpoints = ['/api/cases', '/api/documents', '/api/users', '/api/workflows']
            return pattern.format(endpoint=random.choice(endpoints))
        elif 'QP-RETRYMAX' in pattern:
            processors = ['PegaRULES-Batch-14', 'PegaRULES-Batch-3', 'PegaRULES-Batch-13']
            return pattern.format(processor_name=random.choice(processors))
        elif 'DB-DEADLOCK' in pattern:
            return pattern.format(tx_id=f"TX_{random.randint(100000, 999999)}")
        elif 'RULE-404' in pattern:
            rules = ['ProcessCase', 'UpdateWorkItem', 'ValidateData', 'ExecuteFlow']
            rule_types = ['Activity', 'Flow', 'Decision', 'Data']
            return pattern.format(rule_name=random.choice(rules), rule_type=random.choice(rule_types))
        elif 'BIX-ORA-01653' in pattern:
            return pattern
        elif 'EMAIL-READ-IO' in pattern:
            errors = ['Connection timeout', 'Authentication failed', 'Server unreachable']
            return pattern.format(error_message=random.choice(errors))
        elif 'DX-SECTION-INVALID' in pattern:
            sections = ['CaseDetails', 'WorkItemForm', 'AssignmentPanel', 'DataView']
            return pattern.format(section_name=random.choice(sections))
        elif 'CONN-401' in pattern:
            endpoints = ['/api/cases', '/api/documents', '/api/users', '/api/workflows']
            return pattern.format(endpoint=random.choice(endpoints))
        elif 'SOAP-FAULT-CLIENT' in pattern:
            services = ['payment-service', 'document-service', 'notification-service']
            return pattern.format(service=random.choice(services))
        elif 'LISTENER-PARSE-CSV' in pattern:
            files = ['import_data.csv', 'user_data.csv', 'case_data.csv']
            return pattern.format(file_name=random.choice(files))
        elif 'KAFKA-LAG-HIGH' in pattern:
            return pattern.format(lag=random.randint(1000, 10000))
        elif 'SEARCH-REINDEX-FAIL' in pattern:
            indexes = ['CaseIndex', 'DocumentIndex', 'UserIndex', 'WorkflowIndex']
            return pattern.format(index_name=random.choice(indexes))
    
    elif category == 'pega_security':
        if 'SECU0001' in pattern:
            payloads = ['<script>alert("xss")</script>', 'javascript:void(0)', '<img src=x onerror=alert(1)>']
            ips = ['192.168.1.100', '10.0.1.50', '172.16.0.25', '203.0.113.10']
            return pattern.format(payload=random.choice(payloads), ip_address=random.choice(ips))
        elif 'SECU0006' in pattern:
            tokens = ['CSRF_TOKEN_123', 'CSRF_TOKEN_456', 'CSRF_TOKEN_789']
            users = ['USER_1234', 'USER_5678', 'USER_9012']
            return pattern.format(token=random.choice(tokens), username=random.choice(users))
        elif 'SECU0010' in pattern:
            token_types = ['access_token', 'refresh_token', 'id_token']
            clients = ['web-app', 'mobile-app', 'api-client']
            return pattern.format(token_type=random.choice(token_types), client_id=random.choice(clients))
        elif 'SECU0021' in pattern:
            rules = ['AdminAccess', 'SystemConfig', 'UserManagement', 'DataExport']
            return pattern.format(rule_name=random.choice(rules))
        elif 'SECU0003' in pattern:
            queries = ['SELECT * FROM users', 'DROP TABLE cases', 'UNION SELECT password']
            sources = ['192.168.1.100', '10.0.1.50', 'USER_3456']
            return pattern.format(query=random.choice(queries), source=random.choice(sources))
        elif 'SECU0007' in pattern:
            sessions = ['SESS_123456', 'SESS_789012', 'SESS_345678']
            return pattern.format(session_id=random.choice(sessions))
        elif 'SECU0015' in pattern:
            users = ['USER_6789', 'USER_0123', 'USER_4567']
            actions = ['admin-access', 'system-config', 'user-management']
            return pattern.format(username=random.choice(users), action=random.choice(actions))
        elif 'SECU0025' in pattern:
            ips = ['203.0.113.25', '198.51.100.50', '192.0.2.75']
            return pattern.format(attempts=random.randint(10, 50), ip=random.choice(ips))
    
    elif category == 'pega_integration':
        if 'INT-1001' in pattern:
            services = ['payment-gateway', 'document-service', 'notification-api', 'user-service']
            return pattern.format(service_name=random.choice(services), timeout=random.randint(30000, 60000))
        elif 'INT-2001' in pattern:
            endpoints = ['/api/cases', '/api/documents', '/api/users', '/api/workflows']
            return pattern.format(endpoint=random.choice(endpoints), limit=random.randint(100, 1000))
        elif 'INT-3001' in pattern:
            transformations = ['JSON-to-XML', 'CSV-to-JSON', 'XML-to-JSON', 'Data-mapping']
            return pattern.format(transformation=random.choice(transformations))
        elif 'INT-4001' in pattern:
            queues = ['CaseQueue', 'DocumentQueue', 'NotificationQueue', 'WorkflowQueue']
            return pattern.format(queue_name=random.choice(queues), size=random.randint(1000, 10000))
        elif 'INT-5001' in pattern:
            webhooks = ['https://api.example.com/webhook', 'https://callback.service.com/notify']
            return pattern.format(webhook_url=random.choice(webhooks), status=random.randint(400, 599))
        elif 'INT-6001' in pattern:
            files = ['import_data.csv', 'export_data.xml', 'backup_data.json']
            destinations = ['sftp://server.com/data', 'https://api.service.com/upload']
            return pattern.format(file_name=random.choice(files), destination=random.choice(destinations))
        elif 'INT-7001' in pattern:
            tables = ['cases', 'documents', 'users', 'workflows']
            return pattern.format(table_name=random.choice(tables))
        elif 'INT-8001' in pattern:
            caches = ['CaseCache', 'DocumentCache', 'UserCache', 'WorkflowCache']
            return pattern.format(cache_name=random.choice(caches))
    
    elif category == 'pega_workflow':
        if 'WF-1001' in pattern:
            workflows = ['CaseApproval', 'DocumentReview', 'UserOnboarding', 'PaymentProcessing']
            return pattern.format(workflow_name=random.choice(workflows), step=random.randint(1, 10))
        elif 'WF-2001' in pattern:
            return pattern.format(case_id=f"CASE_{random.randint(100000, 999999)}")
        elif 'WF-3001' in pattern:
            rules = ['AssignmentRule', 'RoutingRule', 'AssignmentStrategy']
            work_types = ['CaseWork', 'DocumentWork', 'UserWork']
            return pattern.format(rule_name=random.choice(rules), work_type=random.choice(work_types))
        elif 'WF-4001' in pattern:
            slas = ['ResponseSLA', 'ResolutionSLA', 'AssignmentSLA']
            return pattern.format(sla_name=random.choice(slas), duration=random.randint(60, 3600))
        elif 'WF-5001' in pattern:
            tables = ['DecisionTable', 'LookupTable', 'ValidationTable']
            return pattern.format(table_name=random.choice(tables))
        elif 'WF-6001' in pattern:
            flows = ['CaseFlow', 'DocumentFlow', 'UserFlow', 'PaymentFlow']
            return pattern.format(flow_name=random.choice(flows), timeout=random.randint(30000, 300000))
        elif 'WF-7001' in pattern:
            data_pages = ['CaseDataPage', 'DocumentDataPage', 'UserDataPage']
            return pattern.format(data_page=random.choice(data_pages))
        elif 'WF-8001' in pattern:
            rules = ['DeclarativeRule', 'CalculationRule', 'ValidationRule']
            return pattern.format(rule_name=random.choice(rules))
    
    # Default for unknown patterns
    return pattern

def analyze_log_with_mistral(log_line):
    """Analyze log - EXACT same as Streamlit."""
    if not MISTRAL_CLIENT:
        print("❌ Mistral AI not available - cannot analyze log")
        return None
    
    try:
        # Create prompt for Mistral AI
        prompt = f"""
        Analyze this Pega application log line and provide a JSON response:
        
        Log: {log_line}
        
        Provide analysis in this exact JSON format:
        {{
            "anomaly": "Brief description of the issue",
            "severity": "Critical/High/Medium/Low",
            "category": "performance/network/security/database/application",
            "description": "Detailed explanation of the issue"
        }}
        
        Only return valid JSON, no other text.
        """
        
        # Get response from Mistral AI
        response = MISTRAL_CLIENT.chat(model='mistral:7b', messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ])
        
        # Extract JSON from response
        ai_response = response['message']['content']
        
        # Try to parse JSON
        try:
            ai_analysis = json.loads(ai_response)
            print(f"✅ Mistral AI analysis: {ai_analysis['anomaly']}")
        except json.JSONDecodeError:
            print(f"❌ Failed to parse Mistral response: {ai_response}")
            return None
        
        # Now check KEDB for matching patterns
        kedb_match = find_kedb_match(ai_analysis, log_line)
        
        # Create a mix of self-heals and tickets (70% self-heal, 30% tickets)
        should_create_ticket = random.random() < 0.3  # 30% chance to create ticket
        
        if kedb_match and not should_create_ticket:
            # Self-heal if KEDB match found and not randomly selected for ticket
            print(f"✅ KEDB match found: {kedb_match.get('error', 'Unknown')} - Self-healing")
            return {
                "anomaly": ai_analysis.get('anomaly', 'Unknown Issue'),
                "severity": ai_analysis.get('severity', 'Medium'),
                "action": "self_healed",
                "kedb_match": kedb_match.get('error', 'Unknown'),
                "suggested_fix": kedb_match.get('fix', 'No fix available'),
                "support_hours_saved": kedb_match.get('support_hours_saved', 2),
                "category": ai_analysis.get('category', 'unknown'),
                "self_heal_result": f"✅ Auto-resolved: {kedb_match.get('fix', 'Unknown fix')}"
            }
        else:
            # Create ticket (either no KEDB match OR randomly selected for ticket)
            action_reason = "No KEDB match" if not kedb_match else "Randomly selected for ticket creation"
            print(f"🎫 {action_reason} - Creating ticket for: {ai_analysis.get('anomaly', 'Unknown Issue')}")
            ticket_id = f"TKT-{datetime.now().strftime('%Y%m%d')}-{random.randint(1, 999):03d}"
            ticket = {
                "ticket_id": ticket_id,
                "timestamp": datetime.now().isoformat(),
                "log_line": log_line,
                "anomaly": ai_analysis.get('anomaly', 'Unknown Issue'),
                "severity": ai_analysis.get('severity', 'Medium'),
                "category": ai_analysis.get('category', 'unknown'),
                "description": ai_analysis.get('description', 'No description available'),
                "status": "Open"
            }
            
            # Save ticket
            save_ticket(ticket)
            
            return {
                "anomaly": ai_analysis.get('anomaly', 'Unknown Issue'),
                "severity": ai_analysis.get('severity', 'Medium'),
                "action": "ticket_raised",
                "ticket_id": ticket_id,
                "suggested_fix": ai_analysis.get('description', 'No fix suggested'),
                "support_hours_saved": 0,
                "category": ai_analysis.get('category', 'unknown')
            }
            
    except Exception as e:
        print(f"❌ Mistral AI analysis failed: {e}")
        return None

def find_kedb_match(ai_analysis, log_line):
    """Find KEDB match - Extract error codes from log lines for better matching."""
    if not KEDB_DATA:
        return None
    
    anomaly = ai_analysis.get('anomaly', '').lower()
    category = ai_analysis.get('category', '').lower()
    
    print(f"🔍 Looking for KEDB match for anomaly: '{anomaly}'")
    print(f"🔍 Log line contains: {log_line[:100]}...")
    
    # First, try to extract error codes from the log line
    import re
    
    # Extract Pega error codes (PEGA0001, AUTH-403, etc.)
    error_codes = re.findall(r'(PEGA\d{4}|AUTH-\d{3}|CONN-\d{4}|DB-\w+|QP-\w+|SECU\d{4}|RULE-\d{3}|BIX-\w+|EMAIL-\w+|DX-\w+|SOAP-\w+|LISTENER-\w+|KAFKA-\w+|SEARCH-\w+)', log_line.upper())
    
    if error_codes:
        print(f"🔍 Found error codes in log: {error_codes}")
        
        # Look for exact error code matches in KEDB
        for entry in KEDB_DATA:
            kedb_error = entry.get('error', '').upper()
            
            # Check if this is a self-healable entry
            if not entry.get('self_healable', False):
                continue
                
            # Direct error code match
            if kedb_error in error_codes:
                print(f"✅ KEDB match found: Error code '{kedb_error}' matches in log")
                return entry
    
    # If no error code match, try flexible text matching
    for entry in KEDB_DATA:
        kedb_error = entry.get('error', '').lower()
        kedb_description = entry.get('description', '').lower()
        
        # Check if this is a self-healable entry
        if not entry.get('self_healable', False):
            continue
            
        # 1. Check if KEDB error code appears in log line
        if kedb_error.upper() in log_line.upper():
            print(f"✅ KEDB match found: Error code '{kedb_error}' found in log line")
            return entry
            
        # 2. Check if KEDB description matches anomaly
        if kedb_description and len(kedb_description) > 5:
            if kedb_description in anomaly:
                print(f"✅ KEDB match found: Description '{kedb_description}' matches anomaly")
            return entry
            
        # 3. Key terms match with more flexibility
        kedb_words = [w for w in kedb_description.split() if len(w) > 3]
        anomaly_words = [w for w in anomaly.split() if len(w) > 3]
        
        # Count matching words
        matching_words = 0
        matched_terms = []
        for word in kedb_words:
            if word in anomaly_words:
                matching_words += 1
                matched_terms.append(word)
        
        # More flexible: 2+ matching words
        if matching_words >= 2 and len(kedb_words) >= 2:
            print(f"✅ KEDB match found: '{kedb_description}' has {matching_words} matching words: {matched_terms}")
            return entry
            
        # 4. Common Pega patterns
        pega_patterns = [
            ('clipboard', 'exceeded'),
            ('interaction', 'time'),
            ('database', 'time'),
            ('commit', 'count'),
            ('clipboard', 'size'),
            ('agent', 'time'),
            ('service', 'response'),
            ('bix', 'extract'),
            ('authentication', 'failed'),
            ('authorization', 'denied'),
            ('connector', 'timeout'),
            ('deadlock', 'detected'),
            ('queue', 'processor'),
            ('xss', 'blocked'),
            ('csrf', 'token')
        ]
        
        for pattern in pega_patterns:
            if all(word in kedb_description for word in pattern) and all(word in anomaly for word in pattern):
                print(f"✅ KEDB match found: Pega pattern {pattern} matches")
                return entry
    
    print(f"🔍 No KEDB match found for: {anomaly}")
    return None

async def broadcast_to_websockets(message: Dict[str, Any]):
    """Broadcast message to all connected WebSocket clients."""
    if active_connections:
        disconnected = []
        for connection in active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                print(f"Failed to send message to WebSocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            if connection in active_connections:
                active_connections.remove(connection)

def log_callback(log_entry, loop):
    """Process new log entry - EXACT same logic as Streamlit."""
    global current_stats, current_logs, current_analyses, current_tickets
    
    # Add to logs
    current_logs.append(log_entry)
    if len(current_logs) > 100:  # Keep last 100 logs
        current_logs = current_logs[-100:]
    
    # Update stats
    current_stats["total_logs"] += 1
    
    # Analyze log with Mistral AI
    try:
        analysis = analyze_log_with_mistral(log_entry["message"])
        
        if analysis:
            # Store analysis
            analysis_entry = {
                "timestamp": log_entry["timestamp"],
                "log_message": log_entry["message"],
                "analysis": analysis,
                "id": len(current_analyses) + 1
            }
            current_analyses.append(analysis_entry)
            if len(current_analyses) > 50:  # Keep last 50 analyses
                current_analyses = current_analyses[-50:]
            
            # Update stats based on action
            if analysis.get('action') == 'self_healed':
                current_stats['self_healed'] += 1
                current_stats['support_hours_saved'] += analysis.get('support_hours_saved', 0)
                print(f"🔧 Self-heal: {analysis.get('self_heal_result', 'Unknown')}")
            elif analysis.get('action') == 'ticket_raised':
                current_stats['tickets_raised'] += 1
                
                # Add ticket to current_tickets list
                ticket_entry = {
                    "ticket_id": analysis.get("ticket_id"),
                    "timestamp": log_entry["timestamp"],
                    "severity": analysis.get("severity", "Medium"),
                    "anomaly": analysis.get("anomaly", "Unknown"),
                    "description": log_entry["message"],
                    "status": "Open"
                }
                current_tickets.insert(0, ticket_entry)  # Add to beginning
                if len(current_tickets) > 50:  # Keep last 50 tickets
                    current_tickets = current_tickets[:50]
                
                print(f"🎫 Ticket created: {analysis.get('ticket_id')}")
            
            print(f"✅ Analysis: {analysis.get('anomaly', 'Normal')} | Severity: {analysis.get('severity', 'Low')}")
        else:
            print(f"⚠️ Skipping log analysis for: {log_entry['message'][:100]}...")
            
    except Exception as e:
        print(f"Error analyzing log: {e}")
    
    print(f"📝 New log: {log_entry.get('message', '')[:50]}...")
    print(f"📊 Stats: {current_stats['total_logs']} logs, {current_stats['self_healed']} self-healed, {current_stats['tickets_raised']} tickets")
    
    # Broadcast updates via WebSocket
    def broadcast():
        asyncio.create_task(broadcast_to_websockets({
            "type": "new_log",
            "data": log_entry
        }))
        asyncio.create_task(broadcast_to_websockets({
            "type": "stats_update",
            "data": current_stats
        }))
        if current_tickets:
            asyncio.create_task(broadcast_to_websockets({
                "type": "tickets_update",
                "data": current_tickets[:10]
            }))

    if loop.is_running():
        loop.call_soon_threadsafe(broadcast)

def monitoring_loop(loop):
    """Background monitoring loop - EXACT same as Streamlit."""
    global is_monitoring
    
    print("🚀 Starting monitoring loop...")
    
    while is_monitoring:
        try:
            # Generate new log (same as Streamlit)
            new_log = generate_demo_log()
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "message": new_log,
                "level": "ERROR" if any(word in new_log.lower() for word in ['error', 'failed', 'timeout', 'critical']) else 
                         "WARN" if any(word in new_log.lower() for word in ['warning', 'degradation', 'exceeded', 'leak']) else "INFO"
            }
            
            # Process log (same as Streamlit)
            log_callback(log_entry, loop)
            
            # Wait 3 seconds (same as Streamlit)
            time.sleep(3)
            
        except Exception as e:
            print(f"Error in monitoring loop: {e}")
            time.sleep(5)
    
    print("🛑 Monitoring loop stopped")

@app.on_event("startup")
async def startup_event():
    """Initialize components."""
    global MISTRAL_CLIENT, KEDB_DATA, TICKETS_DATA
    
    print("🚀 Starting Pega Log Analyzer API...")
    
    # Initialize Mistral AI
    MISTRAL_CLIENT = initialize_mistral()
    
    # Load KEDB and tickets
    KEDB_DATA = load_kedb()
    TICKETS_DATA = load_tickets()
    
    # Load existing tickets into current_tickets
    for ticket in TICKETS_DATA:
        ticket_entry = {
            "ticket_id": ticket.get("ticket_id", "Unknown"),
            "timestamp": ticket.get("timestamp", "Unknown"),
            "severity": ticket.get("severity", "Medium"),
            "anomaly": ticket.get("anomaly", "Unknown"),
            "description": ticket.get("log_line", "No description"),
            "status": ticket.get("status", "Open")
        }
        current_tickets.append(ticket_entry)
    
    print("✅ Components initialized successfully")

@app.get("/status")
async def get_status():
    """Get system status."""
    return {
        "status": "running",
        "monitoring_active": is_monitoring,
        "components": {
            "mistral_ai": MISTRAL_CLIENT is not None,
            "kedb": len(KEDB_DATA) > 0,
            "tickets": len(TICKETS_DATA)
        },
        "stats": current_stats
    }

@app.get("/logs")
async def get_logs(limit: int = 20):
    """Get recent logs."""
    return current_logs[-limit:] if current_logs else []

@app.post("/generate-log")
async def generate_log():
    """Generate a new log entry."""
    global current_logs
    new_log = generate_demo_log()
    current_logs.append(new_log)
    return {"message": "Log generated", "log": new_log}

@app.get("/analyses")
async def get_analyses(limit: int = 15):
    """Get recent analyses."""
    return current_analyses[-limit:] if current_analyses else []

@app.get("/tickets")
async def get_tickets(frontend_version: str = "v1"):
    """Get current tickets."""
    if frontend_version == "v2":
        # Load tickets from v2 file
        v2_tickets = load_tickets("v2")
        return v2_tickets[:10] if v2_tickets else []
    return current_tickets[:10] if current_tickets else []

@app.post("/monitoring/start")
async def start_monitoring():
    """Start monitoring."""
    global is_monitoring, monitoring_thread, current_stats
    
    if is_monitoring:
        return {"message": "Monitoring already active", "status": "running"}
    
    is_monitoring = True
    current_stats["monitoring_active"] = True
    loop = asyncio.get_running_loop()
    monitoring_thread = threading.Thread(target=monitoring_loop, args=(loop,), daemon=True)
    monitoring_thread.start()
    
    return {"message": "Monitoring started successfully", "status": "running"}

@app.post("/monitoring/stop")
async def stop_monitoring():
    """Stop monitoring."""
    global is_monitoring, current_stats
    
    is_monitoring = False
    current_stats["monitoring_active"] = False
    
    return {"message": "Monitoring stopped successfully", "status": "stopped"}

@app.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    active_connections.append(websocket)
    print("INFO: connection open")
    
    try:
        # Send initial data
        await websocket.send_text(json.dumps({
            "type": "initial_data",
            "data": {
                "logs": current_logs[-10:],
                "analyses": current_analyses[-10:],
                "tickets": current_tickets[:10],
                "stats": current_stats,
                "monitoring_active": is_monitoring
            }
        }))
        
        # Keep connection alive
        while True:
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        print("INFO: connection closed")
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Pega Log Analyzer API with Streamlit Logic...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

