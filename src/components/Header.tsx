import { motion } from 'framer-motion'
import { Moon, Sun, Activity, Shield } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const Header = () => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-saudi-green to-dark-green rounded-xl shadow-lg"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            
            <div>
              <h1 className="text-2xl font-bold text-saudi-green dark:text-green-400">
                وزارة العدل - Ministry of Justice
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-Powered Pega Log Analyzer
              </p>
            </div>
          </div>

          {/* Status and Controls */}
          <div className="flex items-center space-x-4">
            {/* System Status */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                System Online
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
        >
          <span>Dashboard</span>
          <span>/</span>
          <span>Real-time Log Monitoring</span>
          <span>/</span>
          <span className="text-saudi-green dark:text-green-400 font-medium">
            AI Analysis & Self-Healing
          </span>
        </motion.div>
      </div>
    </motion.header>
  )
}

export default Header
