export interface LogEntry {
  id: number
  timestamp: string
  message: string
  level?: string
  type: string
  severity: string
  thread?: string
  app?: string
  user_id?: string
  case_id?: string
}

export interface Analysis {
  id: number
  log_id: number
  timestamp: string
  log: string
  anomaly: string
  severity: string
  suggested_fix: string
  action: string
  kedb_match?: string
  ticket_id?: string
  ticket_status?: string
  self_heal_result?: string
  support_hours_saved?: number
}

export interface Ticket {
  ticket_id: string
  timestamp: string
  title: string
  category: string
  severity: string
  description: string
  status: string
  priority: string
  assignee?: string
  created_by?: string
}

export interface SystemStatus {
  status: string
  total_logs: number
  total_analyses: number
  monitoring_active: boolean
  mistral_available: boolean
  kedb_patterns: number
}

export interface DashboardStats {
  total_logs: number
  errors: number
  warnings: number
  info: number
  self_healed: number
  tickets_raised: number
  monitoring_active: boolean
  last_updated: string
}

export interface KEDBPattern {
  id: string
  error: string
  category: string
  severity: string
  fix: string
  self_healable: boolean
  support_hours_saved: number
}

export interface WebSocketMessage {
  type: 'new_log' | 'initial_data' | 'monitoring_status' | 'error'
  log?: LogEntry
  analysis?: Analysis
  logs?: LogEntry[]
  analyses?: Analysis[]
  status?: SystemStatus
  active?: boolean
  message?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export type LogLevel = 'ALL' | 'ERROR' | 'WARN' | 'INFO'
export type ThemeMode = 'light' | 'dark'
