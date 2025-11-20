import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import { ThemeProvider } from './contexts/ThemeContext'
import { apiService } from './services/api'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true)
      const isHealthy = await apiService.healthCheck()
      setIsConnected(isHealthy)
      setIsLoading(false)
    }

    checkConnection()
    
    // Check connection periodically
    const interval = setInterval(checkConnection, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-green to-clean-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-saudi-green">
            Initializing Pega Log Analyzer...
          </h2>
          <p className="text-gray-600 mt-2">Connecting to AI Backend</p>
        </motion.div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md"
        >
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Backend Connection Failed
          </h2>
          <p className="text-gray-600 mb-4">
            Unable to connect to the FastAPI backend server.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Please ensure:</p>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>FastAPI server is running on port 8000</li>
              <li>Run: <code className="bg-gray-100 px-1 rounded">uvicorn api:app --reload</code></li>
              <li>Ollama is running with Mistral model</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary px-4 py-2"
          >
            Retry Connection
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-light-green to-clean-white">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Dashboard />
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
