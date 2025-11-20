import { motion } from 'framer-motion'
import { Brain, CheckCircle, AlertTriangle, Ticket } from 'lucide-react'
import { formatTimestamp, getSeverityColor } from '../lib/utils'
import type { Analysis } from '../types'

interface AnalysisPanelProps {
  analyses: Analysis[]
}

const AnalysisPanel = ({ analyses }: AnalysisPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-saudi-green" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Analysis
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {analyses.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No analyses available</p>
          </div>
        ) : (
          analyses.map((analysis) => (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(analysis.severity)}`}>
                  {analysis.severity}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(analysis.timestamp)}
                </span>
              </div>
              
              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                {analysis.anomaly}
              </h4>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {analysis.suggested_fix}
              </p>
              
              <div className="flex items-center space-x-2">
                {analysis.action === 'self_healed' ? (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Self-healed</span>
                  </div>
                ) : analysis.action === 'ticket_raised' ? (
                  <div className="flex items-center space-x-1 text-xs text-purple-600">
                    <Ticket className="w-3 h-3" />
                    <span>Ticket raised</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Analyzed</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default AnalysisPanel
