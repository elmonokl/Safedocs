import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, UserCheck, XCircle, RefreshCcw, Trash2 } from 'lucide-react'
import ModalAgregarAmigo from './AddFriendModal'
import ModalPerfilAmigo from './FriendProfileModal'
import { apiFetch } from '../utils/api'

function VistaAmigos({ cambiarVista }) {
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [processingRequest, setProcessingRequest] = useState(null)

  useEffect(() => {
    loadFriends()
    loadPendingRequests()
  }, [])

  const loadFriends = async () => {
    setLoadingFriends(true)
    setError('')
    try {
      const resp = await apiFetch('/api/friends')
      setFriends(resp?.data?.friends || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar tus amigos.')
    } finally {
      setLoadingFriends(false)
    }
  }

  const loadPendingRequests = async () => {
    setLoadingRequests(true)
    try {
      const resp = await apiFetch('/api/friends/requests/pending')
      setPendingRequests(resp?.data?.requests || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleAccept = async (requestId) => {
    setProcessingRequest(requestId)
    try {
      await apiFetch('/api/friends/requests/accept', {
        method: 'POST',
        body: { requestId }
      })
      await Promise.all([loadPendingRequests(), loadFriends()])
    } catch (err) {
      console.error(err)
      alert(err.message || 'No se pudo aceptar la solicitud')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleReject = async (requestId) => {
    setProcessingRequest(requestId)
    try {
      await apiFetch('/api/friends/requests/reject', {
        method: 'POST',
        body: { requestId }
      })
      await loadPendingRequests()
    } catch (err) {
      console.error(err)
      alert(err.message || 'No se pudo rechazar la solicitud')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRemoveFriend = async (friendId, friendName) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${friendName} de tu lista de amigos?`)) {
      return
    }

    try {
      await apiFetch('/api/friends/remove', {
        method: 'DELETE',
        body: { friendId }
      })
      await loadFriends()
      alert('Amigo eliminado exitosamente')
    } catch (err) {
      console.error(err)
      alert(err.message || 'No se pudo eliminar el amigo')
    }
  }

  const onFriendAdded = async () => {
    setShowAdd(false)
    await Promise.all([loadPendingRequests(), loadFriends()])
  }

  const renderSkeletons = (count = 3) =>
    Array.from({ length: count }).map((_, idx) => (
      <motion.div
        key={`skeleton-${idx}`}
        className="flex items-center bg-white/60 rounded-lg shadow border p-4 gap-4 animate-pulse"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="w-12 h-12 rounded-full bg-blue-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-blue-100 rounded w-1/2" />
          <div className="h-3 bg-blue-50 rounded w-1/3" />
        </div>
      </motion.div>
    ))

  const defaultAvatar = (name = '') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4c51bf&color=fff`

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => cambiarVista('dashboard')}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-2"
            >
              ← Volver al panel
            </button>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent mt-2 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md">
                <Users className="w-7 h-7 text-white" />
              </div>
              Mis Amigos
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Gestiona tus solicitudes y comparte tus documentos con confianza.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                loadFriends()
                loadPendingRequests()
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow font-medium"
              title="Actualizar"
            >
              <RefreshCcw className="w-4 h-4" />
              Actualizar
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Agregar amigo
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-400 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded-lg">
                  <UserCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  Solicitudes pendientes
                </h2>
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-sm">
                {pendingRequests.length}
              </span>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {loadingRequests
                  ? renderSkeletons(2)
                  : pendingRequests.length === 0
                    ? (
                      <p className="text-sm text-gray-500">
                        No tienes solicitudes pendientes en este momento.
                      </p>
                    ) : (
                      pendingRequests.map((request) => (
                        <motion.div
                          key={request._id}
                          className="flex items-center justify-between border-2 border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-gray-700/50 dark:hover:to-gray-700/30 transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={request.sender?.profilePicture || defaultAvatar(request.sender?.name)}
                                alt={request.sender?.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 dark:border-blue-700 shadow-sm"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {request.sender?.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{request.sender?.email}</p>
                              {request.sender?.career && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">{request.sender.career}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(request._id)}
                              disabled={processingRequest === request._id}
                              className="px-3 py-2 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-60 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAccept(request._id)}
                              disabled={processingRequest === request._id}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-medium"
                            >
                              Aceptar
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
              </AnimatePresence>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  Amigos
                </h2>
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full shadow-sm">
                {friends.length}
              </span>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {loadingFriends
                  ? renderSkeletons(3)
                  : friends.length === 0
                    ? (
                      <p className="text-sm text-gray-500">
                        Aún no has agregado amigos. Envía una solicitud para compartir documentos rápidamente.
                      </p>
                    ) : (
                      friends.map((friend) => (
                        <motion.div
                          key={friend._id}
                          className="flex items-center justify-between border-2 border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-gray-700/50 dark:hover:to-gray-700/30 transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <button
                            onClick={() => setSelectedFriend(friend)}
                            className="flex-1 flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <img
                                  src={friend.profilePicture || defaultAvatar(friend.name)}
                                  alt={friend.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 dark:border-blue-700 shadow-sm"
                                />
                                {friend.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{friend.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{friend.email}</p>
                                {friend.career && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">{friend.career}</p>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${friend.isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                              {friend.isOnline ? 'En línea' : 'Desconectado'}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveFriend(friend._id, friend.name)
                            }}
                            className="ml-3 p-2.5 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                            title="Eliminar amigo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))
                    )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>

      <ModalAgregarAmigo
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSent={onFriendAdded}
      />

      <ModalPerfilAmigo
        friend={selectedFriend}
        onClose={() => setSelectedFriend(null)}
        onRemoveFriend={loadFriends}
      />
    </div>
  )
}

export default VistaAmigos
