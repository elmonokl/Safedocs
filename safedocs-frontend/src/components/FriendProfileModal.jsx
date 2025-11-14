import React from 'react'
import { motion } from 'framer-motion'
import { Trash2, X } from 'lucide-react'
import { apiFetch } from '../utils/api'

function FriendProfileModal({ friend, onClose, onRemoveFriend }) {
  if (!friend) return null

  const avatar = friend.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'A')}`
  const lastSeen = friend.isOnline
    ? 'En línea ahora'
    : friend.lastSeen
      ? `Última conexión: ${new Date(friend.lastSeen).toLocaleString()}`
      : 'Sin registro'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-blue-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-4 mb-4">
          <img
            src={avatar}
            alt={friend.name}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-200"
          />
          <div>
            <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">{friend.name}</p>
            <p className="text-sm text-gray-500">
              {lastSeen}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {friend.email && <p className="text-gray-600 dark:text-gray-300">Email: {friend.email}</p>}
          {friend.career && <p className="text-gray-600 dark:text-gray-300">Carrera: {friend.career}</p>}
        </div>
        <div className="mt-6 flex justify-between gap-2">
          <button
            onClick={async () => {
              if (confirm(`¿Estás seguro de que quieres eliminar a ${friend.name} de tu lista de amigos?`)) {
                try {
                  await apiFetch('/api/friends/remove', {
                    method: 'DELETE',
                    body: { friendId: friend._id }
                  })
                  if (onRemoveFriend) {
                    onRemoveFriend()
                  }
                  onClose()
                } catch (err) {
                  alert(err.message || 'No se pudo eliminar el amigo')
                }
              }
            }}
            className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar amigo
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default FriendProfileModal


