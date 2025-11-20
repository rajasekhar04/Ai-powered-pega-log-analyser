#!/usr/bin/env python3
"""
Simplified Streamlit Dashboard for Pega Log Analysis
Fixed threading issues with direct log generation
"""

import streamlit as st
import json
import time
import pandas as pd
from datetime import datetime
import plotly.express as px
from collections import deque
import random
import os

# Page configuration
st.set_page_config(
    page_title="Pega Log Analysis Dashboard",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS - Saudi Arabia Theme
st.markdown("""
<style>
    /* Saudi Arabia themed colors */
    :root {
        --saudi-green: #006C35;
        --royal-gold: #FFD700;
        --clean-white: #FFFFFF;
        --light-green: #E8F5E8;
        --dark-green: #004A24;
    }
    
    .main-header {
        background: linear-gradient(135deg, #f8fff8 0%, var(--light-green) 50%, #e8f5e8 100%);
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        text-align: center;
        color: var(--saudi-green);
        border: 2px solid var(--saudi-green);
        box-shadow: 0 4px 12px rgba(0, 108, 53, 0.15);
    }
    
    .main-header h1 {
        color: var(--saudi-green);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        font-size: 1.8em;
        margin-bottom: 8px;
        font-weight: bold;
    }
    
    .main-header h2 {
        color: var(--saudi-green);
        font-size: 1.6em;
        margin-bottom: 8px;
        font-weight: 600;
    }
    
    .main-header h3 {
        color: #666;
        font-size: 1.1em;
        margin-bottom: 4px;
        font-weight: 500;
    }
    
    .main-header p {
        color: #777;
        font-size: 0.9em;
        margin: 0;
        font-weight: 400;
    }
    
    .error-card {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        padding: 1.2rem;
        border-radius: 15px;
        color: white;
        margin: 0.8rem 0;
        font-family: 'Segoe UI', sans-serif;
        font-size: 0.95rem;
        border: 2px solid #a71e2a;
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
    }
    
    .warning-card {
        background: linear-gradient(135deg, var(--royal-gold) 0%, #f1c40f 100%);
        padding: 1.2rem;
        border-radius: 15px;
        color: #2c3e50;
        margin: 0.8rem 0;
        font-family: 'Segoe UI', sans-serif;
        font-size: 0.95rem;
        border: 2px solid #d4ac0d;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
        font-weight: 600;
    }
    
    .success-card {
        background: linear-gradient(135deg, var(--saudi-green) 0%, var(--dark-green) 100%);
        padding: 1.2rem;
        border-radius: 15px;
        color: var(--clean-white);
        margin: 0.8rem 0;
        font-family: 'Segoe UI', sans-serif;
        font-size: 0.95rem;
        border: 2px solid var(--royal-gold);
        box-shadow: 0 4px 12px rgba(0, 108, 53, 0.2);
        font-weight: 600;
    }
    
    .self-heal-container {
        background: linear-gradient(135deg, var(--light-green) 0%, #d4edda 100%);
        border: 2px solid var(--saudi-green);
        border-radius: 15px;
        padding: 1.2rem;
        margin: 0.8rem 0;
        box-shadow: 0 4px 12px rgba(0, 108, 53, 0.1);
    }
    
    /* Enhanced button styling */
    .stButton > button {
        background: linear-gradient(135deg, var(--saudi-green) 0%, var(--dark-green) 100%);
        color: var(--clean-white);
        border: 2px solid var(--royal-gold);
        border-radius: 12px;
        font-weight: 600;
        padding: 12px 24px;
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        background: linear-gradient(135deg, var(--dark-green) 0%, var(--saudi-green) 100%);
        border-color: var(--royal-gold);
        box-shadow: 0 6px 16px rgba(0, 108, 53, 0.4);
        transform: translateY(-2px);
    }
    
    /* Professional Executive Dashboard Styling */
    .metric-card {
        background: linear-gradient(135deg, var(--clean-white) 0%, #f8f9fa 100%);
        border: 2px solid var(--saudi-green);
        border-radius: 15px;
        padding: 20px;
        text-align: center;
        margin: 10px 0;
        box-shadow: 0 6px 20px rgba(0, 108, 53, 0.15);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 108, 53, 0.25);
    }
    
    .metric-card.success {
        border-color: var(--saudi-green);
        background: linear-gradient(135deg, var(--light-green) 0%, #e8f5e8 100%);
    }
    
    .metric-card.warning {
        border-color: var(--royal-gold);
        background: linear-gradient(135deg, #fff8dc 0%, #fffacd 100%);
    }
    
    .metric-card.gold {
        border-color: var(--royal-gold);
        background: linear-gradient(135deg, #fff8dc 0%, #f0e68c 20%);
    }
    
    .metric-icon {
        font-size: 2.5em;
        margin-bottom: 10px;
        opacity: 0.8;
    }
    
    .metric-value {
        font-size: 2.8em;
        font-weight: bold;
        color: var(--saudi-green);
        margin-bottom: 5px;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .metric-label {
        font-size: 1.1em;
        color: #666;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Compact Log Entry Styling */
    .log-entry {
        background: var(--clean-white);
        border-left: 3px solid var(--saudi-green);
        border-radius: 6px;
        padding: 8px 10px;
        margin: 4px 0;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.75em;
        transition: all 0.2s ease;
        line-height: 1.3;
    }
    
    .log-entry:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        transform: translateX(2px);
    }
    
    .log-entry.log-error {
        border-left-color: #dc3545;
        background: #fff8f8;
    }
    
    .log-entry.log-warning {
        border-left-color: var(--royal-gold);
        background: #fffef8;
    }
    
    .log-entry.log-info {
        border-left-color: var(--saudi-green);
        background: #f9fff9;
    }
    
    .log-timestamp {
        color: var(--saudi-green);
        font-weight: bold;
        font-size: 0.9em;
        margin-bottom: 2px;
        display: block;
    }
    
    .log-content {
        color: #444;
        line-height: 1.3;
        font-size: 0.95em;
    }
    
    /* AI Decision Styling */
    .ai-decision {
        background: var(--clean-white);
        border-radius: 12px;
        padding: 15px;
        margin: 10px 0;
        border: 2px solid #e0e0e0;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }
    
    .ai-decision:hover {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }
    
    .ai-decision.success {
        border-color: var(--saudi-green);
        background: linear-gradient(135deg, #f8fff8 0%, var(--light-green) 100%);
    }
    
    .ai-decision.warning {
        border-color: var(--royal-gold);
        background: linear-gradient(135deg, #fffdf0 0%, #fff8dc 100%);
    }
    
    .decision-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .decision-icon {
        font-size: 1.2em;
    }
    
    .decision-time {
        font-family: 'Consolas', monospace;
        font-size: 0.85em;
        color: #666;
        font-weight: bold;
    }
    
    .decision-action {
        font-weight: bold;
        font-size: 0.8em;
        padding: 4px 8px;
        border-radius: 6px;
        background: var(--saudi-green);
        color: var(--clean-white);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .ai-decision.warning .decision-action {
        background: var(--royal-gold);
        color: #333;
    }
    
    .decision-details {
        font-size: 0.9em;
        line-height: 1.5;
        color: #444;
    }
    
    .decision-details strong {
        color: var(--saudi-green);
    }
    
    .ticket-container {
        background: #fff3e0;
        border: 1px solid #ff9800;
        border-radius: 8px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
</style>
""", unsafe_allow_html=True)

# Categorized issue patterns for systematic generation
ISSUE_CATEGORIES = {
    'performance': [
        "CPU utilization exceeded 90% threshold: {cpu}% usage detected",
        "Memory leak detected: Process {pid} consuming {memory}MB",
        "Response time degradation: API endpoint /api/cases taking {time}ms",
        "Database query performance: Slow query execution {query_time}ms",
        "Thread pool exhaustion: {active_threads} active threads, max {max_threads}",
        "Cache hit ratio dropped to {ratio}%: Performance impact detected",
        "JVM heap usage: {heap_usage}% of {total_heap}MB allocated",
        "Garbage collection frequency: {gc_count} collections in {time_window}s"
    ],
    'network': [
        "Network latency spike: {latency}ms to database server",
        "Connection pool exhausted: {active_connections}/{max_connections} connections",
        "Load balancer health check failed: Backend server {server} unresponsive",
        "SSL certificate expiration warning: Expires in {days} days",
        "Bandwidth utilization: {bandwidth}% of {total_bandwidth}Mbps used",
        "Network interface {interface} packet loss: {loss_rate}%",
        "DNS resolution timeout: {domain} lookup failed after {timeout}s",
        "Proxy connection refused: Upstream server {upstream} unavailable"
    ],
    'security': [
        "Authentication failure: User {username} from IP {ip} failed login",
        "Authorization violation: User {username} attempted access to {resource}",
        "Session hijacking attempt: Multiple sessions from IP {ip}",
        "SQL injection attempt detected: Malicious input in {field}",
        "Cross-site scripting (XSS) attempt: Payload {payload} blocked",
        "Rate limiting exceeded: IP {ip} made {requests} requests in {time}s",
        "Certificate validation failed: Invalid certificate from {source}",
        "Privilege escalation attempt: User {username} accessing {privileged_resource}"
    ],
    'database': [
        "Database connection timeout: Connection to {db_name} failed after {timeout}s",
        "Transaction deadlock detected: {transaction_count} transactions waiting",
        "Database lock contention: Table {table} locked for {duration}s",
        "Connection pool exhaustion: {active}/{max} connections in use",
        "Query timeout: Long-running query {query_id} exceeded {timeout}s",
        "Database disk space warning: {used_space}/{total_space}GB used ({percentage}%)",
        "Index fragmentation: Table {table} index {index} {fragmentation}% fragmented",
        "Backup failure: Database backup to {backup_location} failed"
    ],
    'application': [
        "Workflow engine timeout: Case {case_id} workflow {workflow} halted",
        "Rule engine cache overflow: {cache_size} rules loaded, max {max_rules}",
        "SLA breach detected: Case {case_id} exceeded {sla_limit}h limit",
        "Integration failure: External service {service} returned {error_code}",
        "File upload error: File {filename} exceeds {max_size}MB limit",
        "API rate limit exceeded: {endpoint} called {count} times in {window}s",
        "Session timeout: User {username} session expired after {duration}s",
        "Configuration error: Invalid setting {setting} in {config_file}"
    ],
    'security_policy': [
        "Security policy violation: User {username} accessed restricted resource {resource} without proper authorization",
        "Data classification violation: Sensitive data {data_type} accessed from unauthorized location {location}",
        "Encryption policy breach: Unencrypted data transmission detected for {data_category}",
        "Password policy violation: User {username} using weak password, failed complexity requirements",
        "Access control violation: Service account {service_account} granted excessive privileges to {resource}",
        "Compliance violation: GDPR data retention policy breached for user {user_id} data older than {days} days",
        "Network security policy violation: Unauthorized connection attempt from {source_ip} to restricted port {port}",
        "File access policy violation: User {username} attempted to access classified file {filename}"
    ],
    'integration_failures': [
        "Unexpected integration failure: Payment gateway {gateway} connection timeout after {timeout}s",
        "Integration service unavailable: Document management system {service} returned HTTP {status_code}",
        "Data synchronization failure: User profile sync with Active Directory failed for {username}",
        "API integration timeout: External court system API {api_endpoint} timed out after {duration}s",
        "Message queue integration failure: RabbitMQ connection lost, {message_count} messages pending",
        "Database integration error: Oracle connection pool exhausted, {active_connections} active connections",
        "Third-party service integration failure: E-signature service {provider} authentication failed",
        "Webhook integration failure: Notification service webhook {webhook_url} returned {error_code}"
    ]
}

# Issue severity mapping
ISSUE_SEVERITY = {
    'performance': {'High': 0.4, 'Medium': 0.4, 'Low': 0.2},
    'network': {'High': 0.5, 'Medium': 0.3, 'Low': 0.2},
    'security': {'Critical': 0.6, 'High': 0.3, 'Medium': 0.1},
    'database': {'Critical': 0.5, 'High': 0.3, 'Medium': 0.2},
    'application': {'High': 0.4, 'Medium': 0.4, 'Low': 0.2},
    'security_policy': {'Critical': 0.7, 'High': 0.2, 'Medium': 0.1},
    'integration_failures': {'Critical': 0.3, 'High': 0.5, 'Medium': 0.2}
}

# Real KEDB integration
def load_kedb():
    """Load the Knowledge Error Database from kebd.json."""
    try:
        if os.path.exists('kebd.json'):
            with open('kebd.json', 'r', encoding='utf-8') as f:
                kedb = json.load(f)
                print(f"✅ KEDB loaded with {len(kedb)} error patterns")
                return kedb
        else:
            print("❌ kebd.json not found, using empty KEDB")
            return []
    except Exception as e:
        print(f"❌ Failed to load KEDB: {e}")
        return []

def load_tickets():
    """Load existing tickets from tickets.json."""
    try:
        if os.path.exists('tickets.json'):
            with open('tickets.json', 'r', encoding='utf-8') as f:
                tickets = json.load(f)
                print(f"✅ Tickets loaded: {len(tickets)} existing tickets")
                return tickets
        else:
            print("ℹ️ No existing tickets found, starting fresh")
            return []
    except Exception as e:
        print(f"❌ Failed to load tickets: {e}")
        return []

def save_ticket(ticket):
    """Save a new ticket to tickets.json."""
    try:
        tickets = load_tickets()
        tickets.append(ticket)
        with open('tickets.json', 'w', encoding='utf-8') as f:
            json.dump(tickets, f, indent=2, ensure_ascii=False)
        print(f"✅ Ticket saved: {ticket['ticket_id']}")
    except Exception as e:
        print(f"❌ Failed to save ticket: {e}")

# Load KEDB and tickets at startup
KEDB_DATA = load_kedb()
TICKETS_DATA = load_tickets()

# Data persistence functions
def save_dashboard_data():
    """Save dashboard data to files for persistence."""
    try:
        # Save logs
        if 'logs' in st.session_state:
            logs_data = list(st.session_state.logs)
            with open('dashboard_logs.json', 'w', encoding='utf-8') as f:
                json.dump(logs_data, f, indent=2, ensure_ascii=False, default=str)
        
        # Save analyses
        if 'analyses' in st.session_state:
            analyses_data = list(st.session_state.analyses)
            with open('dashboard_analyses.json', 'w', encoding='utf-8') as f:
                json.dump(analyses_data, f, indent=2, ensure_ascii=False, default=str)
        
        # Save stats
        if 'stats' in st.session_state:
            stats_data = st.session_state.stats.copy()
            stats_data['start_time'] = stats_data['start_time'].isoformat()
            with open('dashboard_stats.json', 'w', encoding='utf-8') as f:
                json.dump(stats_data, f, indent=2, ensure_ascii=False)
        
        print("✅ Dashboard data saved to files")
    except Exception as e:
        print(f"❌ Failed to save dashboard data: {e}")

def load_dashboard_data():
    """Load dashboard data from files for persistence."""
    try:
        # Load logs
        if os.path.exists('dashboard_logs.json'):
            with open('dashboard_logs.json', 'r', encoding='utf-8') as f:
                logs_data = json.load(f)
                st.session_state.logs = deque(logs_data, maxlen=100)
                print(f"✅ Loaded {len(logs_data)} logs from file")
        
        # Load analyses
        if os.path.exists('dashboard_analyses.json'):
            with open('dashboard_analyses.json', 'r', encoding='utf-8') as f:
                analyses_data = json.load(f)
                st.session_state.analyses = deque(analyses_data, maxlen=50)
                print(f"✅ Loaded {len(analyses_data)} analyses from file")
        
        # Load stats
        if os.path.exists('dashboard_stats.json'):
            with open('dashboard_stats.json', 'r', encoding='utf-8') as f:
                stats_data = json.load(f)
                stats_data['start_time'] = datetime.fromisoformat(stats_data['start_time'])
                st.session_state.stats = stats_data
                print(f"✅ Loaded stats from file: {stats_data['total_logs']} total logs")
    except Exception as e:
        print(f"❌ Failed to load dashboard data: {e}")

# Real Mistral AI integration
def initialize_mistral():
    """Initialize Mistral AI analyzer."""
    try:
        import ollama
        client = ollama.Client()
        
        # Check if Mistral model is available
        try:
            models = client.list()
            if 'models' in models:
                mistral_available = any('mistral' in model.get('name', '').lower() for model in models['models'])
            else:
                # Try to pull model directly
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
            # Try to pull model anyway
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

# Initialize Mistral AI
MISTRAL_CLIENT = None  # Will be initialized in main() with spinner

def generate_demo_log():
    """Generate a demo log entry systematically by category."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    
    # Get current issue category from session state
    if 'current_category' not in st.session_state:
        st.session_state.current_category = 'performance'
        st.session_state.category_index = 0
    
    # Get current category and pattern
    category = st.session_state.current_category
    patterns = ISSUE_CATEGORIES[category]
    pattern_index = st.session_state.category_index % len(patterns)
    pattern = patterns[pattern_index]
    
    # Generate realistic values for placeholders
    log_message = generate_realistic_log_message(pattern, category)
    
    # Move to next pattern in current category
    st.session_state.category_index += 1
    
    # If we've gone through all patterns in this category, move to next category
    if st.session_state.category_index >= len(patterns):
        st.session_state.category_index = 0
        # Move to next category in rotation
        categories = list(ISSUE_CATEGORIES.keys())
        current_idx = categories.index(category)
        next_idx = (current_idx + 1) % len(categories)
        st.session_state.current_category = categories[next_idx]
    
    return f"{timestamp} {log_message}"

def generate_realistic_log_message(pattern, category):
    """Generate realistic values for log message placeholders."""
    import random
    
    # Generate realistic values based on category and pattern
    if category == 'performance':
        if 'CPU utilization' in pattern:
            return pattern.format(cpu=random.randint(90, 98))
        elif 'Memory leak' in pattern:
            return pattern.format(pid=random.randint(1000, 9999), memory=random.randint(512, 2048))
        elif 'Response time' in pattern:
            return pattern.format(time=random.randint(2000, 8000))
        elif 'Database query' in pattern:
            return pattern.format(query_time=random.randint(5000, 15000))
        elif 'Thread pool' in pattern:
            return pattern.format(active_threads=random.randint(80, 95), max_threads=100)
        elif 'Cache hit ratio' in pattern:
            return pattern.format(ratio=random.randint(60, 85))
        elif 'JVM heap' in pattern:
            return pattern.format(heap_usage=random.randint(85, 95), total_heap=random.randint(2048, 8192))
        elif 'Garbage collection' in pattern:
            return pattern.format(gc_count=random.randint(10, 25), time_window=random.randint(60, 300))
    
    elif category == 'network':
        if 'Network latency' in pattern:
            return pattern.format(latency=random.randint(100, 500))
        elif 'Connection pool' in pattern:
            return pattern.format(active_connections=random.randint(80, 95), max_connections=100)
        elif 'Load balancer' in pattern:
            return pattern.format(server=f"web-{random.randint(1, 5)}")
        elif 'SSL certificate' in pattern:
            return pattern.format(days=random.randint(1, 30))
        elif 'Bandwidth utilization' in pattern:
            return pattern.format(bandwidth=random.randint(85, 98), total_bandwidth=random.randint(100, 1000))
        elif 'Network interface' in pattern:
            return pattern.format(interface=f"eth{random.randint(0, 3)}", loss_rate=random.randint(5, 15))
        elif 'DNS resolution' in pattern:
            return pattern.format(domain=f"api{random.randint(1, 5)}.justice.gov.sa", timeout=random.randint(5, 15))
        elif 'Proxy connection' in pattern:
            return pattern.format(upstream=f"backend-{random.randint(1, 3)}")
    
    elif category == 'security':
        if 'Authentication failure' in pattern:
            return pattern.format(username=f"user{random.randint(100, 999)}", ip=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}")
        elif 'Authorization violation' in pattern:
            return pattern.format(username=f"user{random.randint(100, 999)}", resource=f"/api/admin/{random.choice(['users', 'cases', 'reports'])}")
        elif 'Session hijacking' in pattern:
            return pattern.format(ip=f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}")
        elif 'SQL injection' in pattern:
            return pattern.format(field=random.choice(['username', 'case_id', 'search_query']))
        elif 'Cross-site scripting' in pattern:
            return pattern.format(payload=f"<script>alert('{random.randint(1000, 9999)}')</script>")
        elif 'Rate limiting' in pattern:
            return pattern.format(ip=f"172.16.{random.randint(1, 255)}.{random.randint(1, 255)}", requests=random.randint(100, 500), time=60)
        elif 'Certificate validation' in pattern:
            return pattern.format(source=random.choice(['database', 'external_api', 'load_balancer']))
        elif 'Privilege escalation' in pattern:
            return pattern.format(username=f"user{random.randint(100, 999)}", privileged_resource=f"/api/system/{random.choice(['config', 'logs', 'users'])}")
    
    elif category == 'database':
        if 'Database connection timeout' in pattern:
            return pattern.format(db_name=random.choice(['pega_main', 'pega_archive', 'pega_audit']), timeout=random.randint(30, 60))
        elif 'Transaction deadlock' in pattern:
            return pattern.format(transaction_count=random.randint(3, 8))
        elif 'Database lock contention' in pattern:
            return pattern.format(table=random.choice(['PC_WORK', 'PC_CASE', 'PC_WORKLIST']), duration=random.randint(10, 60))
        elif 'Connection pool exhaustion' in pattern:
            return pattern.format(active=random.randint(80, 95), max=100)
        elif 'Query timeout' in pattern:
            return pattern.format(query_id=f"Q{random.randint(10000, 99999)}", timeout=random.randint(30, 120))
        elif 'Database disk space' in pattern:
            used = random.randint(180, 220)
            total = 250
            percentage = int((used / total) * 100)
            return pattern.format(used_space=used, total_space=total, percentage=percentage)
        elif 'Index fragmentation' in pattern:
            return pattern.format(table=random.choice(['PC_WORK', 'PC_CASE']), index=f"IDX_{random.randint(1, 5)}", fragmentation=random.randint(20, 40))
        elif 'Backup failure' in pattern:
            return pattern.format(backup_location=f"/backup/pega_{datetime.now().strftime('%Y%m%d')}")
    
    elif category == 'application':
        if 'Workflow engine timeout' in pattern:
            return pattern.format(case_id=f"C-2025-{random.randint(1, 999):03d}", workflow=f"WF{random.randint(1, 10):03d}")
        elif 'Rule engine cache overflow' in pattern:
            return pattern.format(cache_size=random.randint(1500, 1800), max_rules=1500)
        elif 'SLA breach' in pattern:
            return pattern.format(case_id=f"C-2025-{random.randint(1, 999):03d}", sla_limit=random.randint(24, 72))
        elif 'Integration failure' in pattern:
            return pattern.format(service=random.choice(['payment_gateway', 'document_service', 'notification_service']), error_code=random.choice(['500', '503', '408']))
        elif 'File upload error' in pattern:
            return pattern.format(filename=f"case_document_{random.randint(1, 999)}.pdf", max_size=10)
        elif 'API rate limit' in pattern:
            return pattern.format(endpoint=random.choice(['/api/cases', '/api/users', '/api/reports']), count=random.randint(100, 500), window=60)
        elif 'Session timeout' in pattern:
            return pattern.format(username=f"user{random.randint(100, 999)}", duration=random.randint(30, 120))
        elif 'Configuration error' in pattern:
            return pattern.format(setting=random.choice(['max_connections', 'timeout', 'cache_size']), config_file='pega.properties')
    
    elif category == 'security_policy':
        if 'Security policy violation' in pattern:
            return pattern.format(username=f"user{random.randint(100, 999)}", resource=f"/api/{random.choice(['admin', 'classified', 'restricted'])}/{random.choice(['documents', 'cases', 'reports'])}")
        elif 'Data classification violation' in pattern:
            return pattern.format(data_type=random.choice(['PII', 'Financial', 'Medical', 'Legal']), location=f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}")
        elif 'Encryption policy breach' in pattern:
            return pattern.format(data_category=random.choice(['payment_data', 'personal_information', 'case_documents']))
        elif 'Password policy violation' in pattern:
            return pattern.format(username=f"user{random.randint(100, 999)}")
        elif 'Access control violation' in pattern:
            return pattern.format(service_account=f"svc_{random.choice(['pega', 'justice', 'admin'])}", resource=f"/system/{random.choice(['config', 'logs', 'database'])}")
        elif 'Compliance violation' in pattern:
            return pattern.format(user_id=f"USR{random.randint(10000, 99999)}", days=random.randint(366, 2000))
        elif 'Network security policy violation' in pattern:
            return pattern.format(source_ip=f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}", port=random.choice([22, 23, 3389, 5432, 3306]))
        elif 'File access policy violation' in pattern:
            return pattern.format(username=f"user{random.randint(100, 999)}", filename=f"classified_{random.choice(['case', 'document', 'report'])}_{random.randint(1000, 9999)}.pdf")
    
    elif category == 'integration_failures':
        if 'Payment gateway' in pattern:
            return pattern.format(gateway=random.choice(['Visa', 'Mastercard', 'SADAD', 'mada']), timeout=random.randint(30, 120))
        elif 'Document management system' in pattern:
            return pattern.format(service=random.choice(['SharePoint', 'FileNet', 'Alfresco']), status_code=random.choice(['503', '504', '500', '408']))
        elif 'Data synchronization failure' in pattern:
            return pattern.format(username=f"user{random.randint(100, 999)}")
        elif 'External court system API' in pattern:
            return pattern.format(api_endpoint=f"/api/{random.choice(['cases', 'hearings', 'judgments'])}", duration=random.randint(30, 180))
        elif 'RabbitMQ connection' in pattern:
            return pattern.format(message_count=random.randint(100, 1000))
        elif 'Oracle connection pool' in pattern:
            return pattern.format(active_connections=random.randint(95, 100))
        elif 'E-signature service' in pattern:
            return pattern.format(provider=random.choice(['DocuSign', 'Adobe Sign', 'Nafath']))
        elif 'Notification service webhook' in pattern:
            return pattern.format(webhook_url=f"https://webhook-{random.randint(1, 5)}.justice.gov.sa/notify", error_code=random.choice(['401', '403', '500', '502']))
    
    # Default for unknown patterns
    return pattern

def analyze_log_with_mistral(log_line):
    """Analyze log using real Mistral AI and KEDB checking."""
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
        
        if kedb_match:
            # Self-heal if KEDB match found
            print(f"✅ KEDB match found: {kedb_match.get('error', 'Unknown')} - Self-healing")
            return {
                "anomaly": ai_analysis.get('anomaly', 'Unknown Issue'),
                "severity": ai_analysis.get('severity', 'Medium'),
                "action": "self_healed",
                "kedb_match": kedb_match.get('error', 'Unknown'),
                "suggested_fix": kedb_match.get('fix', 'No fix available'),
                "support_hours_saved": kedb_match.get('support_hours_saved', 2),
                "category": ai_analysis.get('category', 'unknown')
            }
        else:
            # Create ticket for unknown issue
            print(f"🎫 No KEDB match - Creating ticket for: {ai_analysis.get('anomaly', 'Unknown Issue')}")
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
    """Find matching KEDB entry for the issue."""
    if not KEDB_DATA:
        return None
    
    anomaly = ai_analysis.get('anomaly', '').lower()
    category = ai_analysis.get('category', '').lower()
    
    print(f"🔍 Looking for KEDB match for anomaly: '{anomaly}'")
    
    # Look for matching patterns in KEDB
    for entry in KEDB_DATA:
        kedb_error = entry.get('error', '').lower()
        
        # Check if this is a self-healable entry
        if not entry.get('self_healable', False):
            continue
            
        # Match patterns with balanced selectivity (not too strict, not too loose)
        # 1. Direct error pattern match in anomaly (more specific)
        if kedb_error in anomaly and len(kedb_error) > 8:  # Must be substantial pattern
            print(f"✅ KEDB match found: '{kedb_error}' matches in anomaly")
            return entry
            
        # 2. Key terms match (for patterns like "CPU utilization exceeded") - need 3+ words
        kedb_words = kedb_error.split()
        anomaly_words = anomaly.split()
        
        # If 3+ key words match (more selective), consider it a match
        matching_words = 0
        matched_terms = []
        for word in kedb_words:
            if len(word) > 3 and word in anomaly:  # Skip small words like "of", "in"
                matching_words += 1
                matched_terms.append(word)
        
        # Require 3+ matching words for a match (more selective than before)
        if matching_words >= 3:
            print(f"✅ KEDB match found: '{kedb_error}' has {matching_words} matching words: {matched_terms}")
            return entry
    
    print(f"🔍 No KEDB match found for: {anomaly}")
    return None





def main():
    """Main dashboard function."""
    
    # Initialize session state with persistence
    if 'logs' not in st.session_state:
        st.session_state.logs = deque(maxlen=100)
    if 'analyses' not in st.session_state:
        st.session_state.analyses = deque(maxlen=50)
    if 'stats' not in st.session_state:
        st.session_state.stats = {
            'total_logs': 0,
            'self_healed': 0,
            'tickets_raised': 0,
            'support_hours_saved': 0,
            'start_time': datetime.now()
        }
    if 'running' not in st.session_state:
        st.session_state.running = False
    if 'current_category' not in st.session_state:
        st.session_state.current_category = 'performance'
    if 'category_index' not in st.session_state:
        st.session_state.category_index = 0
    if 'last_log_time' not in st.session_state:
        st.session_state.last_log_time = 0
    
    # Initialize Mistral AI with spinner
    global MISTRAL_CLIENT
    if MISTRAL_CLIENT is None:
        with st.spinner('🤖 Initializing Mistral AI Engine...'):
            MISTRAL_CLIENT = initialize_mistral()
    
    # Load existing data from files
    with st.spinner('📂 Loading dashboard data...'):
        load_dashboard_data()
    
    # Header
    st.markdown("""
    <div class="main-header">
        <h1>🏛️ وزارة العدل - المملكة العربية السعودية</h1>
        <h2>🏛️ Ministry of Justice - Saudi Arabia | Intelligent Log Monitoring</h2>
        <h3>🤖 AI-Powered Pega Application Monitoring with Mistral AI</h3>
        <p>Hybrid AI + KEDB: Self-Healing & Ticket Management</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Workflow explanation
    st.info("""
    **🔍 Hybrid Workflow:** 
    1. **Mistral AI** analyzes logs and identifies patterns
    2. **KEDB Check** - looks up known error solutions
    3. **Self-Heal** - automatically fixes known errors
    4. **Raise Tickets** - creates support tickets for unknown errors
    """)
    
    # Sidebar controls
    with st.sidebar:
        st.markdown("### 🎛️ Controls")
        
        # Start/Stop controls
        col1, col2 = st.columns(2)
        with col1:
            if st.button("▶️ Start", type="primary", use_container_width=True):
                st.session_state.running = True
                st.success("Log generation started!")
        
        with col2:
            if st.button("⏹️ Stop", type="secondary", use_container_width=True):
                st.session_state.running = False
                st.info("Log generation stopped!")
        
        # Status indicator
        if st.session_state.running:
            current_category = st.session_state.get('current_category', 'performance')
            category_emoji = {
                'performance': '⚡',
                'network': '🌐',
                'security': '🔒',
                'database': '🗄️',
                'application': '📱',
                'security_policy': '🛡️',
                'integration_failures': '🔗'
            }
            emoji = category_emoji.get(current_category, '📊')
            st.markdown(f'<div class="success-card">🟢 Live Analysis Running</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="metric-card">Current Category: {emoji} {current_category.title()}</div>', unsafe_allow_html=True)
        else:
            st.markdown('<div class="error-card">🔴 Analysis Stopped</div>', unsafe_allow_html=True)
        
        # System status
        st.markdown("### 🔧 System Status")
        
        # Mistral AI status
        if MISTRAL_CLIENT:
            st.markdown('<div class="success-card">✅ Mistral AI: Active</div>', unsafe_allow_html=True)
        else:
            st.markdown('<div class="error-card">❌ Mistral AI: Not Available</div>', unsafe_allow_html=True)
        
        # KEDB status
        if KEDB_DATA:
            st.markdown(f'<div class="success-card">✅ KEDB: {len(KEDB_DATA)} patterns loaded</div>', unsafe_allow_html=True)
        else:
            st.markdown('<div class="error-card">❌ KEDB: No patterns loaded</div>', unsafe_allow_html=True)
        
        # Tickets status
        if TICKETS_DATA:
            st.markdown(f'<div class="success-card">📋 Tickets: {len(TICKETS_DATA)} total</div>', unsafe_allow_html=True)
            # Show ticket summary
            st.markdown("**📊 Ticket Summary:**")
            critical_tickets = len([t for t in TICKETS_DATA if t.get('severity') == 'Critical'])
            high_tickets = len([t for t in TICKETS_DATA if t.get('severity') == 'High'])
            medium_tickets = len([t for t in TICKETS_DATA if t.get('severity') == 'Medium'])
            st.markdown(f"🔴 Critical: {critical_tickets}")
            st.markdown(f"🟡 High: {high_tickets}")
            st.markdown(f"🟢 Medium: {medium_tickets}")
        else:
            st.markdown('<div class="success-card">📋 Tickets: 0 total</div>', unsafe_allow_html=True)
        
        # Filter controls
        st.markdown("### 🔍 Filters")
        filter_type = st.selectbox(
            "Log Type Filter",
            ['all', 'errors', 'warnings', 'info'],
            format_func=lambda x: x.title()
        )
        
        # Statistics
        st.markdown("### 📊 Statistics")
        stats = st.session_state.stats
        st.metric("Total Logs", stats['total_logs'])
        st.metric("Self-Healed", stats.get('self_healed', 0))
        st.metric("Tickets Raised", stats.get('tickets_raised', 0))
        st.metric("Hours Saved", stats.get('support_hours_saved', 0))
        
        # Runtime
        if stats['start_time']:
            runtime = datetime.now() - stats['start_time']
            st.metric("Runtime", str(runtime).split('.')[0])
    
    # Executive Summary Cards Row
    st.markdown("### 📊 Executive Dashboard")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-icon">📈</div>
            <div class="metric-value">{st.session_state.stats.get('total_logs', 0)}</div>
            <div class="metric-label">Total Events</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        self_healed = st.session_state.stats.get('self_healed', 0)
        total = st.session_state.stats.get('total_logs', 1)
        percentage = int((self_healed / total) * 100) if total > 0 else 0
        st.markdown(f"""
        <div class="metric-card success">
            <div class="metric-icon">🛠️</div>
            <div class="metric-value">{self_healed}</div>
            <div class="metric-label">Auto-Resolved ({percentage}%)</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        tickets = st.session_state.stats.get('tickets_raised', 0)
        st.markdown(f"""
        <div class="metric-card warning">
            <div class="metric-icon">🎫</div>
            <div class="metric-value">{tickets}</div>
            <div class="metric-label">Support Tickets</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        hours_saved = st.session_state.stats.get('support_hours_saved', 0)
        cost_saved = hours_saved * 100  # $100 per hour
        st.markdown(f"""
        <div class="metric-card gold">
            <div class="metric-icon">💰</div>
            <div class="metric-value">${cost_saved:,}</div>
            <div class="metric-label">Cost Savings</div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Main monitoring section with professional layout
    col1, col2 = st.columns([3, 2])
    
    with col1:
        st.markdown("### 🔍 Real-Time Pega Logs Monitoring")
        
        # Generate new log if running
        if st.session_state.running:
            # Add new log every few seconds
            if 'last_log_time' not in st.session_state or time.time() - st.session_state.get('last_log_time', 0) > 3:
                # Show spinner while generating new Pega event
                with st.spinner('🔄 Generating new Pega event...'):
                    new_log = generate_demo_log()
                    st.session_state.logs.append({
                        'timestamp': datetime.now(),
                        'log_line': new_log
                    })
                    st.session_state.stats['total_logs'] += 1
                    st.session_state.last_log_time = time.time()
                
                # Show spinner while AI analyzes the log
                with st.spinner('🤖 Analyzing with Mistral AI...'):
                    analysis = analyze_log_with_mistral(new_log)
                
                # Only process if analysis was successful
                if analysis:
                    with st.spinner('📊 Processing AI decision...'):
                        st.session_state.analyses.append({
                            'timestamp': datetime.now(),
                            'analysis': analysis,
                            'log_line': new_log
                        })
                        
                        # Update stats
                        if analysis.get('action') == 'self_healed':
                            st.session_state.stats['self_healed'] += 1
                            st.session_state.stats['support_hours_saved'] += analysis.get('support_hours_saved', 0)
                        elif analysis.get('action') == 'ticket_raised':
                            st.session_state.stats['tickets_raised'] += 1
                        
                        # Auto-save data after each log
                        save_dashboard_data()
                else:
                    print(f"⚠️ Skipping log analysis for: {new_log[:100]}...")
        
        # Get filtered logs
        filtered_logs = list(st.session_state.logs)
        if filter_type == 'errors':
            filtered_logs = [log for log in filtered_logs if '[ERROR]' in log['log_line']]
        elif filter_type == 'warnings':
            filtered_logs = [log for log in filtered_logs if '[WARN]' in log['log_line']]
        elif filter_type == 'info':
            filtered_logs = [log for log in filtered_logs if '[INFO]' in log['log_line']]
        
        if filtered_logs:
            # Create log display
            for log in reversed(filtered_logs[-20:]):  # Show last 20 logs
                # Handle timestamp - could be string or datetime object
                timestamp = log['timestamp']
                if isinstance(timestamp, str):
                    # If it's already a string, try to parse it or use as-is
                    try:
                        timestamp_obj = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        timestamp_str = timestamp_obj.strftime('%H:%M:%S')
                    except:
                        # If parsing fails, extract time from string or use first 8 chars
                        timestamp_str = timestamp.split(' ')[-1][:8] if ' ' in timestamp else timestamp[:8]
                else:
                    # If it's a datetime object
                    timestamp_str = timestamp.strftime('%H:%M:%S')
                log_line = log['log_line']
                
                # Smart color coding based on content
                if any(word in log_line.lower() for word in ['error', 'failed', 'timeout', 'critical']):
                    card_class = "log-error"
                elif any(word in log_line.lower() for word in ['warning', 'degradation', 'exceeded', 'leak']):
                    card_class = "log-warning"
                else:
                    card_class = "log-info"
                
                st.markdown(f"""
                <div class="log-entry {card_class}">
                    <div class="log-timestamp">{timestamp_str}</div>
                    <div class="log-content">{log_line}</div>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("🔄 Pega logs monitoring will display events here. Click 'Start Monitoring' to begin.")
    
    with col2:
        st.markdown("### 🤖 AI Decision Engine")
        
        if st.session_state.analyses:
            st.markdown("#### 🧠 Latest AI Decisions")
            # Show recent analyses
            for analysis_data in reversed(list(st.session_state.analyses)[-10:]):
                analysis = analysis_data['analysis']
                
                # Skip if analysis is None (failed analysis)
                if not analysis:
                    continue
                
                # Create analysis display
                anomaly = analysis.get('anomaly', 'Unknown')
                severity = analysis.get('severity', 'Unknown')
                fix = analysis.get('suggested_fix', 'No fix suggested')
                
                # Color code severity
                if severity in ['Critical', 'High']:
                    severity_color = "🔴"
                elif severity == 'Medium':
                    severity_color = "🟡"
                else:
                    severity_color = "🟢"
                
                # Get additional info based on action
                action = analysis.get('action', 'Unknown')
                # Handle timestamp - could be string or datetime object  
                timestamp = analysis_data['timestamp']
                if isinstance(timestamp, str):
                    # If it's already a string, try to parse it or use as-is
                    try:
                        timestamp_obj = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        timestamp_str = timestamp_obj.strftime('%H:%M:%S')
                    except:
                        # If parsing fails, extract time from string or use first 8 chars
                        timestamp_str = timestamp.split(' ')[-1][:8] if ' ' in timestamp else timestamp[:8]
                else:
                    # If it's a datetime object
                    timestamp_str = timestamp.strftime('%H:%M:%S')
                
                if action == 'self_healed':
                    kedb_match = analysis.get('kedb_match', 'Unknown')
                    hours_saved = analysis.get('support_hours_saved', 0)
                    st.markdown(f"""
                    <div class="ai-decision success">
                        <div class="decision-header">
                            <span class="decision-icon">✅</span>
                            <span class="decision-time">{timestamp_str}</span>
                            <span class="decision-action">AUTO-RESOLVED</span>
                        </div>
                        <div class="decision-details">
                            <strong>Issue:</strong> {anomaly[:50]}{'...' if len(anomaly) > 50 else ''}<br>
                            <strong>Action:</strong> {fix[:60]}{'...' if len(fix) > 60 else ''}<br>
                            <strong>Savings:</strong> {hours_saved} hours (${hours_saved * 100})
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                elif action == 'ticket_raised':
                    ticket_id = analysis.get('ticket_id', 'Unknown')
                    st.markdown(f"""
                    <div class="ai-decision warning">
                        <div class="decision-header">
                            <span class="decision-icon">🎫</span>
                            <span class="decision-time">{timestamp_str}</span>
                            <span class="decision-action">TICKET CREATED</span>
                        </div>
                        <div class="decision-details">
                            <strong>Issue:</strong> {anomaly[:50]}{'...' if len(anomaly) > 50 else ''}<br>
                            <strong>Ticket:</strong> {ticket_id}<br>
                            <strong>Priority:</strong> {severity_color} {severity}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown(f"""
                    <div class="analysis-container">
                        <strong>{severity_color} {anomaly}</strong><br>
                        <small>Severity: {severity}</small><br>
                        <small>Fix: {fix}</small>
                    </div>
                    """, unsafe_allow_html=True)
        else:
            st.info("No AI analysis available yet.")
    
    # Created Tickets Viewer - Moved above charts for better visibility
    st.markdown("### 🎫 Created Tickets")
    
    if TICKETS_DATA:
        # Show all created tickets in an expandable section
        with st.expander("📋 View All Created Tickets", expanded=True):
            for i, ticket in enumerate(TICKETS_DATA):
                # Color code based on severity
                if ticket.get('severity') in ['Critical', 'High']:
                    severity_color = "🔴"
                    ticket_style = "background: #ffe6e6; border: 2px solid #ff4444; border-radius: 8px; padding: 1rem; margin: 0.5rem 0;"
                elif ticket.get('severity') == 'Medium':
                    severity_color = "🟡"
                    ticket_style = "background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin: 0.5rem 0;"
                else:
                    severity_color = "🟢"
                    ticket_style = "background: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 1rem; margin: 0.5rem 0;"
                
                st.markdown(f"""
                <div style="{ticket_style}">
                    <h4>{severity_color} Ticket {ticket.get('ticket_id', 'N/A')}</h4>
                    <strong>Status:</strong> {ticket.get('status', 'N/A')}<br>
                    <strong>Severity:</strong> {ticket.get('severity', 'N/A')}<br>
                    <strong>Category:</strong> {ticket.get('category', 'N/A')}<br>
                    <strong>Anomaly:</strong> {ticket.get('anomaly', 'N/A')}<br>
                    <strong>Created:</strong> {ticket.get('timestamp', ticket.get('created_at', 'N/A'))}<br>
                    <strong>Log Line:</strong> <code>{ticket.get('log_line', 'N/A')[:100]}{'...' if len(ticket.get('log_line', '')) > 100 else ''}</code><br>
                    <strong>Description:</strong> {ticket.get('description', 'N/A')}<br>
                    <strong>Suggested Fix:</strong> {ticket.get('suggested_fix', 'N/A')}<br>
                </div>
                """, unsafe_allow_html=True)
    else:
        st.info("No tickets created yet. Start log generation to see tickets being created.")
    
    # Charts and visualizations
    st.markdown("### 📈 Analytics")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Action distribution pie chart
        if st.session_state.analyses:
            action_counts = {}
            for analysis_data in st.session_state.analyses:
                analysis = analysis_data['analysis']
                if not analysis:  # Skip failed analyses
                    continue
                action = analysis.get('action', 'Unknown')
                action_counts[action] = action_counts.get(action, 0) + 1
            
            if action_counts:
                fig_pie = px.pie(
                    values=list(action_counts.values()),
                    names=list(action_counts.keys()),
                    title="Action Distribution (Self-Heal vs Tickets)",
                    color_discrete_map={
                        'self_healed': '#4caf50',
                        'ticket_raised': '#ff9800',
                        'monitored': '#2196f3',
                        'Unknown': '#95a5a6'
                    }
                )
                st.plotly_chart(fig_pie, use_container_width=True)
    
    with col2:
        # Category distribution pie chart
        if st.session_state.analyses:
            category_counts = {}
            for analysis_data in st.session_state.analyses:
                analysis = analysis_data['analysis']
                if not analysis:  # Skip failed analyses
                    continue
                anomaly = analysis.get('anomaly', 'Unknown')
                # Extract category from anomaly (e.g., "Performance Issue - High" -> "Performance")
                if ' - ' in anomaly:
                    category = anomaly.split(' - ')[0]
                else:
                    category = 'Unknown'
                category_counts[category] = category_counts.get(category, 0) + 1
            
            if category_counts:
                fig_pie = px.pie(
                    values=list(category_counts.values()),
                    names=list(category_counts.keys()),
                    title="Issue Category Distribution",
                    color_discrete_map={
                        'Performance': '#ff6b6b',
                        'Network': '#4ecdc4',
                        'Security': '#45b7d1',
                        'Database': '#96ceb4',
                        'Application': '#feca57',
                        'Security_policy': '#e74c3c',
                        'Integration_failures': '#f39c12',
                        'Unknown': '#95a5a6'
                    }
                )
                st.plotly_chart(fig_pie, use_container_width=True)
    
    # Severity distribution chart
    st.markdown("### 🚨 Severity Distribution")
    
    if st.session_state.analyses:
        severity_counts = {}
        for analysis_data in st.session_state.analyses:
            analysis = analysis_data['analysis']
            if not analysis:  # Skip failed analyses
                continue
            severity = analysis.get('severity', 'Unknown')
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        if severity_counts:
            fig_severity = px.bar(
                x=list(severity_counts.keys()),
                y=list(severity_counts.values()),
                title="Issue Severity Distribution",
                color=list(severity_counts.keys()),
                color_discrete_map={
                    'Critical': '#ff0000',
                    'High': '#ff6b6b',
                    'Medium': '#feca57',
                    'Low': '#00b894',
                    'Unknown': '#95a5a6'
                }
            )
            fig_severity.update_layout(showlegend=False)
            st.plotly_chart(fig_severity, use_container_width=True)
    
    # Real-time metrics
    st.markdown("### 📊 Real-time Metrics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Logs", stats['total_logs'])
    
    with col2:
        st.metric("Self-Healed", stats.get('self_healed', 0))
    
    with col3:
        st.metric("Tickets Raised", stats.get('tickets_raised', 0))
    
    with col4:
        st.metric("Hours Saved", stats.get('support_hours_saved', 0))
    
    # KEDB Viewer
    st.markdown("### 🗄️ KEDB Pattern Viewer")
    
    if KEDB_DATA:
        # Show KEDB entries in an expandable section
        with st.expander("📋 View KEDB Patterns", expanded=False):
            for i, entry in enumerate(KEDB_DATA):
                st.markdown(f"""
                **Entry {i+1}:**
                - **Error**: {entry.get('error', 'N/A')}
                - **Category**: {entry.get('category', 'N/A')}
                - **Severity**: {entry.get('severity', 'N/A')}
                - **Self-Healable**: {'✅ Yes' if entry.get('self_healable') else '❌ No'}
                - **Hours Saved**: {entry.get('support_hours_saved', 0)}
                - **Fix**: {entry.get('fix', 'N/A')}
                ---
                """)
    else:
        st.warning("No KEDB patterns loaded. Check if kebd.json exists.")
    
    # Control buttons
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🔄 Refresh Dashboard", use_container_width=True):
            st.rerun()
    
    with col2:
        if st.button("💾 Save Data", use_container_width=True):
            with st.spinner('💾 Saving dashboard data...'):
                save_dashboard_data()
            st.success("Data saved successfully!")
    
    # Auto-refresh
    if st.session_state.running:
        time.sleep(1)

        st.rerun()

if __name__ == "__main__":
    main()
