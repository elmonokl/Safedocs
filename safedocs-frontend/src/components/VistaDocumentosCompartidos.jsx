import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Eye, Search, Filter, Calendar, User, Loader2, AlertCircle, Share2 } from 'lucide-react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

function VistaDocumentosCompartidos({ cambiarVista }) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadSharedDocuments()
  }, [user])

  const loadSharedDocuments = async () => {
    if (!user) {
      setDocuments([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const resp = await apiFetch('/api/documents/shared-with-me')
      if (resp?.success && resp?.data?.documents) {
        setDocuments(resp.data.documents)
        setUnreadCount(resp.data.unreadCount || 0)
      } else {
        setError(resp?.message || 'Error al cargar documentos compartidos')
        setDocuments([])
      }
    } catch (err) {
      console.error('Error al cargar documentos compartidos:', err)
      setError('Error al cargar documentos compartidos')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDocument = async (doc) => {
    setSelectedDoc(doc)
    if (!doc.isRead) {
      try {
        await apiFetch(`/api/documents/shared/${doc._id}/read`, {
          method: 'PATCH'
        })
        setDocuments(prev =>
          prev.map(d =>
            d._id === doc._id
              ? { ...d, isRead: true, readAt: new Date().toISOString() }
              : d
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Error marcando documento como leído:', err)
      }
    }
  }

  const handleDownload = async (doc) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/documents/${doc._id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.fileName || 'documento'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Error descargando documento:', err)
      alert('Error al descargar el documento')
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.sharedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getCategoryLabel = (category) => {
    const mapping = {
      'academic': 'Apuntes',
      'research': 'Guías',
      'project': 'Resúmenes',
      'other': 'Otros'
    }
    return mapping[category] || category
  }

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Fecha desconocida'
    const date = new Date(dateString)
    const now = new Date()
    const diffSeconds = Math.round((now - date) / 1000)
    const diffMinutes = Math.round(diffSeconds / 60)
    const diffHours = Math.round(diffMinutes / 60)
    const diffDays = Math.round(diffHours / 24)

    if (diffSeconds < 60) return `hace ${diffSeconds} segundos`
    if (diffMinutes < 60) return `hace ${diffMinutes} minutos`
    if (diffHours < 24) return `hace ${diffHours} horas`
    if (diffDays < 30) return `hace ${diffDays} días`
    return date.toLocaleDateString('es-ES')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => cambiarVista('dashboard')}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2"
          >
            ← Volver al panel
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
                  Documentos Compartidos
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Documentos que tus amigos han compartido contigo
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar documentos compartidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all hover:border-gray-400 dark:hover:border-gray-600 shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando documentos compartidos...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-center">
            <AlertCircle className="w-5 h-5 inline-block mr-2" />
            {error}
            <button
              onClick={loadSharedDocuments}
              className="ml-2 text-blue-600 hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {searchTerm ? 'No se encontraron documentos compartidos' : 'No tienes documentos compartidos'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer ${
                  !doc.isRead ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleViewDocument(doc)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg mt-1">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate flex-1">
                        {doc.title}
                      </h3>
                    </div>
                    {!doc.isRead && (
                      <span className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full shadow-sm">
                        Nuevo
                      </span>
                    )}
                  </div>
                  
                  {doc.sharedBy && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>Compartido por: {doc.sharedBy.name}</span>
                    </div>
                  )}

                  {doc.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                      "{doc.message}"
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {doc.course && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {doc.course}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {doc.sharedAt ? getRelativeTime(doc.sharedAt) : 'Fecha desconocida'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getCategoryLabel(doc.category)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDocument(doc)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Ver documento"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(doc)
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Descargar documento"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoc(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedDoc.title}
                </h2>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedDoc.sharedBy && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Compartido por: {selectedDoc.sharedBy.name || selectedDoc.sharedBy}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedDoc.message && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      "{selectedDoc.message}"
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedDoc.course && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Curso:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDoc.course}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Categoría:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getCategoryLabel(selectedDoc.category)}
                    </p>
                  </div>
                  {selectedDoc.sharedAt && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Compartido:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getRelativeTime(selectedDoc.sharedAt)}
                      </p>
                    </div>
                  )}
                  {selectedDoc.fileSize && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Tamaño:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedDoc.description && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Descripción:</span>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {selectedDoc.description}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      handleDownload(selectedDoc)
                      setSelectedDoc(null)
                    }}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default VistaDocumentosCompartidos

