export interface LogEntry {
  timestamp: string;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR';
}

export interface AnalysisResult {
  timestamp: string;
  log_message: string;
  analysis: {
    anomaly: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    action: 'self_healed' | 'ticket_raised';
    suggested_fix: string;
    category: string;
    ticket_id?: string;
    kedb_match?: string;
    support_hours_saved?: number;
  };
  id: number;
}

export interface Ticket {
  ticket_id: string;
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  anomaly: string;
  description: string;
  status: 'Open' | 'Closed' | 'In Progress';
}

export interface Stats {
  total_logs: number;
  self_healed: number;
  tickets_raised: number;
}
