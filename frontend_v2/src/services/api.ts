import { LogEntry, AnalysisResult, Ticket, Stats } from '../types';

const API_BASE_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/stream';

class ApiService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // REST API calls
  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/status`);
    return response.json();
  }

  async startMonitoring() {
    const response = await fetch(`${API_BASE_URL}/monitoring/start`, {
      method: 'POST',
    });
    return response.json();
  }

  async stopMonitoring() {
    const response = await fetch(`${API_BASE_URL}/monitoring/stop`, {
      method: 'POST',
    });
    return response.json();
  }

  async getLogs(limit: number = 10): Promise<LogEntry[]> {
    const response = await fetch(`${API_BASE_URL}/logs?limit=${limit}`);
    return response.json();
  }

  async getAnalyses(limit: number = 10): Promise<AnalysisResult[]> {
    const response = await fetch(`${API_BASE_URL}/analyses?limit=${limit}`);
    return response.json();
  }

  async getTickets(): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE_URL}/tickets?frontend_version=v2`);
    return response.json();
  }

  // WebSocket connection
  connectWebSocket(onMessage: (data: any) => void) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.attemptReconnect(onMessage);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  private attemptReconnect(onMessage: (data: any) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connectWebSocket(onMessage);
      }, 2000 * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const apiService = new ApiService();
