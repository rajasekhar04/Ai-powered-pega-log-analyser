import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Settings } from 'lucide-react'
import LogStream from './LogStream'
import AnalysisPanel from './AnalysisPanel'
import MetricCards from './MetricCards'
import TicketPanel from './TicketPanel'
import AnalyticsCharts from './AnalyticsCharts'
import FilterPanel from './FilterPanel'
import { apiService } from '../services/api'
import type { 
  LogEntry, 
  Analysis, 
  Ticket, 
  DashboardStats, 
  LogLevel,
  WebSocketMessage 
} from '../types'

const Dashboard = () => {
  // State management
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_logs: 0,
    errors: 0,
    warnings: 0,
    info: 0,
    self_healed: 0,
    tickets_raised: 0,
    monitoring_active: false,
    last_updated: new Date().toISOString()
  })
  
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<LogLevel>('ALL')
  const [websocket, setWebsocket] = useState<WebSocket | null>(null)

  // WebSocket connection
  useEffect(() => {
    const ws = apiService.createWebSocketConnection(
      (message: WebSocketMessage) => {
        switch (message.type) {
          case 'new_log':
            if (message.log) {
              setLogs(prev => [...prev.slice(-99), message.log!])
            }
            if (message.analysis) {
              setAnalyses(prev => [...prev.slice(-99), message.analysis!])
            }
            break
          
          case 'initial_data':
            if (message.logs) setLogs(message.logs)
            if (message.analyses) setAnalyses(message.analyses)
            if (message.status) {
              setStats(prev => ({
                ...prev,
                total_logs: message.status!.total_logs,
                monitoring_active: message.status!.monitoring_active
              }))
              setIsMonitoring(message.status!.monitoring_active)
            }
            break
            
          case 'monitoring_status':
            setIsMonitoring(message.active || false)
            setStats(prev => ({ ...prev, monitoring_active: message.active || false }))
            break
        }
      },
      (error) => {
        console.error('WebSocket error:', error)
      },
      (event) => {
        console.log('WebSocket closed:', event)
        setWebsocket(null)
      }
    )

    setWebsocket(ws)

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      
      try {
        const [logsRes, analysesRes, ticketsRes, statsRes] = await Promise.all([
          apiService.getLogs(50),
          apiService.getAnalyses(50),
          apiService.getTickets(),
          apiService.getDashboardStats()
        ])

        if (logsRes.data) setLogs(logsRes.data.logs)
        if (analysesRes.data) setAnalyses(analysesRes.data.analyses)
        if (ticketsRes.data) setTickets(ticketsRes.data.tickets)
        if (statsRes.data) setStats(statsRes.data)

      } catch (error) {
        console.error('Failed to load initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Control functions
  const handleStartMonitoring = async () => {
    const result = await apiService.startMonitoring()
    if (result.data) {
      setIsMonitoring(true)
      if (websocket) {
        websocket.send(JSON.stringify({ action: 'start_monitoring' }))
      }
    }
  }

  const handleStopMonitoring = async () => {
    const result = await apiService.stopMonitoring()
    if (result.data) {
      setIsMonitoring(false)
      if (websocket) {
        websocket.send(JSON.stringify({ action: 'stop_monitoring' }))
      }
    }
  }

  const handleReset = async () => {
    setLogs([])
    setAnalyses([])
    setStats({
      ...stats,
      total_logs: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      self_healed: 0,
      tickets_raised: 0
    })
  }

  // Filter logs based on selected level
  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true
    return log.level?.toUpperCase() === filter
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Monitoring Controls
          </h2>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isMonitoring
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-saudi-green hover:bg-dark-green text-white'
              }`}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Stop Monitoring</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Monitoring</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </motion.button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            isMonitoring 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span>{isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}</span>
          </div>
          
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last Updated: {new Date(stats.last_updated).toLocaleTimeString()}
          </span>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      <MetricCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Log Stream */}
        <div className="lg:col-span-2 space-y-6">
          <FilterPanel currentFilter={filter} onFilterChange={setFilter} />
          <LogStream logs={filteredLogs} isMonitoring={isMonitoring} />
        </div>

        {/* Right Column - Analysis and Tickets */}
        <div className="space-y-6">
          <AnalysisPanel analyses={analyses.slice(-10)} />
          <TicketPanel tickets={tickets.slice(-5)} />
        </div>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts logs={logs} analyses={analyses} />
    </div>
  )
}

export default Dashboard
