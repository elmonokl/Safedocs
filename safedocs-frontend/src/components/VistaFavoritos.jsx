import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Search, Star, Loader2, AlertCircle, User } from 'lucide-react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'

function VistaFavoritos({ cambiarVista }) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadFavoriteDocuments()
  }, [user])

  const loadFavoriteDocuments = async () => {
    if (!user) {
      setDocuments([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const resp = await apiFetch('/api/documents/favorites')
      if (resp?.success && resp?.data?.documents) {
        setDocuments(resp.data.documents)
      } else {
        setError(resp?.message || 'Error al cargar documentos favoritos')
        setDocuments([])
      }
    } catch (err) {
      console.error('Error al cargar documentos favoritos:', err)
      setError('Error al cargar documentos favoritos')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (docId) => {
    if (!confirm('¿Estás seguro de que quieres remover este documento de tus favoritos?')) {
      return
    }

    try {
      const resp = await apiFetch(`/api/documents/${docId}/favorite`, {
        method: 'DELETE'
      })
      
      if (resp?.success) {
        setDocuments(prev => prev.filter(doc => doc._id !== docId))
      } else {
        alert(resp?.message || 'Error al remover de favoritos')
      }
    } catch (err) {
      console.error('Error removiendo de favoritos:', err)
      alert('Error al remover de favoritos')
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
                         doc.author?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getCategoryLabel = (category) => {
    const categoryMap = {
      'academic': 'Apuntes',
      'research': 'Guías',
      'project': 'Resúmenes',
      'other': 'Otros'
    }
    return categoryMap[category] || category
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar cambiarVista={cambiarVista} />
      
      <div className="flex-1 ml-52 md:ml-52">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <button
                onClick={() => cambiarVista('dashboard')}
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent hover:from-yellow-700 hover:to-orange-700 dark:hover:from-yellow-300 dark:hover:to-orange-300 transition-all cursor-pointer"
                title="Volver al inicio"
              >
                Mis Favoritos
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Documentos que has marcado como favoritos</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar en favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">Cargando favoritos...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Star className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">
                {searchTerm ? 'No se encontraron favoritos' : 'No tienes favoritos aún'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'Marca documentos como favoritos para encontrarlos fácilmente'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl">
                        <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(doc._id)}
                        className="p-2 text-yellow-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Remover de favoritos"
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                      {doc.title}
                    </h3>

                    {doc.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                        {getCategoryLabel(doc.category)}
                      </span>
                      {doc.course && (
                        <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                          {doc.course}
                        </span>
                      )}
                    </div>

                    {doc.author && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <User className="w-4 h-4" />
                        <span>{doc.author.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleRemoveFavorite(doc._id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 font-medium shadow-md hover:shadow-lg"
                      >
                        <Star className="w-4 h-4 fill-current" />
                        Sacar de favoritos
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="inline-flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VistaFavoritos

