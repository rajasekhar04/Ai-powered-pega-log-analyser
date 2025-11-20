import { motion } from 'framer-motion'
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wrench, 
  Ticket 
} from 'lucide-react'
import type { DashboardStats } from '../types'

interface MetricCardsProps {
  stats: DashboardStats
}

const MetricCards = ({ stats }: MetricCardsProps) => {
  const cards = [
    {
      title: 'Total Logs',
      value: stats.total_logs,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    {
      title: 'Errors',
      value: stats.errors,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300'
    },
    {
      title: 'Warnings',
      value: stats.warnings,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-700 dark:text-yellow-300'
    },
    {
      title: 'Info',
      value: stats.info,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300'
    },
    {
      title: 'Self-Healed',
      value: stats.self_healed,
      icon: Wrench,
      color: 'bg-saudi-green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300'
    },
    {
      title: 'Tickets Raised',
      value: stats.tickets_raised,
      icon: Ticket,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          className={`${card.bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-700`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <motion.div
              key={card.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-bold ${card.textColor}`}
            >
              {card.value.toLocaleString()}
            </motion.div>
          </div>
          <h3 className={`text-sm font-medium ${card.textColor}`}>
            {card.title}
          </h3>
        </motion.div>
      ))}
    </div>
  )
}

export default MetricCards
