import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileUp, Inbox, FileText, ChevronRight, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Star } from 'lucide-react'
import { useDocuments } from '../contexts/DocumentContext'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../utils/api'
import MenuHamburguesa from './MenuHamburguesa'
import Sidebar from './Sidebar'
import ModalDocumento from './ModalDocumento'
import ModalEditarDocumento from './EditDocumentModal'
import DialogoConfirmacion from './ConfirmDialog'
import MisDocumentosModal from './MisDocumentosModal'
import Notifications from './Notifications'

function Dashboard({ cambiarVista, irADocumentos, showToast, showConfirmDialog }) {
  const { user } = useAuth()
  const { uploadDocument, deleteDocument, loadDocuments, getDocumentById, loading, documents } = useDocuments()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Apuntes')
  const [course, setCourse] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [editingDoc, setEditingDoc] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(null)
  const [showMisDocumentosModal, setShowMisDocumentosModal] = useState(false)
  const [uploadFormHighlighted, setUploadFormHighlighted] = useState(false)
  const [sortBy, setSortBy] = useState('date') // 'date', 'name', 'size'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'
  const [uploadProgress, setUploadProgress] = useState(0)
  const [favorites, setFavorites] = useState(new Set()) // Set de IDs de documentos favoritos
  const inputRef = useRef(null)
  const uploadRef = useRef(null)
  const docsRef = useRef(null)

  const MAX_SIZE_BYTES = 50 * 1024 * 1024
  const ALLOWED_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ])

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) setFile(dropped)
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!title || !title.trim()) {
      showToast && showToast('El título es obligatorio', 'warning')
      return
    }
    if (!course || !course.trim()) {
      showToast && showToast('Debes seleccionar un curso', 'warning')
      return
    }
    if (!file) {
      showToast && showToast('Debes seleccionar un archivo', 'warning')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      showToast && showToast('El archivo supera 50MB', 'error')
      return
    }
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      showToast && showToast('Formato no permitido', 'error')
      return
    }

    try {
      setUploadProgress(0)
      
      // Simular progreso para archivos grandes
      const isLargeFile = file.size > 5 * 1024 * 1024 // > 5MB
      let progressInterval = null
      
      if (isLargeFile) {
        progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)
      }
      
      const ok = await uploadDocument({ title, category, course, description, file })
      
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      
      if (ok) {
        setUploadProgress(100)
        setTimeout(() => {
          setTitle('')
          setCategory('Apuntes')
          setCourse('')
          setDescription('')
          setFile(null)
          setUploadProgress(0)
          showToast && showToast('Documento subido correctamente', 'success')
          loadDocuments()
        }, 500)
      } else {
        setUploadProgress(0)
        showToast && showToast('No se pudo subir el documento. Verifica los campos e intenta nuevamente.', 'error')
      }
    } catch (error) {
      setUploadProgress(0)
      console.error('Error en handleUpload:', error)
      showToast && showToast('Error al subir documento: ' + (error.message || 'Error desconocido'), 'error')
    }
  }

  const handleDeleteDocument = async (docId) => {
    const success = await deleteDocument(docId)
    if (success) {
      showToast && showToast('Documento eliminado correctamente', 'success')
      await loadDocuments()
      setDeletingDoc(null)
      if (selectedDoc && selectedDoc.id === docId) {
        setSelectedDoc(null)
      }
      return true
    } else {
      showToast && showToast('Error al eliminar documento', 'error')
      return false
    }
  }

  const handleEditSuccess = async () => {
    showToast && showToast('Documento actualizado correctamente', 'success')
    await loadDocuments()
    setEditingDoc(null)
    if (selectedDoc && editingDoc && selectedDoc.id === editingDoc.id) {
      setSelectedDoc(null)
    }
  }

  const scrollToUpload = () => {
    setTimeout(() => {
      if (uploadRef.current) {
        const elementPosition = uploadRef.current.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - 20
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
        
        setUploadFormHighlighted(true)
        setTimeout(() => {
          setUploadFormHighlighted(false)
        }, 2000)
        
        setTimeout(() => {
          const titleInput = uploadRef.current?.querySelector('input[type="text"]')
          if (titleInput) {
            titleInput.focus()
          }
        }, 500)
      }
    }, 100)
  }
  
  const scrollToDocuments = () => {
    setShowMisDocumentosModal(true)
  }

  // Cargar estado de favoritos
  useEffect(() => {
    const loadFavoritesStatus = async () => {
      if (!user || documents.length === 0) return

      try {
        const favoriteIds = new Set()
        for (const doc of documents) {
          try {
            const resp = await apiFetch(`/api/documents/${doc.id}/is-favorite`)
            if (resp?.success && resp?.data?.isFavorite) {
              favoriteIds.add(doc.id)
            }
          } catch (err) {
            console.error(`Error verificando favorito para documento ${doc.id}:`, err)
          }
        }
        setFavorites(favoriteIds)
      } catch (err) {
        console.error('Error cargando estado de favoritos:', err)
      }
    }

    loadFavoritesStatus()
  }, [user, documents])

  // Manejar agregar/remover favorito
  const handleToggleFavorite = async (docId) => {
    const isFavorite = favorites.has(docId)
    
    try {
      if (isFavorite) {
        const resp = await apiFetch(`/api/documents/${docId}/favorite`, {
          method: 'DELETE'
        })
        if (resp?.success) {
          setFavorites(prev => {
            const newSet = new Set(prev)
            newSet.delete(docId)
            return newSet
          })
          showToast && showToast('Removido de favoritos', 'success')
        }
      } else {
        const resp = await apiFetch(`/api/documents/${docId}/favorite`, {
          method: 'POST'
        })
        if (resp?.success) {
          setFavorites(prev => new Set(prev).add(docId))
          showToast && showToast('Agregado a favoritos', 'success')
        }
      }
    } catch (err) {
      console.error('Error al cambiar estado de favorito:', err)
      showToast && showToast('Error al cambiar estado de favorito', 'error')
    }
  }

  // Función para ordenar documentos
  const sortedDocuments = React.useMemo(() => {
    const sorted = [...documents]
    
    sorted.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title)
          break
        case 'date':
          comparison = new Date(a.date) - new Date(b.date)
          break
        case 'size':
          const sizeA = parseFloat(a.size) || 0
          const sizeB = parseFloat(b.size) || 0
          comparison = sizeA - sizeB
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [documents, sortBy, sortOrder])

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  // Componente Skeleton para documentos
  const DocumentSkeleton = () => (
    <div className="px-6 py-5 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar cambiarVista={cambiarVista} onGoToUpload={scrollToUpload} onGoToDocuments={scrollToDocuments} />
      <div className="pl-0 md:pl-52 p-4 md:p-6 space-y-6">
        <div className="relative">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              {user?.name ? `Bienvenido, ${user.name}` : 'Bienvenido a tu Panel'}
            </h2>
            <div className="flex items-center gap-2">
              <Notifications cambiarVista={cambiarVista} />
              <MenuHamburguesa cambiarVista={cambiarVista} />
            </div>
          </div>
        </div>

        <form 
          ref={uploadRef} 
          onSubmit={handleUpload} 
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 p-6 md:p-8 space-y-5 transition-all duration-500 backdrop-blur-sm ${
            uploadFormHighlighted ? 'ring-4 ring-blue-400 shadow-2xl scale-[1.01]' : 'hover:shadow-xl'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-sky-500 rounded-lg">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Subir Documento</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título del documento</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 dark:hover:border-gray-500"
                placeholder="Guía de Física 2024"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 dark:hover:border-gray-500"
                required
              >
                <option value="Apuntes">Apuntes</option>
                <option value="Guías">Guías</option>
                <option value="Pruebas">Pruebas</option>
                <option value="Resúmenes">Resúmenes</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Curso</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-4 py-2.5 border-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 dark:hover:border-gray-500"
                required
              >
                <option value="">Selecciona un curso</option>
                <option value="Cálculo Diferencial">Cálculo Diferencial</option>
                <option value="Mecánica">Mecánica</option>
                <option value="Programación">Programación</option>
                <option value="Base de Datos">Base de Datos</option>
                <option value="Ingeniería de Software">Ingeniería de Software</option>
                <option value="Física">Física</option>
                <option value="Química">Química</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Subir Documento</label>
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                dragOver 
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/20 scale-[1.02] shadow-lg' 
                  : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700/30 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-gray-700/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div className="mb-4">
                <Inbox className={`w-12 h-12 mx-auto transition-colors ${dragOver ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              </div>
              <p className="mt-2 text-base font-medium text-gray-700 dark:text-gray-300">Arrastra aquí tu archivo o haz clic para seleccionarlo</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">PDF, DOC, DOCX, TXT, PPT, PPTX (máx. 50MB)</p>
              {file && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                  <FileUp className="w-4 h-4" /> {file.name}
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="pt-2">
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Subiendo archivo...</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || uploadProgress > 0}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-sky-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium transform hover:scale-105 active:scale-95"
            >
              {loading || uploadProgress > 0 ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" /> Subir Documento
                </>
              )}
            </button>
          </div>
        </form>

        <div ref={docsRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 transition-all duration-300 hover:shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Tus Documentos</h3>
                {documents.length > 0 && (
                  <span className="ml-2 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                    {documents.length}
                  </span>
                )}
              </div>
              {documents.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Ordenar:</span>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => handleSortChange('date')}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all ${
                        sortBy === 'date'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title="Ordenar por fecha"
                    >
                      Fecha {sortBy === 'date' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />)}
                    </button>
                    <button
                      onClick={() => handleSortChange('name')}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all ${
                        sortBy === 'name'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title="Ordenar por nombre"
                    >
                      Nombre {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />)}
                    </button>
                    <button
                      onClick={() => handleSortChange('size')}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all ${
                        sortBy === 'size'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title="Ordenar por tamaño"
                    >
                      Tamaño {sortBy === 'size' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && documents.length === 0 ? (
              <>
                <DocumentSkeleton />
                <DocumentSkeleton />
                <DocumentSkeleton />
              </>
            ) : sortedDocuments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                  <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">No tienes documentos aún</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Sube tu primer documento usando el formulario de arriba</p>
              </div>
            ) : (
              sortedDocuments.map((doc) => (
              <div key={doc.id} className="px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-gray-50 dark:hover:from-gray-700/50 dark:hover:to-gray-700/30 transition-all duration-200 group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mb-1 truncate">{doc.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-2">
                      {doc.course && <span className="inline-flex items-center gap-1"><span className="font-medium">Curso:</span> {doc.course}</span>}
                      <span className="inline-flex items-center gap-1"><span className="font-medium">Categoría:</span> {doc.category}</span>
                      <span className="inline-flex items-center gap-1"><span className="font-medium">Subido:</span> {new Date(doc.date).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingDoc(doc)}
                      className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                      title="Editar documento"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingDoc(doc)}
                      className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(doc.id)}
                      className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow ${
                        favorites.has(doc.id)
                          ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                          : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                      title={favorites.has(doc.id) ? 'Remover de favoritos' : 'Agregar a favoritos'}
                    >
                      <Star className={`w-4 h-4 ${favorites.has(doc.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={async () => {
                        const fullDoc = await getDocumentById(doc.id)
                        if (fullDoc) {
                          setSelectedDoc(fullDoc)
                        } else {
                          setSelectedDoc(doc)
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-medium"
                    >
                      Ver <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {selectedDoc && (
          <ModalDocumento 
            documento={documents.find(d => d.id === selectedDoc.id) || selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onDocumentUpdated={async () => {
              await loadDocuments()
              showToast && showToast('Documento actualizado', 'success')
            }}
            onDocumentDeleted={async () => {
              await loadDocuments()
              setSelectedDoc(null)
              showToast && showToast('Documento eliminado', 'success')
            }}
          />
        )}

        {editingDoc && (
          <ModalEditarDocumento
            documento={editingDoc}
            onClose={() => setEditingDoc(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        {deletingDoc && (
          <DialogoConfirmacion
            isOpen={!!deletingDoc}
            onClose={() => setDeletingDoc(null)}
            onConfirm={async () => {
              const success = await handleDeleteDocument(deletingDoc.id)
              return success
            }}
            title="Eliminar documento"
            message={`¿Estás seguro de que quieres eliminar "${deletingDoc.title}"? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            type="danger"
          />
        )}

        <MisDocumentosModal
          isOpen={showMisDocumentosModal}
          onClose={() => setShowMisDocumentosModal(false)}
          showToast={showToast}
          showConfirmDialog={showConfirmDialog}
        />
      </div>
    </div>
  )
}

export default Dashboard


