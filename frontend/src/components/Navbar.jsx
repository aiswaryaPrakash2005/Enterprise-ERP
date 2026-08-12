import { useState, useEffect } from 'react'
import { Bell, Sun, Moon, Search } from 'lucide-react'
import { getNotifications, markNotifRead } from '../services/api'

export default function Navbar({ title }) {
  const [notifs, setNotifs] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await getNotifications()
      setNotifs(res.data)
    } catch (e) {}
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  const handleMarkRead = async (id) => {
    try {
      await markNotifRead(id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {}
  }

  const typeColor = (type) => {
    if (type === 'low_stock') return 'text-amber-400'
    if (type === 'pending_purchase') return 'text-blue-400'
    return 'text-emerald-400'
  }

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-lg font-semibold font-heading text-white">{title}</h1>
      
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-4 h-4 text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 glass-card rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50 border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Notifications</span>
                <span className="text-xs text-gray-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications</div>
                ) : notifs.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors ${!n.is_read ? 'bg-gray-800/30' : ''}`}
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <div className={`text-xs font-semibold ${typeColor(n.type)} mb-0.5`}>{n.title}</div>
                    <div className="text-xs text-gray-400 leading-relaxed">{n.message}</div>
                    {!n.is_read && <div className="text-xs text-cyan-400 mt-1">Click to mark as read</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
