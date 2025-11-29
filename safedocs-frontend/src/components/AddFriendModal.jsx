import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '../utils/api'

const statusLabels = {
  friend: 'Ya son amigos',
  sent: 'Solicitud enviada',
  received: 'Solicitud recibida',
  none: 'Agregar'
}

function ButtonByStatus({ user, onSend }) {
  const status = user.friendshipStatus || 'none'
  const disabled = status !== 'none'
  const label = statusLabels[status] || 'Agregar'

  return (
    <button
      onClick={() => !disabled && onSend(user.id || user._id)}
      disabled={disabled}
      className={`px-3 py-1 rounded ${
        disabled
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700'
      }`}
    >
      {label}
    </button>
  )
}

function ModalAgregarAmigo({ isOpen, onClose, onSent }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [results, setResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState('')

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true)
    setError('')
    try {
      const resp = await apiFetch('/api/friends/suggestions?limit=10')
      setSuggestions(resp?.data?.users || [])
    } catch (e) {
      console.error('Error cargando sugerencias:', e)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  const search = useCallback(async () => {
    const searchTerm = q.trim()
    if (searchTerm.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const resp = await apiFetch(`/api/friends/search?q=${encodeURIComponent(searchTerm)}`)
      setResults(resp?.data?.users || [])
    } catch (e) {
      setError('No se pudo buscar usuarios')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    if (!isOpen) {
      setQ(''); setResults([]); setSuggestions([]); setError('')
    } else {
      loadSuggestions()
    }
  }, [isOpen, loadSuggestions])

  useEffect(() => {
    if (q.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        search()
      }, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setResults([])
    }
  }, [q, search])

  const sendRequest = async (userId) => {
    setError('')
    try {
      await apiFetch('/api/friends/request', { method: 'POST', body: { receiverId: userId } })
      onSent?.()
      await Promise.all([
        loadSuggestions(),
        q.trim().length >= 2 ? search() : Promise.resolve()
      ])
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud')
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
        
        {q.trim().length >= 2 ? (
          <div className="max-h-64 overflow-auto space-y-2">
            {loading ? (
              <p className="text-sm text-gray-500">Buscando...</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-gray-500">Sin resultados</p>
            ) : (
              results.map(u => (
                <div key={u.id || u._id} className="flex items-center justify-between border rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <div className="flex items-center gap-2">
                    <img 
                      src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4c51bf&color=fff`} 
                      alt={u.name} 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {u.career && <p className="text-xs text-gray-400">{u.career}</p>}
                    </div>
                  </div>
                  <ButtonByStatus user={u} onSend={sendRequest} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="max-h-64 overflow-auto space-y-2">
            {loadingSuggestions ? (
              <p className="text-sm text-gray-500">Cargando sugerencias...</p>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-gray-500">No hay sugerencias disponibles. Intenta buscar usuarios.</p>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-2 font-medium">Sugerencias para ti:</p>
                {suggestions.map(u => (
                  <div key={u.id || u._id} className="flex items-center justify-between border rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <div className="flex items-center gap-2">
                      <img 
                        src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4c51bf&color=fff`} 
                        alt={u.name} 
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        {u.career && <p className="text-xs text-gray-400">{u.career}</p>}
                      </div>
                    </div>
                    <ButtonByStatus user={u} onSend={sendRequest} />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">Cerrar</button>
        </div>
      </motion.div>
    </div>
  )
}

export default ModalAgregarAmigo


