import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, User, Calendar, Search, Filter, ChevronRight, Eye, Clock } from 'lucide-react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

function VistaDocumentosOficiales({ cambiarVista }) {
  const { user } = useAuth()
  const isProfessor = user?.role === 'professor'
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProfessor, setFilterProfessor] = useState('')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    loadDocuments()
  }, [searchTerm, filterProfessor])

  const loadDocuments = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterProfessor) params.append('professor', filterProfessor)
      params.append('limit', '100')
      
      const resp = await apiFetch(`/api/documents/official?${params.toString()}`)
      setDocuments(resp?.data?.documents || [])
    } catch (err) {
      console.error('Error cargando documentos oficiales:', err)
      setError('No se pudieron cargar los documentos oficiales')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (docId) => {
    try {
      // Obtener el documento para registrar visualización
      const resp = await apiFetch(`/api/documents/official/${docId}`)
      if (resp?.success && resp?.data?.document) {
        setSelectedDoc(resp.data.document)
      }
    } catch (err) {
      console.error('Error obteniendo documento:', err)
      setError('No se pudo cargar el documento')
    }
  }

  const handleDownload = async (docId, fileName) => {
    setDownloading(docId)
    try {
      const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
        ? import.meta.env.VITE_API_URL 
        : 'http://localhost:3000'
      const url = `${base}/api/documents/official/${docId}/download`

      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, { headers })
      if (!response.ok) {
        throw new Error('Error al descargar documento')
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      
      // Recargar documentos para actualizar contador de descargas
      await loadDocuments()
    } catch (err) {
      console.error('Error descargando documento:', err)
      setError('No se pudo descargar el documento')
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryLabel = (category) => {
    const labels = {
      academic: 'Académico',
      research: 'Investigación',
      project: 'Proyecto',
      other: 'Otro'
    }
    return labels[category] || category
  }

  const defaultAvatar = (name = '') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4c51bf&color=fff`

  // Obtener lista única de profesores de los documentos
  const uniqueProfessors = [...new Set(
    documents
      .map(doc => doc.author?.name)
      .filter(Boolean)
  )].sort()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => cambiarVista('dashboard')}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-2"
            >
              ← Volver al panel
            </button>
            <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-500" />
              Documentos Oficiales
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Documentos reglamentarios publicados por profesores
            </p>
          </div>
          {isProfessor && (
            <button
              onClick={() => cambiarVista('subir-oficial')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Subir Documento Oficial
            </button>
          )}
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <select
                value={filterProfessor}
                onChange={(e) => setFilterProfessor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los profesores</option>
                {uniqueProfessors.map(professor => (
                  <option key={professor} value={professor}>{professor}</option>
                ))}
              </select>
            </div>
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
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay documentos oficiales disponibles.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <motion.div
                key={doc._id || doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {doc.author && (
                            <div className="flex items-center gap-2">
                              <img
                                src={doc.author.profilePicture || defaultAvatar(doc.author.name)}
                                alt={doc.author.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {doc.author.name}
                              </span>
                            </div>
                          )}
                          {doc.course && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {doc.course}
                              </span>
                            </>
                          )}
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {getCategoryLabel(doc.category)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(doc.createdAt)}</span>
                          </div>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            {doc.downloadsCount || 0} descargas
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleView(doc._id || doc.id)}
                        className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => handleDownload(doc._id || doc.id, doc.fileName)}
                        disabled={downloading === (doc._id || doc.id)}
                        className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        {downloading === (doc._id || doc.id) ? 'Descargando...' : 'Descargar'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de documento */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
                {selectedDoc.author && (
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedDoc.author.profilePicture || defaultAvatar(selectedDoc.author.name)}
                      alt={selectedDoc.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedDoc.author.name}
                      </p>
                      {selectedDoc.author.career && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedDoc.author.career}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Curso:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedDoc.course}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Categoría:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getCategoryLabel(selectedDoc.category)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedDoc.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Descargas:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDoc.downloadsCount || 0}
                    </p>
                  </div>
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
                      handleDownload(selectedDoc._id || selectedDoc.id, selectedDoc.fileName)
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

export default VistaDocumentosOficiales

