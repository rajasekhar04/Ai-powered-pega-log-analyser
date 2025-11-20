import { useState, useEffect } from 'react'
import { apiService } from '../services/api'

const SimpleDashboard = () => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [stats, setStats] = useState({
    total_logs: 0,
    total_errors: 0,
    total_warnings: 0,
    monitoring_active: false
  })

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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const statusResponse = await apiService.getStatus()
        if (statusResponse.data) {
          setIsMonitoring(statusResponse.data.monitoring_active)
          if (statusResponse.data.stats) {
            setStats(statusResponse.data.stats)
          }
        }

        const logsResponse = await apiService.getLogs(10)
        if (logsResponse.data) {
          setLogs(logsResponse.data.logs)
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    loadData()
  }, [])

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = apiService.createWebSocketConnection(
      (data: any) => {
        if (data.type === 'new_log') {
          setLogs(prev => [...prev.slice(-9), data.data])
        } else if (data.type === 'stats_update') {
          setStats(data.data)
        } else if (data.type === 'monitoring_status') {
          setIsMonitoring(data.data.active)
        }
      },
      (error) => console.error('WebSocket error:', error)
    )

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  return (
    <div style={{ padding: '1rem' }}>
      {/* Control Panel */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#006C35',
            margin: 0
          }}>
            🎛️ Log Monitoring Control
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: isMonitoring ? '#E8F5E8' : '#FEE2E2',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            border: `2px solid ${isMonitoring ? '#006C35' : '#EF4444'}`
          }}>
            <div style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              backgroundColor: isMonitoring ? '#006C35' : '#EF4444'
            }}></div>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: '500',
              color: isMonitoring ? '#006C35' : '#EF4444'
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
              backgroundColor: isMonitoring ? '#9CA3AF' : '#006C35',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: isMonitoring ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ▶️ Start Monitoring
          </button>

          <button
            onClick={handleStopMonitoring}
            disabled={!isMonitoring}
            style={{
              backgroundColor: !isMonitoring ? '#9CA3AF' : '#EF4444',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: !isMonitoring ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ⏸️ Stop Monitoring
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#006C35' }}>
            {stats.total_logs}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Logs</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#EF4444' }}>
            {stats.total_errors}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Errors</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>
            {stats.total_warnings}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Warnings</div>
        </div>
      </div>

      {/* Recent Logs */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#006C35',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📝 Recent Logs
          {isMonitoring && (
            <span style={{
              fontSize: '0.75rem',
              backgroundColor: '#006C35',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem'
            }}>
              LIVE
            </span>
          )}
        </h3>

        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #E5E7EB',
          borderRadius: '0.375rem'
        }}>
          {logs.length === 0 ? (
            <div style={{
              padding: '2rem',
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
                  padding: '0.75rem',
                  borderBottom: index < logs.length - 1 ? '1px solid #E5E7EB' : 'none',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{
                    backgroundColor: log.level === 'ERROR' ? '#EF4444' : 
                                   log.level === 'WARN' ? '#F59E0B' : '#10B981',
                    color: 'white',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {log.level || 'INFO'}
                  </span>
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>
                    {log.timestamp}
                  </span>
                </div>
                <div style={{ color: '#333' }}>
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default SimpleDashboard
