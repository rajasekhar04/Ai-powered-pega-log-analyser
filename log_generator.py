#!/usr/bin/env python3
"""
Pega Application Log Generator
Generates synthetic Pega logs with random anomalies for AI analysis
"""

import random
import time
import threading
from datetime import datetime
from typing import List, Dict, Optional
import json

class PegaLogGenerator:
    """Generates synthetic Pega application logs with anomalies."""
    
    def __init__(self):
        """Initialize the log generator with Pega-specific patterns."""
        self.running = False
        self.log_callbacks = []
        
        # Pega-specific log patterns
        self.log_levels = ['INFO', 'WARN', 'ERROR']
        self.thread_patterns = [
            'http-nio-8080-exec-{}',
            'pega-engine-{}',
            'workflow-processor-{}',
            'rule-cache-{}',
            'integration-service-{}'
        ]
        
        # Pega application identifiers
        self.app_identifiers = [
            'MyJusticeApp:01.01.01',
            'CaseManagement:02.03.04',
            'DocumentProcessor:01.05.02',
            'WorkflowEngine:03.01.01',
            'SecurityService:01.02.03'
        ]
        
        # Normal log messages (INFO level)
        self.normal_logs = [
            "Case {} processed successfully",
            "Document {} uploaded to repository",
            "Workflow {} completed for user {}",
            "Rule {} loaded from cache",
            "Integration call to {} completed",
            "User {} authenticated successfully",
            "Case {} assigned to {}",
            "Document {} validated successfully",
            "Workflow {} started for case {}",
            "Rule {} executed successfully"
        ]
        
        # Error patterns with their severity and fixes
        self.error_patterns = [
            {
                "pattern": "Database connection failed: {}",
                "anomaly": "Database Connection Error",
                "severity": "High",
                "suggested_fix": "Check database connectivity and restart connection pool",
                "variations": [
                    "Connection timeout after 30 seconds",
                    "Connection pool exhausted",
                    "Database server unreachable",
                    "Authentication failed for user {}"
                ]
            },
            {
                "pattern": "SLA breach detected: {}",
                "anomaly": "SLA Breach",
                "severity": "Critical",
                "suggested_fix": "Investigate processing delays and optimize workflow",
                "variations": [
                    "Case processing exceeded 5-minute SLA",
                    "Document approval took {} minutes (SLA: 2 minutes)",
                    "Workflow completion time: {} minutes (SLA: 3 minutes)",
                    "Integration response time: {} seconds (SLA: 10 seconds)"
                ]
            },
            {
                "pattern": "Rule cache overflow: {}",
                "anomaly": "Rule Cache Overflow",
                "severity": "Medium",
                "suggested_fix": "Clear rule cache and restart rule engine",
                "variations": [
                    "Cache size exceeded 1GB limit",
                    "Too many concurrent rule executions",
                    "Rule cache memory allocation failed",
                    "Cache eviction policy triggered"
                ]
            },
            {
                "pattern": "Workflow halted unexpectedly: {}",
                "anomaly": "Workflow Halt",
                "severity": "High",
                "suggested_fix": "Check workflow configuration and restart case processing service",
                "variations": [
                    "Deadlock detected in workflow {}",
                    "Workflow {} stuck in pending state",
                    "Circular dependency detected",
                    "Workflow engine timeout"
                ]
            },
            {
                "pattern": "Security policy violation: {}",
                "anomaly": "Security Policy Violation",
                "severity": "Critical",
                "suggested_fix": "Review access logs and update security policies",
                "variations": [
                    "Unauthorized access attempt to case {}",
                    "User {} attempted to access restricted document",
                    "Invalid authentication token",
                    "Cross-origin request blocked"
                ]
            },
            {
                "pattern": "Integration failure: {}",
                "anomaly": "Integration Failure",
                "severity": "Medium",
                "suggested_fix": "Check external service status and retry integration",
                "variations": [
                    "External service {} unavailable",
                    "API rate limit exceeded",
                    "Integration timeout after {} seconds",
                    "Invalid response format from {}"
                ]
            },
            {
                "pattern": "Memory allocation failed: {}",
                "anomaly": "Memory Allocation Error",
                "severity": "High",
                "suggested_fix": "Restart application and check memory usage",
                "variations": [
                    "Out of memory error during case processing",
                    "Heap space exhausted",
                    "Memory leak detected in workflow engine",
                    "Garbage collection failed"
                ]
            },
            {
                "pattern": "File system error: {}",
                "anomaly": "File System Error",
                "severity": "Medium",
                "suggested_fix": "Check disk space and file permissions",
                "variations": [
                    "Document storage quota exceeded",
                    "File {} not found",
                    "Permission denied for file {}",
                    "Disk space low on volume {}"
                ]
            }
        ]
        
        # Warning patterns
        self.warning_patterns = [
            {
                "pattern": "Performance warning: {}",
                "anomaly": "Performance Warning",
                "severity": "Low",
                "suggested_fix": "Monitor performance metrics and optimize if needed",
                "variations": [
                    "Slow database query detected",
                    "High memory usage: {}%",
                    "CPU usage above threshold: {}%",
                    "Response time degradation detected"
                ]
            },
            {
                "pattern": "Configuration warning: {}",
                "anomaly": "Configuration Warning",
                "severity": "Low",
                "suggested_fix": "Review and update configuration settings",
                "variations": [
                    "Deprecated configuration parameter used",
                    "Missing optional configuration: {}",
                    "Configuration value out of recommended range",
                    "Default configuration used for {}"
                ]
            }
        ]
    
    def generate_timestamp(self) -> str:
        """Generate a realistic timestamp."""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S,%f")[:-3]
    
    def generate_thread_id(self) -> str:
        """Generate a realistic thread identifier."""
        pattern = random.choice(self.thread_patterns)
        thread_num = random.randint(1, 50)
        return pattern.format(thread_num)
    
    def generate_user_id(self) -> str:
        """Generate a realistic user ID."""
        return f"USER_{random.randint(1000, 9999)}"
    
    def generate_case_id(self) -> str:
        """Generate a realistic case ID."""
        return f"CASE_{random.randint(100000, 999999)}"
    
    def generate_normal_log(self) -> Dict:
        """Generate a normal INFO level log."""
        message_template = random.choice(self.normal_logs)
        
        # Fill in placeholders
        if "{}" in message_template:
            placeholder_count = message_template.count("{}")
            
            if "user" in message_template.lower():
                if placeholder_count == 2:
                    message = message_template.format(self.generate_user_id(), self.generate_case_id())
                else:
                    message = message_template.format(self.generate_user_id())
            elif "case" in message_template.lower():
                if placeholder_count == 2:
                    message = message_template.format(self.generate_case_id(), self.generate_user_id())
                else:
                    message = message_template.format(self.generate_case_id())
            elif "document" in message_template.lower():
                message = message_template.format(f"DOC_{random.randint(1000, 9999)}")
            elif "workflow" in message_template.lower():
                if placeholder_count == 2:
                    message = message_template.format(f"WF_{random.randint(100, 999)}", self.generate_case_id())
                else:
                    message = message_template.format(f"WF_{random.randint(100, 999)}")
            elif "rule" in message_template.lower():
                message = message_template.format(f"RULE_{random.randint(10, 99)}")
            elif "integration" in message_template.lower():
                message = message_template.format(f"API_{random.choice(['auth', 'doc', 'case', 'workflow'])}")
            else:
                message = message_template.format(random.randint(1, 1000))
        else:
            message = message_template
        
        return {
            "timestamp": self.generate_timestamp(),
            "thread": self.generate_thread_id(),
            "level": "INFO",
            "app": random.choice(self.app_identifiers),
            "message": message,
            "user_id": self.generate_user_id(),
            "case_id": self.generate_case_id()
        }
    
    def generate_error_log(self) -> Dict:
        """Generate an ERROR level log with anomaly."""
        error_pattern = random.choice(self.error_patterns)
        variation = random.choice(error_pattern["variations"])
        
        # Fill in placeholders in variation
        if "{}" in variation:
            if "user" in variation.lower():
                variation = variation.format(self.generate_user_id())
            elif "case" in variation.lower():
                variation = variation.format(self.generate_case_id())
            elif "document" in variation.lower():
                variation = variation.format(f"DOC_{random.randint(1000, 9999)}")
            elif "workflow" in variation.lower():
                variation = variation.format(f"WF_{random.randint(100, 999)}")
            elif "integration" in variation.lower():
                variation = variation.format(f"API_{random.choice(['auth', 'doc', 'case', 'workflow'])}")
            elif "seconds" in variation.lower() or "minutes" in variation.lower():
                variation = variation.format(random.randint(30, 300))
            elif "volume" in variation.lower():
                variation = variation.format(f"/dev/sda{random.randint(1, 5)}")
            else:
                variation = variation.format(random.randint(1, 1000))
        
        message = error_pattern["pattern"].format(variation)
        
        return {
            "timestamp": self.generate_timestamp(),
            "thread": self.generate_thread_id(),
            "level": "ERROR",
            "app": random.choice(self.app_identifiers),
            "message": message,
            "user_id": self.generate_user_id(),
            "case_id": self.generate_case_id(),
            "anomaly": error_pattern["anomaly"],
            "severity": error_pattern["severity"],
            "suggested_fix": error_pattern["suggested_fix"]
        }
    
    def generate_warning_log(self) -> Dict:
        """Generate a WARN level log with anomaly."""
        warning_pattern = random.choice(self.warning_patterns)
        variation = random.choice(warning_pattern["variations"])
        
        # Fill in placeholders in variation
        if "{}" in variation:
            if "usage" in variation.lower():
                variation = variation.format(random.randint(70, 95))
            elif "configuration" in variation.lower():
                variation = variation.format(f"param_{random.randint(1, 10)}")
            else:
                variation = variation.format(random.randint(1, 1000))
        
        message = warning_pattern["pattern"].format(variation)
        
        return {
            "timestamp": self.generate_timestamp(),
            "thread": self.generate_thread_id(),
            "level": "WARN",
            "app": random.choice(self.app_identifiers),
            "message": message,
            "user_id": self.generate_user_id(),
            "case_id": self.generate_case_id(),
            "anomaly": warning_pattern["anomaly"],
            "severity": warning_pattern["severity"],
            "suggested_fix": warning_pattern["suggested_fix"]
        }
    
    def format_log_line(self, log_data: Dict) -> str:
        """Format log data into a standard log line."""
        base_format = "{timestamp} [{thread}] [{level}] [{app}] {message}"
        
        if log_data["level"] == "INFO":
            return base_format.format(**log_data)
        else:
            # Add user and case info for errors/warnings
            return f"{base_format.format(**log_data)} | User: {log_data['user_id']} | Case: {log_data['case_id']}"
    
    def generate_log(self) -> Dict:
        """Generate a single log entry with weighted probability."""
        # Weighted probability: 70% INFO, 20% WARN, 10% ERROR
        rand = random.random()
        
        if rand < 0.7:
            return self.generate_normal_log()
        elif rand < 0.9:
            return self.generate_warning_log()
        else:
            return self.generate_error_log()
    
    def add_log_callback(self, callback):
        """Add a callback function to be called when new logs are generated."""
        self.log_callbacks.append(callback)
    
    def start_generation(self, interval: float = 2.0):
        """Start continuous log generation."""
        self.running = True
        
        def generate_loop():
            while self.running:
                log_data = self.generate_log()
                log_line = self.format_log_line(log_data)
                
                # Call all registered callbacks
                for callback in self.log_callbacks:
                    try:
                        callback(log_data, log_line)
                    except Exception as e:
                        print(f"Error in log callback: {e}")
                
                time.sleep(interval)
        
        # Start generation in a separate thread
        thread = threading.Thread(target=generate_loop, daemon=True)
        thread.start()
    
    def stop_generation(self):
        """Stop log generation."""
        self.running = False

# Example usage
if __name__ == "__main__":
    generator = PegaLogGenerator()
    
    def print_log(log_data, log_line):
        print(log_line)
    
    generator.add_log_callback(print_log)
    generator.start_generation(interval=1.0)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        generator.stop_generation()
        print("\nLog generation stopped.")
