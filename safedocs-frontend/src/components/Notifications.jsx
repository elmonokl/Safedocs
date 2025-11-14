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

  // Cerrar dropdown al hacer click fuera
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

  // Cargar notificaciones
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

  // Cargar contador de no leídas
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

  // Cargar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  // Cargar contador inicial y cada 30 segundos
  useEffect(() => {
    if (user) {
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 30000) // Cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [user])

  // Marcar como leída
  const markAsRead = async (notificationId) => {
    try {
      const resp = await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      if (resp?.success) {
        // Actualizar estado local
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

  // Marcar todas como leídas
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

  // Manejar click en notificación
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
    }

    // Cerrar dropdown
    setIsOpen(false)

    // Navegar según el tipo de notificación
    if (notification.type === 'friend_request' && cambiarVista) {
      cambiarVista('amigos')
    } else if (notification.type === 'official_document' && cambiarVista) {
      cambiarVista('documentos-oficiales')
    }
  }

  // Obtener ícono según el tipo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return <Users className="w-4 h-4" />
      case 'official_document':
        return <FileText className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  // Obtener color según el tipo
  const getNotificationColor = (type) => {
    switch (type) {
      case 'friend_request':
        return 'text-sky-400 bg-sky-100 border-sky-200'
      case 'official_document':
        return 'text-pink-400 bg-pink-100 border-pink-200'
      default:
        return 'text-purple-400 bg-purple-100 border-purple-200'
    }
  }

  // Formatear fecha
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
        className="relative p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700 z-10"
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-pink-300 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para móviles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-purple-50/50">
                <h3 className="text-sm font-semibold text-sky-600">Notificaciones</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Lista de notificaciones */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-300 mx-auto"></div>
                    <p className="mt-2 text-xs text-gray-400">Cargando...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <button
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full px-4 py-3 text-left ${
                          !notification.isRead ? 'bg-pink-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Ícono */}
                          <div
                            className={`p-2 rounded-lg border flex-shrink-0 ${getNotificationColor(
                              notification.type
                            )}`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>

                          {/* Indicador de no leída */}
                          {!notification.isRead && (
                            <div className="flex-shrink-0 w-2 h-2 bg-pink-300 rounded-full mt-2"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 bg-purple-50/50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      if (cambiarVista) {
                        cambiarVista('dashboard')
                      }
                    }}
                    className="text-xs text-sky-300 font-medium flex items-center gap-1"
                  >
                    Ver todas <ChevronRight className="w-3 h-3" />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-green-400 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Leído todos
                    </button>
                  )}
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

