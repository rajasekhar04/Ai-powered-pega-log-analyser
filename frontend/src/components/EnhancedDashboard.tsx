import { useState, useEffect } from 'react'
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

const EnhancedDashboard = () => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [stats, setStats] = useState({
    total_logs: 0,
    total_errors: 0,
    total_warnings: 0,
    total_tickets: 0,
    monitoring_active: false
  })

  // Load initial data and start WebSocket
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get status
        const statusResponse = await apiService.getStatus()
        if (statusResponse.data) {
          setIsMonitoring(statusResponse.data.monitoring_active)
          if (statusResponse.data.stats) {
            setStats(statusResponse.data.stats)
          }
        }

        // Get recent logs
        const logsResponse = await apiService.getLogs(10)
        if (logsResponse.data) {
          setLogs(logsResponse.data.logs)
        }

        // Get recent analyses
        const analysesResponse = await apiService.getAnalyses(10)
        if (analysesResponse.data) {
          setAnalyses(analysesResponse.data.analyses)
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    loadInitialData()

    // Set up WebSocket connection
    const ws = apiService.createWebSocketConnection(
      (data: any) => {
        console.log('WebSocket message received:', data)
        
        if (data.type === 'new_log' && data.data) {
          setLogs(prev => [...prev.slice(-9), data.data])
        } else if (data.type === 'new_analysis' && data.data) {
          setAnalyses(prev => [...prev.slice(-9), data.data])
        } else if (data.type === 'stats_update' && data.data) {
          setStats(data.data)
        } else if (data.type === 'monitoring_status' && data.data) {
          setIsMonitoring(data.data.active)
        } else if (data.type === 'initial_data' && data.data) {
          if (data.data.logs) setLogs(data.data.logs)
          if (data.data.analyses) setAnalyses(data.data.analyses)
          if (data.data.stats) setStats(data.data.stats)
          setIsMonitoring(data.data.monitoring_active)
        }
      },
      (error) => {
        console.error('WebSocket error:', error)
      }
    )

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const handleStartMonitoring = async () => {
    try {
      const response = await apiService.startMonitoring()
      if (response.data) {
        setIsMonitoring(true)
        console.log('Monitoring started:', response.data)
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
        console.log('Monitoring stopped:', response.data)
      }
    } catch (error) {
      console.error('Failed to stop monitoring:', error)
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      {/* Enhanced Control Panel */}
      <div style={{
        background: 'linear-gradient(135deg, #006C35 0%, #004A24 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 108, 53, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: 0,
              marginBottom: '0.5rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              🚀 AI-Powered Log Monitoring
            </h2>
            <p style={{
              margin: 0,
              opacity: 0.9,
              fontSize: '1.1rem'
            }}>
              Ministry of Justice - Saudi Arabia | Intelligent Incident Response
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            padding: '1rem 1.5rem',
            borderRadius: '0.75rem',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              backgroundColor: isMonitoring ? '#10B981' : '#EF4444',
              boxShadow: `0 0 10px ${isMonitoring ? '#10B981' : '#EF4444'}`,
              animation: isMonitoring ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              {isMonitoring ? 'MONITORING ACTIVE' : 'MONITORING STOPPED'}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleStartMonitoring}
            disabled={isMonitoring}
            style={{
              backgroundColor: isMonitoring ? 'rgba(255,255,255,0.2)' : '#FFD700',
              color: isMonitoring ? 'rgba(255,255,255,0.6)' : '#006C35',
              padding: '1rem 2rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: isMonitoring ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: isMonitoring ? 'none' : '0 4px 12px rgba(255, 215, 0, 0.3)'
            }}
          >
            ▶️ Start AI Monitoring
          </button>

          <button
            onClick={handleStopMonitoring}
            disabled={!isMonitoring}
            style={{
              backgroundColor: !isMonitoring ? 'rgba(255,255,255,0.2)' : '#EF4444',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: !isMonitoring ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: !isMonitoring ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            ⏸️ Stop Monitoring
          </button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {[
          { icon: '📊', label: 'Total Logs', value: stats.total_logs, color: '#006C35', bg: '#E8F5E8' },
          { icon: '❌', label: 'Errors', value: stats.total_errors, color: '#EF4444', bg: '#FEE2E2' },
          { icon: '⚠️', label: 'Warnings', value: stats.total_warnings, color: '#F59E0B', bg: '#FEF3C7' },
          { icon: '🎫', label: 'Tickets', value: stats.total_tickets, color: '#8B5CF6', bg: '#F3E8FF' },
        ].map((stat, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `3px solid ${stat.color}`,
            transition: 'transform 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
          >
            <div style={{
              backgroundColor: stat.bg,
              width: '4rem',
              height: '4rem',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              {stat.icon}
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: stat.color,
              marginBottom: '0.5rem'
            }}>
              {stat.value}
            </div>
            <div style={{
              color: '#666',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Logs & Analysis Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Recent Logs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #006C35 0%, #004A24 100%)',
            color: 'white',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              📝 Live Log Stream
            </h3>
            {isMonitoring && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                🔴 LIVE
              </div>
            )}
          </div>

          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '1rem'
          }}>
            {logs.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#666'
              }}>
                {isMonitoring ? '🔄 Waiting for logs...' : '⏸️ Start monitoring to see logs'}
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '0.75rem',
                    border: `2px solid ${
                      log.level === 'ERROR' ? '#EF4444' : 
                      log.level === 'WARN' ? '#F59E0B' : '#10B981'
                    }`,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      backgroundColor: log.level === 'ERROR' ? '#EF4444' : 
                                     log.level === 'WARN' ? '#F59E0B' : '#10B981',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {log.level || 'INFO'}
                    </span>
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>
                      {log.timestamp}
                    </span>
                    {log.app && (
                      <span style={{
                        backgroundColor: '#E5E7EB',
                        color: '#374151',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        {log.app}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#333', lineHeight: '1.4' }}>
                    {log.message}
                  </div>
                  {(log.user_id || log.case_id) && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#666',
                      display: 'flex',
                      gap: '1rem'
                    }}>
                      {log.user_id && <span>👤 {log.user_id}</span>}
                      {log.case_id && <span>📋 {log.case_id}</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            color: '#006C35',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              🤖 AI Analysis & Response
            </h3>
          </div>

          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '1rem'
          }}>
            {analyses.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#666'
              }}>
                {isMonitoring ? '🤖 AI analyzing logs...' : '⏸️ Start monitoring for AI analysis'}
              </div>
            ) : (
              analyses.map((analysis, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '0.75rem',
                    border: `2px solid ${
                      analysis.analysis.severity === 'Critical' ? '#EF4444' :
                      analysis.analysis.severity === 'High' ? '#F59E0B' :
                      analysis.analysis.severity === 'Medium' ? '#3B82F6' : '#10B981'
                    }`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <span style={{
                      backgroundColor: analysis.analysis.severity === 'Critical' ? '#EF4444' :
                                     analysis.analysis.severity === 'High' ? '#F59E0B' :
                                     analysis.analysis.severity === 'Medium' ? '#3B82F6' : '#10B981',
                      color: 'white',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {analysis.analysis.severity}
                    </span>
                    <span style={{
                      backgroundColor: '#E5E7EB',
                      color: '#374151',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {analysis.analysis.anomaly}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.875rem',
                    color: '#333',
                    marginBottom: '1rem',
                    fontFamily: 'monospace',
                    backgroundColor: '#F3F4F6',
                    padding: '0.75rem',
                    borderRadius: '0.5rem'
                  }}>
                    {analysis.log_message}
                  </div>

                  <div style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '1rem'
                  }}>
                    <strong>🔧 Suggested Fix:</strong> {analysis.analysis.suggested_fix}
                  </div>

                  {analysis.analysis.self_heal_result && (
                    <div style={{
                      backgroundColor: '#E8F5E8',
                      color: '#006C35',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      ✅ <strong>Self-Healed:</strong> {analysis.analysis.self_heal_result}
                    </div>
                  )}

                  {analysis.analysis.ticket_id && (
                    <div style={{
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      🎫 <strong>Ticket Created:</strong> {analysis.analysis.ticket_id}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        textAlign: 'center'
      }}>
        <p style={{
          margin: 0,
          color: '#666',
          fontSize: '0.875rem'
        }}>
          🇸🇦 Ministry of Justice - Saudi Arabia | AI-Powered Log Monitoring System
          {isMonitoring && <span style={{ color: '#10B981', fontWeight: '600' }}> • System Active & Monitoring</span>}
        </p>
      </div>
    </div>
  )
}

export default EnhancedDashboard
