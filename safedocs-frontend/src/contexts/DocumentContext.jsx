import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from './AuthContext'

/**
 * Context de Documentos
 * Gestiona el estado global de documentos del usuario
 */

// Mapeo de categorías del backend (inglés) al frontend (español)
const CATEGORY_MAP = {
  'academic': 'Apuntes',
  'research': 'Guías',
  'project': 'Resumen',
  'other': 'Otro'
}

// Función auxiliar para mapear documentos del backend al frontend
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

  useEffect(() => {
    if (user) {
      loadDocuments()
    } else {
      setDocuments([])
    }
  }, [user])

  const loadDocuments = async () => {
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
      }
    } catch (err) {
      setError('Error al cargar documentos: ' + err.message)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

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
      setError(err.message || 'Error al subir documento')
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
      
      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = `documento-${documentId}`
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1].replace(/['"]/g, '')
        }
      }

      // Crear un enlace temporal para descargar el archivo
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      // Actualizar el contador de descargas localmente
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

    setLoading(true)
    setError('')
    
    try {
      const resp = await apiFetch(`/api/documents/${documentId}/share-friends`, {
        method: 'POST',
        body: { friendIds, message }
      })
      
      if (resp?.success) {
        return true
      } else {
        throw new Error(resp?.message || 'Error al compartir con amigos')
      }
    } catch (err) {
      setError(err.message || 'Error al compartir con amigos')
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
