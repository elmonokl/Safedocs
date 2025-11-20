import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Clock, FileText, User, Calendar, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { apiFetch } from '../utils/api'

function VistaVistos({ cambiarVista }) {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [error, setError] = useState('')
  const [expandedDocs, setExpandedDocs] = useState(new Set())
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadViews()
  }, [days])

  const loadViews = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await apiFetch(`/api/audit/views?days=${days}&limit=100`)
      setDocuments(resp?.data?.documents || [])
    } catch (err) {
      console.error('Error cargando visualizaciones:', err)
      setError('No se pudieron cargar las visualizaciones')
    } finally {
      setLoading(false)
    }
  }

  const toggleDocument = (docId) => {
    const newExpanded = new Set(expandedDocs)
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId)
    } else {
      newExpanded.add(docId)
    }
    setExpandedDocs(newExpanded)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Hace unos momentos'
    if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
    if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
    if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`

    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const defaultAvatar = (name = '') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4c51bf&color=fff`

  const getCategoryLabel = (category) => {
    const labels = {
      academic: 'Académico',
      research: 'Investigación',
      project: 'Proyecto',
      other: 'Otro'
    }
    return labels[category] || category
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => cambiarVista('dashboard')}
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 mb-2"
            >
              ← Volver al panel
            </button>
            <h1 className="text-3xl font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
              <Eye className="w-8 h-8 text-indigo-500" />
              Quién vio mis documentos
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Visualizaciones de tus documentos en los últimos {days} días
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="60">Últimos 60 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
            <button
              onClick={loadViews}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition disabled:opacity-60"
              title="Actualizar"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border p-8 text-center">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Aún no hay visualizaciones registradas en los últimos {days} días.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Las visualizaciones aparecerán aquí cuando otros usuarios vean tus documentos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((docData) => {
              const isExpanded = expandedDocs.has(docData.document.id?.toString() || '')
              const viewCount = docData.views.length

              return (
                <motion.div
                  key={docData.document.id || 'unknown'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    onClick={() => toggleDocument(docData.document.id?.toString() || '')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {docData.document.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getCategoryLabel(docData.document.category)}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {viewCount} {viewCount === 1 ? 'visualización' : 'visualizaciones'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(docData.views[0]?.viewedAt)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="p-4 space-y-3">
                          {docData.views.map((view) => (
                            <div
                              key={view.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <img
                                  src={view.viewer.profilePicture || defaultAvatar(view.viewer.name)}
                                  alt={view.viewer.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                                    {view.viewer.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {view.viewer.email}
                                    </p>
                                    {view.viewer.career && (
                                      <>
                                        <span className="text-xs text-gray-400">•</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {view.viewer.career}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDate(view.viewedAt)}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {formatDateTime(view.viewedAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default VistaVistos






