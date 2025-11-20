import { motion } from 'framer-motion'
import { Ticket, Clock, User, AlertCircle } from 'lucide-react'
import { formatTimestamp, getSeverityColor } from '../lib/utils'
import type { Ticket as TicketType } from '../types'

interface TicketPanelProps {
  tickets: TicketType[]
}

const TicketPanel = ({ tickets }: TicketPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Tickets
            </h3>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tickets.length} total
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {tickets.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tickets created</p>
            <p className="text-xs mt-1">Tickets will appear when unknown issues are detected</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <motion.div
              key={ticket.ticket_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                    {ticket.title || 'Untitled Ticket'}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {ticket.description || 'No description available'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(ticket.severity || 'Medium')}`}>
                  {ticket.severity || 'Medium'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(ticket.timestamp)}</span>
                  </div>
                  {ticket.assignee && (
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{ticket.assignee}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    ticket.status === 'Open' ? 'bg-red-400' :
                    ticket.status === 'In Progress' ? 'bg-yellow-400' :
                    ticket.status === 'Resolved' ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                  <span>{ticket.status || 'Open'}</span>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {ticket.ticket_id}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  ticket.category === 'Performance' ? 'bg-blue-100 text-blue-700' :
                  ticket.category === 'Security' ? 'bg-red-100 text-red-700' :
                  ticket.category === 'Database' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {ticket.category || 'General'}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default TicketPanel
