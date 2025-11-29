import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, Users, FileText, ChevronRight, Check, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

function Notifications({ cambiarVista }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const resp = await apiFetch('/api/notifications?limit=10')
      if (resp?.success && resp?.data) {
        setNotifications(resp.data.notifications || [])
        setUnreadCount(resp.data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!user) return

    try {
      const resp = await apiFetch('/api/notifications/unread-count')
      if (resp?.success && resp?.data) {
        setUnreadCount(resp.data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Error cargando contador de notificaciones:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    if (user) {
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const markAsRead = async (notificationId) => {
    try {
      const resp = await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      if (resp?.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marcando notificación como leída:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const resp = await apiFetch('/api/notifications/read-all', {
        method: 'PATCH'
      })
      if (resp?.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
        )
        setUnreadCount(0)
        await loadUnreadCount()
      }
    } catch (err) {
      console.error('Error marcando todas como leídas:', err)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
    }

    setIsOpen(false)

    if (notification.type === 'friend_request' && cambiarVista) {
      cambiarVista('amigos')
    } else if (notification.type === 'official_document' && cambiarVista) {
      cambiarVista('documentos-oficiales')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return <Users className="w-5 h-5" />
      case 'official_document':
        return <FileText className="w-5 h-5" />
      case 'document_shared':
        return <FileText className="w-5 h-5" />
      case 'friend_accepted':
        return <Users className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'friend_request':
        return 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700'
      case 'official_document':
        return 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700'
      case 'document_shared':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
      case 'friend_accepted':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
      default:
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now - notifDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays < 7) return `Hace ${diffDays} d`
    return notifDate.toLocaleDateString('es-ES')
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-lg px-1.5 ring-2 ring-white dark:ring-gray-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, type: 'spring', damping: 20 }}
              className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-3"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full ml-1">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cargando notificaciones...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">No hay notificaciones</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Las notificaciones aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => (
                      <button
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full px-5 py-4 text-left transition-all duration-200 hover:bg-gradient-to-r ${
                          !notification.isRead 
                            ? 'bg-gradient-to-r from-blue-50/50 to-pink-50/30 dark:from-blue-900/20 dark:to-pink-900/10 border-l-4 border-blue-500' 
                            : 'hover:from-gray-50 hover:to-blue-50/30 dark:hover:from-gray-700/50 dark:hover:to-gray-700/30'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-2.5 rounded-xl border-2 flex-shrink-0 shadow-sm ${getNotificationColor(
                              notification.type
                            )}`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="flex-shrink-0 w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full mt-1.5 ml-2"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mt-2">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && unreadCount > 0 && (
                <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-750 flex items-center justify-end">
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-green-600 dark:text-green-400 font-semibold flex items-center gap-2 hover:text-green-700 dark:hover:text-green-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Marcar todas como leídas
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Notifications

