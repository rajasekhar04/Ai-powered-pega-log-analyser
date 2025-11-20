import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react'
import type { LogEntry, Analysis } from '../types'

interface AnalyticsChartsProps {
  logs: LogEntry[]
  analyses: Analysis[]
}

const AnalyticsCharts = ({ logs, analyses }: AnalyticsChartsProps) => {
  // Prepare data for charts
  const logLevelData = logs.reduce((acc, log) => {
    const level = log.level || 'INFO'
    acc[level] = (acc[level] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(logLevelData).map(([name, value]) => ({
    name,
    value,
    color: name === 'ERROR' ? '#ef4444' : 
           name === 'WARN' ? '#f59e0b' : '#3b82f6'
  }))

  // Action distribution
  const actionData = analyses.reduce((acc, analysis) => {
    const action = analysis.action || 'analyzed'
    acc[action] = (acc[action] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const actionChartData = Object.entries(actionData).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  }))

  // Time series data (last 24 hours)
  const timeSeriesData = logs.slice(-24).map((log, index) => ({
    time: new Date(log.timestamp).getHours(),
    logs: index + 1
  }))

  const COLORS = ['#006C35', '#FFD700', '#ef4444', '#3b82f6', '#8b5cf6']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Log Level Distribution */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <PieChartIcon className="w-5 h-5 text-saudi-green" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Log Level Distribution
          </h3>
        </div>
        
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No data available
          </div>
        )}
        
        <div className="mt-4 space-y-2">
          {pieData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-saudi-green" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Actions
          </h3>
        </div>
        
        {actionChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={actionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#006C35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No analysis data available
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-saudi-green" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Log Timeline
          </h3>
        </div>
        
        {timeSeriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => `${value}:00`}
                formatter={(value) => [value, 'Logs']}
              />
              <Line 
                type="monotone" 
                dataKey="logs" 
                stroke="#006C35" 
                strokeWidth={2}
                dot={{ fill: '#006C35', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No timeline data available
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AnalyticsCharts
