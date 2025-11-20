import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileUp, Inbox, FileText, ChevronRight, Edit, Trash2 } from 'lucide-react'
import { useDocuments } from '../contexts/DocumentContext'
import { useAuth } from '../contexts/AuthContext'
import MenuHamburguesa from './MenuHamburguesa'
import Sidebar from './Sidebar'
import ModalDocumento from './ModalDocumento'
import EditDocumentModal from './EditDocumentModal'
import ConfirmDialog from './ConfirmDialog'
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
      const ok = await uploadDocument({ title, category, course, description, file })
      if (ok) {
        setTitle('')
        setCategory('Apuntes')
        setCourse('')
        setDescription('')
        setFile(null)
        showToast && showToast('Documento subido correctamente', 'success')
        loadDocuments()
      } else {
        showToast && showToast('No se pudo subir el documento. Verifica los campos e intenta nuevamente.', 'error')
      }
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar cambiarVista={cambiarVista} onGoToUpload={scrollToUpload} onGoToDocuments={scrollToDocuments} />
      <div className="pl-0 md:pl-52 p-4 md:p-6 space-y-6">
        <div className="relative">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-gray-400">
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
          className={`bg-white rounded-2xl shadow border p-4 md:p-6 space-y-4 transition-all duration-500 ${
            uploadFormHighlighted ? 'ring-4 ring-blue-400 shadow-xl' : ''
          }`}
        >
          <h3 className="text-sm font-semibold text-gray-700">Subir Documento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Título del documento</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="Guía de Física 2024"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
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
              <label className="block text-sm text-gray-600 mb-1">Curso</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
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
            <label className="block text-sm text-gray-600 mb-2">Subir Documento</label>
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <Inbox className="w-8 h-8 mx-auto text-gray-400" />
              <p className="mt-3 text-gray-600">Arrastra aquí tu archivo o haz clic para seleccionarlo</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, TXT, PPT, PPTX (máx. 50MB)</p>
              {file && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm">
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

          <div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-xl shadow hover:bg-sky-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> {loading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </form>

        <div ref={docsRef} className="bg-white rounded-2xl shadow border transition-all duration-300">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Tus Documentos</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-700 hover:underline cursor-default">{doc.title}</h4>
                    <p className="text-xs text-gray-500">
                      {doc.course && `Curso: ${doc.course} | `}Categoría: {doc.category} | Subido: {new Date(doc.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingDoc(doc)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors"
                      title="Editar documento"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingDoc(doc)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-4 h-4" />
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
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors"
                    >
                      Ver <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                <FileText className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                Aún no has subido documentos.
              </div>
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
          <EditDocumentModal
            documento={editingDoc}
            onClose={() => setEditingDoc(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        {deletingDoc && (
          <ConfirmDialog
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


