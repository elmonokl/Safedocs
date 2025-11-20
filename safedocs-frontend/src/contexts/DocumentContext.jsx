import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from './AuthContext'

const CATEGORY_MAP = {
  'academic': 'Apuntes',
  'research': 'Guías',
  'project': 'Resumen',
  'other': 'Otro'
}

const mapDocument = (doc, user) => ({
  id: doc._id || doc.id,
  title: doc.title,
  category: CATEGORY_MAP[doc.category] || doc.category,
  course: doc.course || '',
  date: doc.createdAt || doc.date,
  size: typeof doc.fileSize === 'number' 
    ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB` 
    : (doc.size || ''),
  description: doc.description || '',
  author: doc.author?.name || user?.name || '',
  downloads: typeof doc.downloadsCount === 'number' ? doc.downloadsCount : (doc.downloads || 0)
})

const DocumentContext = createContext()

export const useDocuments = () => {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error('useDocuments debe ser usado dentro de DocumentProvider')
  }
  return context
}

export const DocumentProvider = ({ children }) => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortBy, setSortBy] = useState('date')

  const loadDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const resp = await apiFetch('/api/documents/my-documents')
      if (resp?.success && resp?.data?.documents) {
        const mapped = resp.data.documents.map(doc => mapDocument(doc, user))
        setDocuments(mapped)
      } else {
        setDocuments([])
      }
    } catch (err) {
      console.error('Error al cargar documentos:', err)
      setError('Error al cargar documentos: ' + err.message)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadDocuments()
    } else {
      setDocuments([])
    }
  }, [user, loadDocuments])

  const uploadDocument = async (documentData) => {
    if (!user) {
      setError('Debes estar autenticado para subir documentos')
      return false
    }

    setLoading(true)
    setError('')
    
    try {
      if (!documentData.title || !documentData.category) {
        throw new Error('Título y categoría son obligatorios')
      }
      if (!documentData.course) {
        throw new Error('El curso es obligatorio')
      }
      if (!documentData.file) {
        throw new Error('Debes seleccionar un archivo')
      }

      const form = new FormData()
      form.append('file', documentData.file)
      form.append('title', documentData.title)
      form.append('category', documentData.category)
      form.append('course', documentData.course)
      if (documentData.description) {
        form.append('description', documentData.description)
      }

      const resp = await apiFetch('/api/documents/upload', {
        method: 'POST',
        body: form
      })
      
      if (resp?.success && resp?.data?.document) {
        const mapped = mapDocument(resp.data.document, user)
        setDocuments(prev => [mapped, ...prev])
        return true
      } else {
        throw new Error(resp?.message || 'Error al subir documento')
      }
    } catch (err) {
      console.error('Error detallado al subir documento:', err)
      const errorMessage = err.message || err.statusText || 'Error al subir documento'
      setError(errorMessage)
      
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('safedocs_user')
      }
      
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateDocument = async (documentId, updateData) => {
    if (!user) {
      setError('Debes estar autenticado para actualizar documentos')
      return false
    }

    setLoading(true)
    setError('')
    
    try {
      const resp = await apiFetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        body: updateData
      })
      
      if (resp?.success && resp?.data?.document) {
        const mapped = mapDocument(resp.data.document, user)
        setDocuments(prev => prev.map(doc => doc.id === documentId ? mapped : doc))
        return true
      } else {
        throw new Error(resp?.message || 'Error al actualizar documento')
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar documento')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (documentId) => {
    if (!user) {
      setError('Debes estar autenticado para eliminar documentos')
      return false
    }

    setLoading(true)
    setError('')
    try {
      const resp = await apiFetch(`/api/documents/${documentId}`, { method: 'DELETE' })
      
      if (resp?.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        return true
      } else {
        throw new Error(resp?.message || 'Error al eliminar documento')
      }
    } catch (err) {
      setError(err.message || 'Error al eliminar documento')
      console.error('Error al eliminar documento:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const getDocumentById = async (documentId) => {
    if (!user) {
      setError('Debes estar autenticado para ver documentos')
      return null
    }

    setLoading(true)
    setError('')
    
    try {
      const resp = await apiFetch(`/api/documents/${documentId}`)
      if (resp?.success && resp?.data?.document) {
        return mapDocument(resp.data.document, user)
      } else {
        throw new Error('Documento no encontrado')
      }
    } catch (err) {
      setError(err.message || 'Error al obtener el documento')
      return null
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = async (documentId) => {
    if (!user) {
      setError('Debes estar autenticado para descargar documentos')
      return false
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Token de autenticación no encontrado')
        return false
      }

      const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
        ? import.meta.env.VITE_API_URL 
        : 'http://localhost:3000'
      const url = `${base}/api/documents/${documentId}/download`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: 'Error al descargar documento' 
        }))
        throw new Error(errorData.message || 'Error al descargar documento')
      }

      const blob = await response.blob()
      
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = `documento-${documentId}`
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1].replace(/['"]/g, '')
        }
      }

      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      setDocuments(prev =>
        prev.map(doc =>
          doc.id === documentId
            ? { ...doc, downloads: (doc.downloads || 0) + 1 }
            : doc
        )
      )

      return true
    } catch (err) {
      setError(err.message || 'Error al descargar documento')
      console.error('Error al descargar documento:', err)
      return false
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || doc.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date) - new Date(a.date)
      case 'title':
        return a.title.localeCompare(b.title)
      case 'downloads':
        return b.downloads - a.downloads
      default:
        return 0
    }
  })

  const generateShareLink = async (documentId) => {
    if (!user) {
      setError('Debes estar autenticado para compartir documentos')
      return null
    }

    setLoading(true)
    setError('')
    
    try {
      const resp = await apiFetch(`/api/documents/${documentId}/share`, {
        method: 'POST'
      })
      
      if (resp?.success && resp?.data) {
        return resp.data
      } else {
        throw new Error(resp?.message || 'Error al generar link de compartir')
      }
    } catch (err) {
      setError(err.message || 'Error al generar link de compartir')
      return null
    } finally {
      setLoading(false)
    }
  }

  const shareWithFriends = async (documentId, friendIds, message) => {
    if (!user) {
      setError('Debes estar autenticado para compartir documentos')
      return false
    }

    if (!documentId) {
      setError('ID de documento no válido')
      return false
    }

    if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
      setError('Debes seleccionar al menos un amigo')
      return false
    }

    setLoading(true)
    setError('')
    
    try {
      // Asegurar que los IDs sean strings válidos
      const normalizedFriendIds = friendIds
        .filter(id => id != null && id !== undefined && id !== '')
        .map(id => String(id).trim())
        .filter(id => id && id !== 'undefined' && id !== 'null' && id !== '')
      
      console.log('Enviando friendIds al backend:', normalizedFriendIds, 'Longitud:', normalizedFriendIds.length)
      
      if (normalizedFriendIds.length === 0) {
        throw new Error('No hay IDs de amigos válidos para compartir')
      }
      
      const resp = await apiFetch(`/api/documents/${documentId}/share-friends`, {
        method: 'POST',
        body: { 
          friendIds: normalizedFriendIds, 
          message: message || '' 
        }
      })
      
      if (resp?.success) {
        return true
      } else {
        throw new Error(resp?.message || 'Error al compartir con amigos')
      }
    } catch (err) {
      console.error('Error compartiendo con amigos:', err)
      console.error('Detalles del error:', {
        message: err.message,
        status: err.status,
        statusText: err.statusText,
        response: err.response
      })
      
      // Obtener mensaje de error detallado
      let errorMessage = err.message || err.statusText || 'Error al compartir con amigos'
      
      // Si hay errores de validación en la respuesta, mostrarlos
      if (err.response?.errors && Array.isArray(err.response.errors)) {
        const validationErrors = err.response.errors.map(e => e.message).join(', ')
        errorMessage = `Error de validación: ${validationErrors}`
        console.error('Errores de validación:', err.response.errors)
      } else if (err.response?.message) {
        errorMessage = err.response.message
      }
      
      const errorDetails = err.status ? ` (Error ${err.status})` : ''
      setError(errorMessage + errorDetails)
      
      return false
    } finally {
      setLoading(false)
    }
  }

  const value = {
    documents: sortedDocuments,
    loading,
    error,
    searchTerm,
    filterCategory,
    sortBy,
    setSearchTerm,
    setFilterCategory,
    setSortBy,
    uploadDocument,
    updateDocument,
    deleteDocument,
    getDocumentById,
    downloadDocument,
    loadDocuments,
    generateShareLink,
    shareWithFriends,
    clearError: () => setError('')
  }

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  )
}
