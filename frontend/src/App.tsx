import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [logs, setLogs] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total_logs: 0,
    self_healed: 0,
    tickets_raised: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // AI Analysis Workflow - Real process steps
  const [aiWorkflow] = useState([
    {
      step: 1,
      name: 'Log Generation',
      description: 'System generates Pega application logs in real-time',
      status: isMonitoring ? 'active' : 'paused',
      icon: '📊',
      details: 'Continuous monitoring of application events, errors, and system activities'
    },
    {
      step: 2,
      name: 'Mistral AI Analysis',
      description: 'AI analyzes log patterns and identifies anomalies',
      status: isMonitoring ? 'active' : 'paused',
      icon: '🤖',
      details: 'Using Mistral 7B to classify severity, categorize issues, and extract insights'
    },
    {
      step: 3,
      name: 'KEDB Matching',
      description: 'Check against Knowledge Error Database for known solutions',
      status: isMonitoring ? 'active' : 'paused',
      icon: '🔍',
      details: 'Pattern matching with 28+ known error patterns and self-healing rules'
    },
    {
      step: 4,
      name: 'Decision Engine',
      description: 'Determine action: Self-heal or Create support ticket',
      status: isMonitoring ? 'active' : 'paused',
      icon: '⚡',
      details: 'Automated decision making based on KEDB match results and severity'
    }
  ]);

  // Check backend connection
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/status');
        if (response.ok) {
          const data = await response.json();
          setBackendStatus('✅ Connected');
          setStats(data.stats);
          setIsMonitoring(data.monitoring_active);
          setIsLoading(false);
        } else {
          setBackendStatus('❌ Backend Error');
          setIsLoading(false);
        }
      } catch (error) {
        setBackendStatus('❌ Connection Failed');
        setIsLoading(false);
      }
    };
    
    checkBackend();
    const interval = setInterval(checkBackend, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, analysesRes, ticketsRes] = await Promise.all([
          fetch('http://localhost:8000/logs?limit=10'),
          fetch('http://localhost:8000/analyses?limit=10'),
          fetch('http://localhost:8000/tickets')
        ]);

        if (logsRes.ok) setLogs(await logsRes.json());
        if (analysesRes.ok) setAnalyses(await analysesRes.json());
        if (ticketsRes.ok) setTickets(await ticketsRes.json());
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (backendStatus === '✅ Connected') {
      fetchData();
      const interval = setInterval(fetchData, 2000);
      return () => clearInterval(interval);
    }
  }, [backendStatus]);

  const startMonitoring = async () => {
    try {
      await fetch('http://localhost:8000/monitoring/start', { method: 'POST' });
      setIsMonitoring(true);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const stopMonitoring = async () => {
    try {
      await fetch('http://localhost:8000/monitoring/stop', { method: 'POST' });
      setIsMonitoring(false);
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0d1117',
        color: '#c9d1d9',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #21262d',
            borderTop: '3px solid #58a6ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ margin: 0, color: '#f0f6fc', fontSize: '1.2rem', fontWeight: '500' }}>
            Ministry of Justice AI System
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#8b949e', fontSize: '0.9rem' }}>
            Initializing real-time monitoring...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      background: '#0d1117',
      minHeight: '100vh',
      color: '#c9d1d9'
    }}>
      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          background: #0d1117;
        }
        .enterprise-card {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .enterprise-card:hover {
          border-color: #58a6ff;
          box-shadow: 0 1px 0 rgba(88, 166, 255, 0.1);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
        }
        .status-dot.active {
          background: #3fb950;
          box-shadow: 0 0 6px rgba(63, 185, 80, 0.4);
        }
        .status-dot.inactive {
          background: #f85149;
          box-shadow: 0 0 6px rgba(248, 81, 73, 0.4);
        }
        .metric-value {
          font-size: 2rem;
          font-weight: 600;
          line-height: 1.2;
        }
        .log-entry {
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
          font-size: 13px;
          transition: border-color 0.2s ease;
        }
        .log-entry:hover {
          border-color: #30363d;
        }
        .log-entry.error {
          border-left: 3px solid #f85149;
          background: rgba(248, 81, 73, 0.05);
        }
        .log-entry.warn {
          border-left: 3px solid #d29922;
          background: rgba(210, 153, 34, 0.05);
        }
        .log-entry.info {
          border-left: 3px solid #58a6ff;
          background: rgba(88, 166, 255, 0.05);
        }
        .analysis-card {
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        .analysis-card:hover {
          border-color: #30363d;
        }
        .analysis-card.self-healed {
          border-left: 3px solid #3fb950;
          background: rgba(63, 185, 80, 0.05);
        }
        .analysis-card.ticket {
          border-left: 3px solid #d29922;
          background: rgba(210, 153, 34, 0.05);
        }
        .btn {
          background: #21262d;
          border: 1px solid #30363d;
          color: #f0f6fc;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn:hover {
          background: #30363d;
          border-color: #8b949e;
        }
        .btn.primary {
          background: #238636;
          border-color: #238636;
        }
        .btn.primary:hover {
          background: #2ea043;
        }
        .btn.danger {
          background: #da3633;
          border-color: #da3633;
        }
        .btn.danger:hover {
          background: #f85149;
        }
        .header-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
          color: #f0f6fc;
        }
        .header-subtitle {
          font-size: 1rem;
          margin: 4px 0 0 0;
          color: #8b949e;
        }
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #f0f6fc;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .live-indicator {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .scrollable {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .scrollable::-webkit-scrollbar-track {
          background: #161b22;
          border-radius: 3px;
        }
        .scrollable::-webkit-scrollbar-thumb {
          background: #30363d;
          border-radius: 3px;
        }
        .scrollable::-webkit-scrollbar-thumb:hover {
          background: #484f58;
        }
        .ticket-card {
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 6px;
          padding: 16px;
          transition: all 0.2s ease;
        }
        .ticket-card:hover {
          border-color: #30363d;
          transform: translateY(-1px);
        }
        .severity-badge {
          font-size: 11px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .severity-critical {
          background: rgba(248, 81, 73, 0.15);
          color: #f85149;
          border: 1px solid rgba(248, 81, 73, 0.3);
        }
        .severity-high {
          background: rgba(255, 142, 0, 0.15);
          color: #ff8e00;
          border: 1px solid rgba(255, 142, 0, 0.3);
        }
        .severity-medium {
          background: rgba(210, 153, 34, 0.15);
          color: #d29922;
          border: 1px solid rgba(210, 153, 34, 0.3);
        }
        .severity-low {
          background: rgba(63, 185, 80, 0.15);
          color: #3fb950;
          border: 1px solid rgba(63, 185, 80, 0.3);
        }
      `}</style>

      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div className="enterprise-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
              <h1 className="header-title">
                🏛️ Ministry of Justice - Saudi Arabia
              </h1>
              <p className="header-subtitle">
                AI-Powered Real-Time Log Monitoring & Incident Response System
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#8b949e' }}>Backend:</span>
                <span className="status-dot active"></span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: backendStatus.includes('✅') ? '#3fb950' : '#f85149' }}>
                  {backendStatus.replace('✅ ', '').replace('❌ ', '')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: '#8b949e' }}>Monitoring:</span>
                <span className={`status-dot ${isMonitoring ? 'active' : 'inactive'}`}></span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: isMonitoring ? '#3fb950' : '#f85149' }}>
                  {isMonitoring ? 'Active' : 'Stopped'}
                </span>
                {isMonitoring && <span className="live-indicator" style={{ color: '#3fb950', fontSize: '12px', fontWeight: '600' }}>LIVE</span>}
              </div>
            </div>
      </div>
          
          {/* Admin Controls - Hidden from regular users */}
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            opacity: 0.3,
            transition: 'opacity 0.2s ease'
          }} 
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}>
            {!isMonitoring ? (
              <button onClick={startMonitoring} className="btn" style={{ 
                padding: '4px 8px', 
                fontSize: '10px',
                background: '#238636',
                border: '1px solid #238636'
              }}>
                ▶
              </button>
            ) : (
              <button onClick={stopMonitoring} className="btn" style={{ 
                padding: '4px 8px', 
                fontSize: '10px',
                background: '#da3633',
                border: '1px solid #da3633'
              }}>
                ⏸
        </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'Total Logs', value: stats.total_logs, color: '#58a6ff', icon: '📊' },
            { label: 'Auto-Resolved', value: stats.self_healed, color: '#3fb950', icon: '🛠️' },
            { label: 'Support Tickets', value: stats.tickets_raised, color: '#d29922', icon: '🎫' },

          ].map((stat, index) => (
            <div key={index} className="enterprise-card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px', opacity: 0.8 }}>{stat.icon}</div>
              <div className="metric-value" style={{ color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#8b949e', fontWeight: '500' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          {/* Logs Panel */}
          <div className="enterprise-card" style={{ padding: '20px' }}>
            <h3 className="section-title">
              📊 Real-Time Pega Logs Monitoring
              {isMonitoring && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #21262d',
                    borderTop: '2px solid #3fb950',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#3fb950', fontWeight: '500' }}>
                    Creating logs...
                  </span>
                </div>
              )}
            </h3>
            <div className="scrollable">
              {logs.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#8b949e', 
                  padding: '40px 20px',
                  fontSize: '14px'
                }}>
                  {isMonitoring ? (
                    <div>
                      <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }}>⏳</div>
                      <div>Waiting for log data...</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }}>⏸️</div>
                      <div>Start monitoring to view real-time logs</div>
                    </div>
                  )}
                </div>
              ) : (
                logs.slice().reverse().map((log, index) => (
                  <div key={index} className={`log-entry ${
                    log.message?.includes('ERROR') ? 'error' : 
                    log.message?.includes('WARN') ? 'warn' : 'info'
                  }`}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                      fontSize: '11px',
                      color: '#8b949e'
                    }}>
                      <span style={{ fontWeight: '500' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: log.message?.includes('ERROR') ? 'rgba(248, 81, 73, 0.2)' : 
                                   log.message?.includes('WARN') ? 'rgba(210, 153, 34, 0.2)' : 
                                   'rgba(88, 166, 255, 0.2)',
                        color: log.message?.includes('ERROR') ? '#f85149' : 
                               log.message?.includes('WARN') ? '#d29922' : '#58a6ff',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {log.message?.includes('ERROR') ? 'ERROR' : 
                         log.message?.includes('WARN') ? 'WARN' : 'INFO'}
                      </span>
                    </div>
                    <div style={{ color: '#c9d1d9', lineHeight: '1.4' }}>
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="enterprise-card" style={{ padding: '20px' }}>
            <h3 className="section-title">
              🤖 AI Analysis Engine
              {analyses.length > 0 && <span className="live-indicator status-dot active"></span>}
            </h3>
            <div className="scrollable">
              {analyses.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#8b949e', 
                  padding: '40px 20px',
                  fontSize: '14px'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }}>🧠</div>
                  <div>AI analysis results will appear here</div>
                </div>
              ) : (
                analyses.slice().reverse().map((analysis, index) => (
                  <div key={index} className={`analysis-card ${
                    analysis.analysis?.action === 'self_healed' ? 'self-healed' : 'ticket'
                  }`}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: '500' }}>
                        {new Date(analysis.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: analysis.analysis?.action === 'self_healed' ? 
                          'rgba(63, 185, 80, 0.2)' : 'rgba(210, 153, 34, 0.2)',
                        color: analysis.analysis?.action === 'self_healed' ? '#3fb950' : '#d29922',
                        border: `1px solid ${analysis.analysis?.action === 'self_healed' ? 
                          'rgba(63, 185, 80, 0.3)' : 'rgba(210, 153, 34, 0.3)'}`
                      }}>
                        {analysis.analysis?.action === 'self_healed' ? '✓ Auto-Resolved' : '📋 Ticket Created'}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#f0f6fc',
                      marginBottom: '8px',
                      lineHeight: '1.3'
                    }}>
                      {analysis.analysis?.anomaly}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8b949e',
                      marginBottom: '10px'
                    }}>
                      Severity: <span className={`severity-badge severity-${analysis.analysis?.severity?.toLowerCase()}`}>
                        {analysis.analysis?.severity}
                      </span>
                    </div>
                    {analysis.analysis?.action === 'self_healed' ? (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#3fb950',
                        background: 'rgba(63, 185, 80, 0.1)',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(63, 185, 80, 0.2)'
                      }}>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>Fix Applied:</strong> {analysis.analysis?.suggested_fix}
                        </div>

                      </div>
                    ) : (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#d29922',
                        background: 'rgba(210, 153, 34, 0.1)',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(210, 153, 34, 0.2)'
                      }}>
                        <strong>Ticket ID:</strong> {analysis.analysis?.ticket_id}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Active Tickets */}
        {tickets.length > 0 && (
          <div className="enterprise-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 className="section-title">
              🎫 Active Support Tickets
              <span style={{ 
                fontSize: '12px', 
                color: '#8b949e', 
                fontWeight: '400',
                marginLeft: '8px'
              }}>
                ({tickets.length} total)
              </span>
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '16px' 
            }}>
              {tickets.slice(0, 6).map((ticket, index) => (
                <div key={index} className="ticket-card">
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: '#58a6ff',
                      fontFamily: 'SF Mono, Monaco, monospace'
                    }}>
                      {ticket.ticket_id}
                    </span>
                    <span className={`severity-badge severity-${ticket.severity?.toLowerCase()}`}>
                      {ticket.severity}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#f0f6fc',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {ticket.anomaly}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#8b949e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📅</span>
                    <span>{new Date(ticket.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis Workflow */}
        <div className="enterprise-card" style={{ padding: '20px' }}>
          <h3 className="section-title">
            🔄 AI Analysis Workflow Process
            <span style={{ 
              fontSize: '12px', 
              color: '#8b949e', 
              fontWeight: '400',
              marginLeft: '8px'
            }}>
              (Log → Mistral → KEDB → Decision)
            </span>
          </h3>
          
          {/* Workflow Steps */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            padding: '20px',
            background: '#161b22',
            borderRadius: '8px',
            border: '1px solid #21262d'
          }}>
            {aiWorkflow.map((step, index) => (
              <div key={index} style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative'
              }}>
                {/* Step Icon */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: step.status === 'active' ? 
                    'linear-gradient(135deg, #238636, #3fb950)' : '#30363d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: '12px',
                  border: `2px solid ${step.status === 'active' ? '#3fb950' : '#6e7681'}`,
                  boxShadow: step.status === 'active' ? '0 0 20px rgba(63, 185, 80, 0.3)' : 'none',
                  animation: step.status === 'active' ? 'pulse 2s infinite' : 'none'
                }}>
                  {step.icon}
                </div>
                
                {/* Step Number */}
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '15px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: step.status === 'active' ? '#3fb950' : '#6e7681',
                  color: '#0d1117',
                  fontSize: '10px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {step.step}
                </div>
                
                {/* Step Name */}
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: step.status === 'active' ? '#3fb950' : '#8b949e',
                  textAlign: 'center',
                  marginBottom: '4px'
                }}>
                  {step.name}
                </div>
                
                {/* Step Description */}
                <div style={{
                  fontSize: '11px',
                  color: '#8b949e',
                  textAlign: 'center',
                  lineHeight: '1.3',
                  maxWidth: '120px'
                }}>
                  {step.description}
                </div>
                
                {/* Arrow to next step */}
                {index < aiWorkflow.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '25px',
                    fontSize: '20px',
                    color: step.status === 'active' ? '#3fb950' : '#6e7681',
                    zIndex: 1
                  }}>
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Workflow Details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '16px' 
          }}>
            {aiWorkflow.map((step, index) => (
              <div key={index} className="enterprise-card" style={{ 
                padding: '16px',
                background: '#0d1117',
                border: `1px solid ${step.status === 'active' ? '#238636' : '#30363d'}`,
                borderLeft: `3px solid ${step.status === 'active' ? '#3fb950' : '#6e7681'}`
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>{step.icon}</span>
                  <div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: '#f0f6fc'
                    }}>
                      Step {step.step}: {step.name}
                    </div>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: step.status === 'active' ? 
                        'rgba(63, 185, 80, 0.2)' : 'rgba(110, 118, 129, 0.2)',
                      color: step.status === 'active' ? '#3fb950' : '#6e7681',
                      border: `1px solid ${step.status === 'active' ? 
                        'rgba(63, 185, 80, 0.3)' : 'rgba(110, 118, 129, 0.3)'}`
                    }}>
                      {step.status}
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#8b949e',
                  lineHeight: '1.4',
                  background: '#161b22',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #21262d'
                }}>
                  {step.details}
                </div>
              </div>
            ))}
          </div>
          
          {/* Current Process Status */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: isMonitoring ? 'rgba(63, 185, 80, 0.1)' : 'rgba(110, 118, 129, 0.1)',
            border: `1px solid ${isMonitoring ? 'rgba(63, 185, 80, 0.3)' : 'rgba(110, 118, 129, 0.3)'}`,
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: isMonitoring ? '#3fb950' : '#6e7681',
              marginBottom: '4px'
            }}>
              {isMonitoring ? '🟢 AI Workflow Active' : '⏸️ AI Workflow Paused'}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#8b949e'
            }}>
              {isMonitoring ? 
                'Real-time log analysis with Mistral AI and KEDB matching in progress' :
                'Start monitoring to activate the AI analysis workflow'
              }
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          padding: '20px',
          borderTop: '1px solid #21262d',
          color: '#8b949e',
          fontSize: '13px'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>
            🇸🇦 Ministry of Justice - Saudi Arabia
          </div>
          <div>
            Powered by Mistral AI & KEDB • Real-time Log Analysis & Self-Healing System
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;