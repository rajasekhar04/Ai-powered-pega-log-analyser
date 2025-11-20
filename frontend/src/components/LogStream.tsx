import { motion, AnimatePresence } from 'framer-motion'
import { Clock, User, Hash, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { formatTimestamp, getLogLevelColor } from '../lib/utils'
import type { LogEntry } from '../types'

interface LogStreamProps {
  logs: LogEntry[]
  isMonitoring: boolean
}

const LogStream = ({ logs, isMonitoring }: LogStreamProps) => {
  const getLogIcon = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return <AlertCircle className="w-4 h-4" />
      case 'WARN':
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Real-time Log Stream
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {logs.length} logs
            </span>
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div className="h-96 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {logs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
            >
              <div className="text-center">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs available</p>
                <p className="text-sm mt-1">
                  {isMonitoring ? 'Waiting for new logs...' : 'Start monitoring to see logs'}
                </p>
              </div>
            </motion.div>
          ) : (
            logs.slice(-50).map((log, index) => (
              <motion.div
                key={`${log.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`p-3 rounded-lg border ${getLogLevelColor(log.level || 'INFO')} 
                  dark:bg-gray-800 dark:border-gray-600`}
              >
                {/* Log Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getLogIcon(log.level || 'INFO')}
                    <span className="font-medium text-sm">
                      {log.level || 'INFO'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      #{log.id}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </div>
                </div>

                {/* Log Message */}
                <div className="text-sm text-gray-800 dark:text-gray-200 mb-2 font-mono">
                  {log.message}
                </div>

                {/* Log Metadata */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {log.thread && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                      Thread: {log.thread}
                    </span>
                  )}
                  {log.user_id && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{log.user_id}</span>
                    </span>
                  )}
                  {log.case_id && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center space-x-1">
                      <Hash className="w-3 h-3" />
                      <span>{log.case_id}</span>
                    </span>
                  )}
                  {log.app && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      {log.app}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Showing last {Math.min(logs.length, 50)} entries</span>
          <span>Auto-scroll enabled</span>
        </div>
      </div>
    </motion.div>
  )
}

export default LogStream
