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

const PremiumDashboard = () => {
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
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedLogLevel, setSelectedLogLevel] = useState('ALL')

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

        const logsResponse = await apiService.getLogs(15)
        if (logsResponse.data) {
          setLogs(logsResponse.data.logs)
        }

        const analysesResponse = await apiService.getAnalyses(10)
        if (analysesResponse.data) {
          setAnalyses(analysesResponse.data.analyses)
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    loadInitialData()

    const ws = apiService.createWebSocketConnection(
      (data: any) => {
        if (data.type === 'new_log' && data.data) {
          setLogs(prev => [...prev.slice(-14), data.data])
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
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 25%, #334155 50%, #475569 75%, #64748B 100%)',
      color: 'white',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(0, 108, 53, 0.95) 0%, rgba(0, 74, 36, 0.98) 50%, rgba(0, 50, 25, 1) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          padding: '1.5rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <motion.div
              animate={{ rotate: isMonitoring ? 360 : 0 }}
              transition={{ duration: 2, repeat: isMonitoring ? Infinity : 0, ease: "linear" }}
              style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)'
              }}
            >
              🛡️
            </motion.div>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '700',
                margin: 0,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FFD700 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                وزارة العدل - المملكة العربية السعودية
              </h1>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '500',
                margin: '0.25rem 0 0 0',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Ministry of Justice - Kingdom of Saudi Arabia
              </h2>
              <p style={{
                fontSize: '0.875rem',
                margin: '0.25rem 0 0 0',
                color: 'rgba(255, 215, 0, 0.8)',
                fontWeight: '500'
              }}>
                🤖 AI-Powered Pega Log Intelligence System
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{
              textAlign: 'right',
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <div style={{ fontWeight: '600' }}>
                {currentTime.toLocaleDateString('ar-SA', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFD700' }}>
                {currentTime.toLocaleTimeString('ar-SA')}
              </div>
            </div>
            
            <motion.div
              animate={{ 
                scale: isMonitoring ? [1, 1.05, 1] : 1,
                boxShadow: isMonitoring ? [
                  '0 0 20px rgba(16, 185, 129, 0.5)',
                  '0 0 30px rgba(16, 185, 129, 0.8)',
                  '0 0 20px rgba(16, 185, 129, 0.5)'
                ] : '0 0 20px rgba(239, 68, 68, 0.5)'
              }}
              transition={{ duration: 2, repeat: isMonitoring ? Infinity : 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: isMonitoring ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `2px solid ${isMonitoring ? '#10B981' : '#EF4444'}`,
                borderRadius: '1rem',
                padding: '1rem 1.5rem',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: isMonitoring ? '#10B981' : '#EF4444'
              }}></div>
              <span style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: isMonitoring ? '#10B981' : '#EF4444'
              }}>
                {isMonitoring ? 'نظام المراقبة نشط' : 'نظام المراقبة متوقف'}
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Control Center */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '2rem',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '2rem',
          padding: '2rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <div>
            <h3 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              margin: 0,
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🎛️ مركز التحكم الذكي | AI Control Center
            </h3>
            <p style={{
              margin: '0.5rem 0 0 0',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1rem'
            }}>
              Intelligent monitoring and automated incident response system
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartMonitoring}
              disabled={isMonitoring}
              style={{
                background: isMonitoring ? 
                  'linear-gradient(135deg, rgba(156, 163, 175, 0.3) 0%, rgba(107, 114, 128, 0.3) 100%)' :
                  'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: isMonitoring ? 'rgba(255,255,255,0.5)' : 'white',
                border: 'none',
                borderRadius: '1rem',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isMonitoring ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: isMonitoring ? 'none' : '0 8px 25px rgba(16, 185, 129, 0.3)'
              }}
            >
              ▶️ بدء المراقبة | Start AI Monitoring
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStopMonitoring}
              disabled={!isMonitoring}
              style={{
                background: !isMonitoring ? 
                  'linear-gradient(135deg, rgba(156, 163, 175, 0.3) 0%, rgba(107, 114, 128, 0.3) 100%)' :
                  'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: !isMonitoring ? 'rgba(255,255,255,0.5)' : 'white',
                border: 'none',
                borderRadius: '1rem',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: !isMonitoring ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: !isMonitoring ? 'none' : '0 8px 25px rgba(239, 68, 68, 0.3)'
              }}
            >
              ⏸️ إيقاف المراقبة | Stop Monitoring
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Premium Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        margin: '0 2rem 2rem 2rem'
      }}>
        {[
          { 
            icon: '📊', 
            title: 'إجمالي السجلات', 
            subtitle: 'Total Logs', 
            value: stats.total_logs, 
            color: '#06B6D4',
            bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)',
            border: 'rgba(6, 182, 212, 0.3)'
          },
          { 
            icon: '❌', 
            title: 'الأخطاء الحرجة', 
            subtitle: 'Critical Errors', 
            value: stats.total_errors, 
            color: '#EF4444',
            bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: 'rgba(239, 68, 68, 0.3)'
          },
          { 
            icon: '⚠️', 
            title: 'التحذيرات', 
            subtitle: 'Warnings', 
            value: stats.total_warnings, 
            color: '#F59E0B',
            bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: 'rgba(245, 158, 11, 0.3)'
          },
          { 
            icon: '🎫', 
            title: 'التذاكر المُنشأة', 
            subtitle: 'Tickets Created', 
            value: stats.total_tickets, 
            color: '#8B5CF6',
            bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
            border: 'rgba(139, 92, 246, 0.3)'
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: `0 25px 50px ${stat.color}40`
            }}
            style={{
              background: stat.bg,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${stat.border}`,
              borderRadius: '2rem',
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle, ${stat.color}10 0%, transparent 70%)`,
              pointerEvents: 'none'
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {stat.icon}
              </div>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: stat.color,
                textAlign: 'center',
                marginBottom: '0.5rem',
                textShadow: `0 0 20px ${stat.color}50`
              }}>
                {stat.value.toLocaleString()}
              </div>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'white',
                textAlign: 'center',
                marginBottom: '0.25rem'
              }}>
                {stat.title}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center'
              }}>
                {stat.subtitle}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Premium Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        margin: '0 2rem 2rem 2rem',
        minHeight: '600px'
      }}>
        {/* Live Log Stream */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '2rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
            padding: '2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: 0,
                color: '#06B6D4'
              }}>
                📡 البث المباشر للسجلات | Live Log Stream
              </h3>
              {isMonitoring && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    backgroundColor: '#EF4444',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🔴 LIVE
                </motion.div>
              )}
            </div>

            {/* Log Level Filter */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {['ALL', 'ERROR', 'WARN', 'INFO'].map(level => (
                <motion.button
                  key={level}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedLogLevel(level)}
                  style={{
                    backgroundColor: selectedLogLevel === level ? 
                      (level === 'ERROR' ? '#EF4444' : level === 'WARN' ? '#F59E0B' : level === 'INFO' ? '#10B981' : '#06B6D4') :
                      'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {level === 'ALL' ? 'جميع السجلات' : level === 'ERROR' ? 'أخطاء' : level === 'WARN' ? 'تحذيرات' : 'معلومات'}
                </motion.button>
              ))}
            </div>
          </div>

          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '1rem'
          }}>
            <AnimatePresence>
              {filteredLogs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  {isMonitoring ? '🔄 في انتظار السجلات...' : '⏸️ ابدأ المراقبة لعرض السجلات'}
                </motion.div>
              ) : (
                filteredLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      background: log.level === 'ERROR' ? 
                        'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)' :
                        log.level === 'WARN' ?
                        'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)' :
                        'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      border: `1px solid ${
                        log.level === 'ERROR' ? 'rgba(239, 68, 68, 0.3)' :
                        log.level === 'WARN' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                      }`,
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        backgroundColor: log.level === 'ERROR' ? '#EF4444' : 
                                       log.level === 'WARN' ? '#F59E0B' : '#10B981',
                        color: 'white',
                        padding: '0.375rem 1rem',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {log.level || 'INFO'}
                      </span>
                      <span style={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>
                        {log.timestamp}
                      </span>
                      {log.app && (
                        <span style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.9)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {log.app}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      color: 'white', 
                      lineHeight: '1.6',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      marginBottom: '1rem'
                    }}>
                      {log.message}
                    </div>
                    {(log.user_id || log.case_id) && (
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.7)'
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

        {/* AI Analysis Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '2rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(255, 215, 0, 0.1)'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            color: '#1A202C',
            padding: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0
            }}>
              🤖 الذكاء الاصطناعي والاستجابة | AI Analysis & Response
            </h3>
            <p style={{
              margin: '0.5rem 0 0 0',
              opacity: 0.8,
              fontSize: '1rem'
            }}>
              Mistral 7B • KEDB Integration • Auto-healing
            </p>
          </div>

          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '1rem'
          }}>
            <AnimatePresence>
              {analyses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  {isMonitoring ? '🤖 الذكاء الاصطناعي يحلل السجلات...' : '⏸️ ابدأ المراقبة للتحليل الذكي'}
                </motion.div>
              ) : (
                analyses.map((analysis, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      background: analysis.analysis.severity === 'Critical' ?
                        'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)' :
                        analysis.analysis.severity === 'High' ?
                        'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)' :
                        analysis.analysis.severity === 'Medium' ?
                        'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)' :
                        'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      border: `1px solid ${
                        analysis.analysis.severity === 'Critical' ? 'rgba(239, 68, 68, 0.3)' :
                        analysis.analysis.severity === 'High' ? 'rgba(245, 158, 11, 0.3)' :
                        analysis.analysis.severity === 'Medium' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                      }`,
                      borderRadius: '1.5rem',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        backgroundColor: analysis.analysis.severity === 'Critical' ? '#EF4444' :
                                       analysis.analysis.severity === 'High' ? '#F59E0B' :
                                       analysis.analysis.severity === 'Medium' ? '#3B82F6' : '#10B981',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {analysis.analysis.severity}
                      </span>
                      <span style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        padding: '0.375rem 1rem',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {analysis.analysis.anomaly}
                      </span>
                    </div>

                    <div style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: '1rem',
                      borderRadius: '1rem',
                      marginBottom: '1rem',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: '1.5'
                    }}>
                      {analysis.log_message}
                    </div>

                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '1rem',
                      borderRadius: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        color: '#FFD700',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        🔧 الحل المقترح | Suggested Fix:
                      </div>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.875rem',
                        lineHeight: '1.5'
                      }}>
                        {analysis.analysis.suggested_fix}
                      </div>
                    </div>

                    {analysis.analysis.self_heal_result && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '1rem',
                          padding: '1rem',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <div style={{
                          color: '#10B981',
                          fontWeight: '700',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          ✅ <span>تم الإصلاح التلقائي | Self-Healed:</span>
                        </div>
                        <div style={{
                          color: 'white',
                          fontSize: '0.875rem',
                          marginTop: '0.5rem'
                        }}>
                          {analysis.analysis.self_heal_result}
                        </div>
                      </motion.div>
                    )}

                    {analysis.analysis.ticket_id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          borderRadius: '1rem',
                          padding: '1rem'
                        }}
                      >
                        <div style={{
                          color: '#8B5CF6',
                          fontWeight: '700',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          🎫 <span>تم إنشاء تذكرة | Ticket Created:</span>
                        </div>
                        <div style={{
                          color: 'white',
                          fontSize: '0.875rem',
                          marginTop: '0.5rem',
                          fontFamily: 'monospace'
                        }}>
                          {analysis.analysis.ticket_id}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Premium Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          background: 'linear-gradient(135deg, rgba(0, 108, 53, 0.8) 0%, rgba(0, 74, 36, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 215, 0, 0.2)',
          padding: '2rem',
          textAlign: 'center',
          marginTop: '2rem'
        }}
      >
        <div style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFD700 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🇸🇦 وزارة العدل - المملكة العربية السعودية | Ministry of Justice - Kingdom of Saudi Arabia
        </div>
        <div style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.875rem'
        }}>
          نظام مراقبة السجلات الذكي • AI-Powered Log Intelligence System
          {isMonitoring && (
            <span style={{ 
              color: '#10B981', 
              fontWeight: '600',
              marginLeft: '1rem'
            }}>
              • النظام نشط ويراقب
            </span>
          )}
        </div>
      </motion.footer>
    </div>
  )
}

export default PremiumDashboard
