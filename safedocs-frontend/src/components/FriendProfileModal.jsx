import React from 'react'
import { motion } from 'framer-motion'

function FriendProfileModal({ friend, onClose }) {
  if (!friend) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-indigo-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-4 mb-4">
          <img src={friend.avatar} alt={friend.nombre} className="w-14 h-14 rounded-full object-cover" />
          <div>
            <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">{friend.nombre}</p>
            <p className="text-sm text-gray-500">{friend.estado === 'En línea' ? 'Conectado' : `Última conexión: ${friend.ultimaConexion}`}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-gray-600 dark:text-gray-300">Email: ejemplo@unab.cl</p>
          <p className="text-gray-600 dark:text-gray-300">Carrera: Ingeniería en Computación e Informática</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Cerrar</button>
        </div>
      </motion.div>
    </div>
  )
}

export default FriendProfileModal


