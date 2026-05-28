'use client'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)

  // Mock notifications for UI demonstration
  const notifications = [
    { id: 1, text: "Alex accepted your friend request.", time: "10m ago" },
    { id: 2, text: "You earned the 21-Day Login Badge! 🔥", time: "1h ago" },
    { id: 3, text: "Reminder: Meditation session starts in 2 hours.", time: "3h ago" }
  ]

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center relative text-slate-700 hover:bg-white/30 rounded-full transition-colors cursor-pointer"
      >
        <Bell size={20} strokeWidth={1.5} />
        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#E0F2F1]"></span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-4 z-50"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                <button className="text-[10px] font-medium text-teal-600 hover:underline">Mark all as read</button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto hide-scrollbar">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100/50">
                    <p className="text-xs text-slate-700">{n.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
