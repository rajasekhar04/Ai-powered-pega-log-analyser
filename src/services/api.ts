import type { 
  LogEntry, 
  Analysis, 
  Ticket, 
  SystemStatus, 
  DashboardStats, 
  KEDBPattern,
  ApiResponse 
} from '../types'

const API_BASE_URL = 'http://localhost:8000'

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  // System status and monitoring
  async getStatus(): Promise<ApiResponse<SystemStatus>> {
    return this.request<SystemStatus>('/status')
  }

  async startMonitoring(): Promise<ApiResponse<{ message: string; status: string }>> {
    return this.request('/monitoring/start', { method: 'POST' })
  }

  async stopMonitoring(): Promise<ApiResponse<{ message: string; status: string }>> {
    return this.request('/monitoring/stop', { method: 'POST' })
  }

  // Logs
  async getLogs(limit: number = 50): Promise<ApiResponse<{ logs: LogEntry[]; total: number }>> {
    return this.request<{ logs: LogEntry[]; total: number }>(`/logs?limit=${limit}`)
  }

  // Analyses
  async getAnalyses(limit: number = 50): Promise<ApiResponse<{ analyses: Analysis[]; total: number }>> {
    return this.request<{ analyses: Analysis[]; total: number }>(`/analyses?limit=${limit}`)
  }

  // Single log analysis
  async analyzeLog(logMessage: string): Promise<ApiResponse<Analysis>> {
    return this.request<Analysis>('/analyze', {
      method: 'POST',
      body: JSON.stringify({ log_message: logMessage }),
    })
  }

  // Tickets
  async getTickets(): Promise<ApiResponse<{ tickets: Ticket[]; total: number }>> {
    return this.request<{ tickets: Ticket[]; total: number }>('/tickets')
  }

  // KEDB
  async getKEDB(): Promise<ApiResponse<{ kedb: KEDBPattern[]; total: number }>> {
    return this.request<{ kedb: KEDBPattern[]; total: number }>('/kedb')
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboard/stats')
  }

  // WebSocket connection
  createWebSocketConnection(
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void
  ): WebSocket {
    const ws = new WebSocket(`ws://localhost:8000/stream`)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (onError) onError(error)
    }

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event)
      if (onClose) onClose(event)
    }

    return ws
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request('/')
      return response.data !== undefined
    } catch {
      return false
    }
  }
}

export const apiService = new ApiService()
export default apiService
