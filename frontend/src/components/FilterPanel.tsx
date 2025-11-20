import { motion } from 'framer-motion'
import { Filter } from 'lucide-react'
import type { LogLevel } from '../types'

interface FilterPanelProps {
  currentFilter: LogLevel
  onFilterChange: (filter: LogLevel) => void
}

const FilterPanel = ({ currentFilter, onFilterChange }: FilterPanelProps) => {
  const filters: { label: string; value: LogLevel; color: string }[] = [
    { label: 'All Logs', value: 'ALL', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
    { label: 'Errors Only', value: 'ERROR', color: 'bg-red-100 hover:bg-red-200 text-red-700' },
    { label: 'Warnings Only', value: 'WARN', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' },
    { label: 'Info Only', value: 'INFO', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-center space-x-3 mb-3">
        <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-white">Log Filters</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <motion.button
            key={filter.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFilterChange(filter.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              currentFilter === filter.value
                ? 'bg-saudi-green text-white'
                : `${filter.color} dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`
            }`}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

export default FilterPanel
