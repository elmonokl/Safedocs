import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '../utils/api'

function AddFriendModal({ isOpen, onClose, onSent }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setQ(''); setResults([]); setError('')
    }
  }, [isOpen])

  const search = async () => {
    if (q.trim().length < 2) return
    setLoading(true)
    setError('')
    try {
      const resp = await apiFetch(`/api/friends/search?q=${encodeURIComponent(q)}`)
      setResults(resp?.data || [])
    } catch (e) {
      setError('No se pudo buscar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const sendRequest = async (userId) => {
    try {
      await apiFetch('/api/friends/request', { method: 'POST', body: { receiverId: userId } })
      onSent?.()
      onClose()
    } catch (_) {
      setError('No se pudo enviar la solicitud')
    }
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-lg border border-indigo-100 dark:border-gray-800"
      >
        <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-4">Agregar amigos</h3>
        <div className="flex gap-2 mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Buscar por nombre o correo"
            className="flex-1 p-2 border rounded"
          />
          <button onClick={search} className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Buscar</button>
        </div>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div className="max-h-64 overflow-auto space-y-2">
          {loading ? (
            <p className="text-sm text-gray-500">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-500">Sin resultados</p>
          ) : (
            results.map(u => (
              <div key={u.id || u._id} className="flex items-center justify-between border rounded p-2">
                <div className="flex items-center gap-2">
                  <img src={u.profilePicture || 'https://i.pravatar.cc/150?img=1'} alt={u.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <button onClick={() => sendRequest(u.id || u._id)} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Agregar</button>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">Cerrar</button>
        </div>
      </motion.div>
    </div>
  )
}

export default AddFriendModal


