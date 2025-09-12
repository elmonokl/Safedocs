// src/contexts/DocumentContext.jsx
// Maneja el estado de documentos del usuario: carga, subida, descarga y borrado.
// Expone filtros y orden para mejorar la UX en cliente.
import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const DocumentContext = createContext()

export const useDocuments = () => {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error('useDocuments debe ser usado dentro de DocumentProvider')
  }
  return context
}

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const resp = await apiFetch('/api/documents/my-documents')
      const docs = resp?.data?.documents || []
      const mapped = docs.map(d => ({
        id: d._id || d.id,
        title: d.title,
        category: d.category,
        date: d.createdAt || d.date,
        size: (typeof d.fileSize === 'number' ? `${(d.fileSize / (1024*1024)).toFixed(1)} MB` : (d.size || '')),
        description: d.description || '',
        author: d.author?.name || '',
        downloads: typeof d.downloadsCount === 'number' ? d.downloadsCount : (d.downloads || 0)
      }))
      setDocuments(mapped)
    } catch (err) {
      setError('Error al cargar documentos')
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (documentData) => {
    setLoading(true)
    setError('')
    
    try {
      if (!documentData.title || !documentData.category) {
        throw new Error('Título y categoría son obligatorios')
      }
      if (!documentData.file) {
        throw new Error('Debes seleccionar un archivo')
      }

      const form = new FormData()
      form.append('file', documentData.file)
      form.append('title', documentData.title)
      form.append('category', documentData.category)
      if (documentData.description) form.append('description', documentData.description)

      const resp = await apiFetch('/api/documents/upload', {
        method: 'POST',
        body: form
      })
      const d = resp?.data?.document
      if (!d) return true
      const mapped = {
        id: d._id || d.id,
        title: d.title,
        category: d.category,
        date: d.createdAt,
        size: (typeof d.fileSize === 'number' ? `${(d.fileSize / (1024*1024)).toFixed(1)} MB` : ''),
        description: d.description || '',
        author: d.author?.name || '',
        downloads: d.downloadsCount || 0
      }
      setDocuments(prev => [mapped, ...prev])
      return true
    } catch (err) {
      setError(err.message || 'Error al subir documento')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (documentId) => {
    setLoading(true)
    try {
      await apiFetch(`/api/documents/${documentId}`, { method: 'DELETE' })
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      return true
    } catch (err) {
      setError('Error al eliminar documento')
      return false
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = async (documentId) => {
    try {
      const token = localStorage.getItem('token')
      const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : 'http://localhost:3000'
      const url = `${base}/api/documents/${documentId}/download`
      const link = document.createElement('a')
      link.href = url
      if (token) link.setAttribute('Authorization', `Bearer ${token}`)
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      link.remove()

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, downloads: doc.downloads + 1 }
            : doc
        )
      )
      
      return true
    } catch (err) {
      setError('Error al descargar documento')
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
    deleteDocument,
    downloadDocument,
    clearError: () => setError('')
  }

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  )
} 