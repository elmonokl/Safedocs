import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, UserCheck, XCircle, RefreshCcw, Trash2 } from 'lucide-react'
import AddFriendModal from './AddFriendModal'
import FriendProfileModal from './FriendProfileModal'
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => cambiarVista('dashboard')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Volver al panel
            </button>
            <h1 className="text-3xl font-bold text-blue-800 mt-2 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-500" />
              Mis Amigos
            </h1>
            <p className="text-sm text-gray-600">
              Gestiona tus solicitudes y comparte tus documentos con confianza.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                loadFriends()
                loadPendingRequests()
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
              title="Actualizar"
            >
              <RefreshCcw className="w-4 h-4" />
              Actualizar
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow"
            >
              <UserPlus className="w-4 h-4" />
              Agregar amigo
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="bg-white rounded-xl shadow border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Solicitudes pendientes
              </h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
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
                          className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-blue-50/50 transition"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={request.sender?.profilePicture || defaultAvatar(request.sender?.name)}
                              alt={request.sender?.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {request.sender?.name}
                              </p>
                              <p className="text-xs text-gray-500">{request.sender?.email}</p>
                              {request.sender?.career && (
                                <p className="text-xs text-gray-400">{request.sender.career}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(request._id)}
                              disabled={processingRequest === request._id}
                              className="px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAccept(request._id)}
                              disabled={processingRequest === request._id}
                              className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
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

          <section className="bg-white rounded-xl shadow border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Amigos
              </h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
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
                          className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-blue-50 transition"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <button
                            onClick={() => setSelectedFriend(friend)}
                            className="flex-1 flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={friend.profilePicture || defaultAvatar(friend.name)}
                                alt={friend.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{friend.name}</p>
                                <p className="text-xs text-gray-500">{friend.email}</p>
                                {friend.career && (
                                  <p className="text-xs text-gray-400">{friend.career}</p>
                                )}
                              </div>
                            </div>
                            <span className={`text-xs font-medium ${friend.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                              {friend.isOnline ? 'En línea' : 'Desconectado'}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveFriend(friend._id, friend.name)
                            }}
                            className="ml-3 p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
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

      <AddFriendModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSent={onFriendAdded}
      />

      <FriendProfileModal
        friend={selectedFriend}
        onClose={() => setSelectedFriend(null)}
        onRemoveFriend={loadFriends}
      />
    </div>
  )
}

export default VistaAmigos
