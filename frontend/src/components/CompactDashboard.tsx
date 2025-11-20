import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiService } from '../services/api'

interface LogEntry {
  timestamp: string
  level: string
  message: string
  thread?: string
  app?: string
  user_id?: string
  case_id?: string
}

interface Analysis {
  timestamp: string
  log_message: string
  analysis: {
    anomaly: string
    severity: string
    suggested_fix: string
    ticket_id?: string
    self_heal_result?: string
  }
}

interface Ticket {
  ticket_id: string
  timestamp: string
  severity: string
  anomaly: string
  description: string
  status: string
}

const CompactDashboard = () => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState({
    total_logs: 0,
    total_errors: 0,
    total_warnings: 0,
    total_tickets: 0,
    total_self_heals: 0,
    monitoring_active: false
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedLogLevel, setSelectedLogLevel] = useState('ALL')
  const [isAdminMode, setIsAdminMode] = useState(false)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load initial data and WebSocket
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const statusResponse = await apiService.getStatus()
        if (statusResponse.data) {
          setIsMonitoring(statusResponse.data.monitoring_active)
          if (statusResponse.data.stats) {
            setStats(statusResponse.data.stats)
          }
        }

        const logsResponse = await apiService.getLogs(20)
        if (logsResponse.data) {
          setLogs(logsResponse.data.logs)
        }

        const analysesResponse = await apiService.getAnalyses(15)
        if (analysesResponse.data) {
          setAnalyses(analysesResponse.data.analyses)
        }

        const ticketsResponse = await apiService.getTickets()
        if (ticketsResponse.data) {
          setTickets(ticketsResponse.data.tickets || [])
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    loadInitialData()

    const ws = apiService.createWebSocketConnection(
      (data: any) => {
        if (data.type === 'new_log' && data.data) {
          setLogs(prev => [...prev.slice(-19), data.data])
        } else if (data.type === 'new_analysis' && data.data) {
          setAnalyses(prev => [...prev.slice(-14), data.data])
          
          // Extract ticket if created
          if (data.data.analysis?.ticket_id) {
            const newTicket: Ticket = {
              ticket_id: data.data.analysis.ticket_id,
              timestamp: data.data.timestamp,
              severity: data.data.analysis.severity,
              anomaly: data.data.analysis.anomaly,
              description: data.data.log_message,
              status: 'Open'
            }
            setTickets(prev => [newTicket, ...prev.slice(0, 9)])
          }
        } else if (data.type === 'stats_update' && data.data) {
          setStats(data.data)
        } else if (data.type === 'tickets_update' && data.data) {
          setTickets(data.data)
        } else if (data.type === 'monitoring_status' && data.data) {
          setIsMonitoring(data.data.active)
        } else if (data.type === 'initial_data' && data.data) {
          if (data.data.logs) setLogs(data.data.logs)
          if (data.data.analyses) setAnalyses(data.data.analyses)
          if (data.data.tickets) setTickets(data.data.tickets)
          if (data.data.stats) setStats(data.data.stats)
          setIsMonitoring(data.data.monitoring_active)
        }
      },
      (error) => console.error('WebSocket error:', error)
    )

    return () => ws?.close()
  }, [])

  const handleStartMonitoring = async () => {
    try {
      const response = await apiService.startMonitoring()
      if (response.data) {
        setIsMonitoring(true)
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error)
    }
  }

  const handleStopMonitoring = async () => {
    try {
      const response = await apiService.stopMonitoring()
      if (response.data) {
        setIsMonitoring(false)
      }
    } catch (error) {
      console.error('Failed to stop monitoring:', error)
    }
  }

  const filteredLogs = logs.filter(log => 
    selectedLogLevel === 'ALL' || log.level === selectedLogLevel
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fff8 0%, #E8F5E8 50%, #e8f5e8 100%)',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      padding: '1rem'
    }}>
      {/* Compact Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #006C35 0%, #004A24 100%)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '1rem',
          boxShadow: '0 4px 12px rgba(0, 108, 53, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🛡️</div>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}>
              وزارة العدل - المملكة العربية السعودية
            </h1>
            <p style={{
              fontSize: '0.9rem',
              margin: '0.25rem 0 0 0',
              opacity: 0.9
            }}>
              Ministry of Justice - Kingdom of Saudi Arabia | Pega Log Intelligence
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            textAlign: 'right',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: '600', color: '#FFD700' }}>
              {currentTime.toLocaleTimeString('ar-SA')}
            </div>
            <div style={{ opacity: 0.8 }}>
              {currentTime.toLocaleDateString('ar-SA')}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: isMonitoring ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${isMonitoring ? '#10B981' : '#EF4444'}`,
            borderRadius: '8px',
            padding: '0.5rem 1rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isMonitoring ? '#10B981' : '#EF4444'
            }}></div>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: isMonitoring ? '#10B981' : '#EF4444'
            }}>
              {isMonitoring ? 'نشط' : 'متوقف'}
            </span>
          </div>

          {/* Admin Toggle - Hidden for regular users */}
          <div 
            style={{
              fontSize: '0.7rem',
              opacity: 0.3,
              cursor: 'pointer',
              padding: '0.25rem',
              userSelect: 'none'
            }}
            onClick={() => setIsAdminMode(!isAdminMode)}
            title="Admin Access"
          >
            ⚙️
          </div>
        </div>
      </motion.div>

      {/* Compact Control Panel - Admin Only */}
      {isAdminMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            backgroundColor: 'white',
            border: '2px solid #006C35',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(0, 108, 53, 0.15)'
          }}
        >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: 0,
              color: '#006C35',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🎛️ مركز التحكم | Control Center
            </h3>
            <p style={{
              margin: '0.25rem 0 0 0',
              color: '#666',
              fontSize: '0.85rem'
            }}>
              AI-powered monitoring and incident response
            </p>
          </div>
          
          {/* Small Admin Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '0.25rem',
            opacity: 0.7
          }}>
            <button
              onClick={handleStartMonitoring}
              disabled={isMonitoring}
              style={{
                background: isMonitoring ? '#E5E7EB' : '#10B981',
                color: isMonitoring ? '#9CA3AF' : 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.7rem',
                fontWeight: '500',
                cursor: isMonitoring ? 'not-allowed' : 'pointer',
                opacity: isMonitoring ? 0.5 : 1
              }}
              title="Start Monitoring"
            >
              ▶️
            </button>

            <button
              onClick={handleStopMonitoring}
              disabled={!isMonitoring}
              style={{
                background: !isMonitoring ? '#E5E7EB' : '#EF4444',
                color: !isMonitoring ? '#9CA3AF' : 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.7rem',
                fontWeight: '500',
                cursor: !isMonitoring ? 'not-allowed' : 'pointer',
                opacity: !isMonitoring ? 0.5 : 1
              }}
              title="Stop Monitoring"
            >
              ⏸️
            </button>
          </div>
        </div>
        </motion.div>
      )}

      {/* Compact Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {[
          { 
            icon: '📊', 
            title: 'إجمالي السجلات', 
            subtitle: 'Total Logs', 
            value: stats.total_logs, 
            color: '#006C35'
          },
          { 
            icon: '❌', 
            title: 'الأخطاء', 
            subtitle: 'Errors', 
            value: stats.total_errors, 
            color: '#EF4444'
          },
          { 
            icon: '⚠️', 
            title: 'التحذيرات', 
            subtitle: 'Warnings', 
            value: stats.total_warnings, 
            color: '#F59E0B'
          },
          { 
            icon: '🎫', 
            title: 'التذاكر', 
            subtitle: 'Tickets', 
            value: stats.total_tickets, 
            color: '#8B5CF6'
          },
          { 
            icon: '🔧', 
            title: 'الإصلاح التلقائي', 
            subtitle: 'Self Heals', 
            value: stats.total_self_heals || 0, 
            color: '#10B981'
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            style={{
              backgroundColor: 'white',
              border: `2px solid ${stat.color}`,
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {stat.icon}
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: stat.color,
              marginBottom: '0.25rem'
            }}>
              {stat.value.toLocaleString()}
            </div>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#333',
              marginBottom: '0.125rem'
            }}>
              {stat.title}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#666'
            }}>
              {stat.subtitle}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tickets Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        style={{
          backgroundColor: 'white',
          border: '2px solid #8B5CF6',
          borderRadius: '12px',
          marginBottom: '1rem',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)'
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          color: 'white',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            margin: 0
          }}>
            🎫 التذاكر المُنشأة | Created Tickets
          </h3>
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {tickets.length}
          </span>
        </div>

        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '0.75rem'
        }}>
          {tickets.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#666',
              fontSize: '0.9rem'
            }}>
              {isMonitoring ? '🎫 لا توجد تذاكر حتى الآن...' : '⏸️ ابدأ المراقبة'}
            </div>
          ) : (
            tickets.slice(0, 5).map((ticket, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  backgroundColor: ticket.severity === 'Critical' ? '#FEF2F2' :
                    ticket.severity === 'High' ? '#FFFBEB' : '#F3E8FF',
                  border: `1px solid ${
                    ticket.severity === 'Critical' ? '#FECACA' :
                    ticket.severity === 'High' ? '#FED7AA' : '#E9D5FF'
                  }`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#8B5CF6'
                  }}>
                    {ticket.ticket_id}
                  </span>
                  <span style={{
                    backgroundColor: ticket.severity === 'Critical' ? '#EF4444' :
                                   ticket.severity === 'High' ? '#F59E0B' : '#8B5CF6',
                    color: 'white',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    {ticket.severity}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '0.25rem'
                }}>
                  {ticket.anomaly}
                </div>
                
                <div style={{
                  fontSize: '0.75rem',
                  color: '#666',
                  lineHeight: '1.3',
                  marginBottom: '0.5rem'
                }}>
                  {ticket.description.length > 80 ? 
                    ticket.description.substring(0, 80) + '...' : 
                    ticket.description}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: '#666'
                }}>
                  <span>📅 {ticket.timestamp?.split(' ')[1]}</span>
                  <span style={{
                    backgroundColor: '#E5E7EB',
                    color: '#374151',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '4px'
                  }}>
                    {ticket.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Compact Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem'
      }}>
        {/* Compact Log Stream */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            backgroundColor: 'white',
            border: '2px solid #006C35',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 108, 53, 0.15)'
          }}
        >
          <div style={{
            backgroundColor: '#006C35',
            color: 'white',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              margin: 0
            }}>
              📡 البث المباشر | Live Logs
            </h3>
            {isMonitoring && (
              <span style={{
                backgroundColor: '#EF4444',
                color: 'white',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: '700'
              }}>
                LIVE
              </span>
            )}
          </div>

          {/* Compact Log Level Filter */}
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            gap: '0.5rem'
          }}>
            {['ALL', 'ERROR', 'WARN', 'INFO'].map(level => (
              <button
                key={level}
                onClick={() => setSelectedLogLevel(level)}
                style={{
                  backgroundColor: selectedLogLevel === level ? 
                    (level === 'ERROR' ? '#EF4444' : level === 'WARN' ? '#F59E0B' : level === 'INFO' ? '#10B981' : '#006C35') :
                    'transparent',
                  color: selectedLogLevel === level ? 'white' : '#666',
                  border: selectedLogLevel === level ? 'none' : '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {level === 'ALL' ? 'الكل' : level === 'ERROR' ? 'خطأ' : level === 'WARN' ? 'تحذير' : 'معلومات'}
              </button>
            ))}
          </div>

          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.75rem'
          }}>
            <AnimatePresence>
              {filteredLogs.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '0.9rem'
                }}>
                  {isMonitoring ? '🔄 في انتظار السجلات...' : '⏸️ ابدأ المراقبة'}
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    style={{
                      backgroundColor: log.level === 'ERROR' ? '#FEF2F2' :
                        log.level === 'WARN' ? '#FFFBEB' : '#F0FDF4',
                      border: `1px solid ${
                        log.level === 'ERROR' ? '#FECACA' :
                        log.level === 'WARN' ? '#FED7AA' : '#BBF7D0'
                      }`,
                      borderRadius: '8px',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{
                        backgroundColor: log.level === 'ERROR' ? '#EF4444' : 
                                       log.level === 'WARN' ? '#F59E0B' : '#10B981',
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        {log.level || 'INFO'}
                      </span>
                      <span style={{ 
                        color: '#666', 
                        fontSize: '0.7rem',
                        fontFamily: 'monospace'
                      }}>
                        {log.timestamp?.split(' ')[1]}
                      </span>
                      {log.app && (
                        <span style={{
                          backgroundColor: '#E5E7EB',
                          color: '#374151',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem'
                        }}>
                          {log.app.split(':')[0]}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      color: '#333', 
                      lineHeight: '1.4',
                      fontSize: '0.8rem'
                    }}>
                      {log.message}
                    </div>
                    {(log.user_id || log.case_id) && (
                      <div style={{
                        marginTop: '0.375rem',
                        display: 'flex',
                        gap: '0.75rem',
                        fontSize: '0.7rem',
                        color: '#666'
                      }}>
                        {log.user_id && <span>👤 {log.user_id}</span>}
                        {log.case_id && <span>📋 {log.case_id}</span>}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Compact AI Analysis Panel */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            backgroundColor: 'white',
            border: '2px solid #FFD700',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(255, 215, 0, 0.15)'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            color: '#1A202C',
            padding: '0.75rem 1rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              margin: 0
            }}>
              🤖 التحليل الذكي | AI Analysis
            </h3>
          </div>

          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.75rem'
          }}>
            <AnimatePresence>
              {analyses.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '0.9rem'
                }}>
                  {isMonitoring ? '🤖 يحلل الذكاء الاصطناعي...' : '⏸️ ابدأ للتحليل'}
                </div>
              ) : (
                analyses.map((analysis, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    style={{
                      backgroundColor: analysis.analysis.severity === 'Critical' ? '#FEF2F2' :
                        analysis.analysis.severity === 'High' ? '#FFFBEB' :
                        analysis.analysis.severity === 'Medium' ? '#EFF6FF' : '#F0FDF4',
                      border: `1px solid ${
                        analysis.analysis.severity === 'Critical' ? '#FECACA' :
                        analysis.analysis.severity === 'High' ? '#FED7AA' :
                        analysis.analysis.severity === 'Medium' ? '#DBEAFE' : '#BBF7D0'
                      }`,
                      borderRadius: '8px',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{
                        backgroundColor: analysis.analysis.severity === 'Critical' ? '#EF4444' :
                                       analysis.analysis.severity === 'High' ? '#F59E0B' :
                                       analysis.analysis.severity === 'Medium' ? '#3B82F6' : '#10B981',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        {analysis.analysis.severity}
                      </span>
                      <span style={{
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem'
                      }}>
                        {analysis.analysis.anomaly}
                      </span>
                    </div>

                    <div style={{
                      backgroundColor: '#F9FAFB',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: '#374151',
                      lineHeight: '1.3'
                    }}>
                      {analysis.log_message.length > 100 ? 
                        analysis.log_message.substring(0, 100) + '...' : 
                        analysis.log_message}
                    </div>

                    <div style={{
                      fontSize: '0.75rem',
                      color: '#666',
                      marginBottom: '0.5rem',
                      lineHeight: '1.4'
                    }}>
                      <strong style={{ color: '#F59E0B' }}>🔧 الحل:</strong> {
                        analysis.analysis.suggested_fix.length > 80 ? 
                        analysis.analysis.suggested_fix.substring(0, 80) + '...' : 
                        analysis.analysis.suggested_fix
                      }
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.5rem'
                    }}>
                      {analysis.analysis.self_heal_result && (
                        <div style={{
                          backgroundColor: '#DCFCE7',
                          color: '#166534',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <span>🔧</span>
                          <span>إصلاح تلقائي: {analysis.analysis.self_heal_result}</span>
                        </div>
                      )}

                      {analysis.analysis.ticket_id && (
                        <div style={{
                          backgroundColor: '#F3E8FF',
                          color: '#7C3AED',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          fontFamily: 'monospace',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <span>🎫</span>
                          <span>{analysis.analysis.ticket_id}</span>
                        </div>
                      )}

                      {!analysis.analysis.self_heal_result && !analysis.analysis.ticket_id && (
                        <div style={{
                          backgroundColor: '#F0F9FF',
                          color: '#0369A1',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <span>ℹ️</span>
                          <span>تحليل فقط</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Compact Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          backgroundColor: 'white',
          border: '2px solid #006C35',
          borderRadius: '12px',
          padding: '0.75rem',
          textAlign: 'center',
          marginTop: '1rem',
          boxShadow: '0 2px 8px rgba(0, 108, 53, 0.15)'
        }}
      >
        <div style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#006C35',
          marginBottom: '0.25rem'
        }}>
          🇸🇦 وزارة العدل - المملكة العربية السعودية | Ministry of Justice
        </div>
        <div style={{
          color: '#666',
          fontSize: '0.75rem'
        }}>
          نظام مراقبة السجلات الذكي بالذكاء الاصطناعي
          {isMonitoring && (
            <span style={{ 
              color: '#10B981', 
              fontWeight: '600',
              marginLeft: '0.5rem'
            }}>
              • النظام نشط
            </span>
          )}
        </div>
      </motion.footer>
    </div>
  )
}

export default CompactDashboard
