// src/components/MisDocumentosModal.jsx
// Modal que muestra todos los documentos del usuario en una ventana
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Edit, Trash2, ChevronRight, Download, Share2 } from 'lucide-react'
import { useDocuments } from '../contexts/DocumentContext'
import EditDocumentModal from './EditDocumentModal'
import ConfirmDialog from './ConfirmDialog'
import ModalDocumento from './ModalDocumento'
import ShareQRModal from './ShareQRModal'

function MisDocumentosModal({ isOpen, onClose, showToast, showConfirmDialog }) {
  const { documents, loading, error, loadDocuments, deleteDocument, generateShareLink, getDocumentById } = useDocuments()
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [editingDoc, setEditingDoc] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(null)
  const [sharingDoc, setSharingDoc] = useState(null)
  const [shareUrl, setShareUrl] = useState('')
  const [loadingShare, setLoadingShare] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Cargar documentos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleDelete = async (docId) => {
    setDeleteError('')
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
      setDeleteError('No se pudo eliminar el documento')
      return false
    }
  }

  const handleEditSuccess = async () => {
    showToast && showToast('Documento actualizado correctamente', 'success')
    await loadDocuments()
    setEditingDoc(null)
  }

  const handleShare = async (doc) => {
    setLoadingShare(true)
    setSharingDoc(doc)
    try {
      const shareData = await generateShareLink(doc.id)
      if (shareData && shareData.shareUrl) {
        setShareUrl(shareData.shareUrl)
      } else {
        showToast && showToast('Error al generar link de compartir', 'error')
        setSharingDoc(null)
      }
    } catch (err) {
      console.error('Error generando link de compartir:', err)
      showToast && showToast('Error al generar link de compartir', 'error')
      setSharingDoc(null)
    } finally {
      setLoadingShare(false)
    }
  }

  const handleCloseShare = () => {
    setSharingDoc(null)
    setShareUrl('')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Mis Documentos</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-500">Cargando documentos...</p>
                  </div>
                ) : error ? (
                  <div className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-red-300" />
                    <p className="text-red-600 text-sm font-medium mb-2">Error al cargar documentos</p>
                    <p className="text-gray-500 text-xs mb-4">{error}</p>
                    <button
                      onClick={() => loadDocuments()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-sm">Aún no has subido documentos.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-blue-700 truncate">{doc.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {doc.course && `Curso: ${doc.course} | `}
                              Categoría: {doc.category} | Subido: {new Date(doc.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleShare(doc)}
                              disabled={loadingShare && sharingDoc?.id === doc.id}
                              className="inline-flex items-center justify-center w-9 h-9 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Compartir documento"
                              aria-label="Compartir documento"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingDoc(doc)}
                              className="inline-flex items-center justify-center w-9 h-9 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors touch-manipulation"
                              title="Editar documento"
                              aria-label="Editar documento"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingDoc(doc)}
                              className="inline-flex items-center justify-center w-9 h-9 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded transition-colors touch-manipulation"
                              title="Eliminar documento"
                              aria-label="Eliminar documento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                // Obtener el documento completo para registrar visualización
                                const fullDoc = await getDocumentById(doc.id)
                                if (fullDoc) {
                                  setSelectedDoc(fullDoc)
                                } else {
                                  // Si falla, usar el documento de la lista
                                  setSelectedDoc(doc)
                                }
                              }}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded transition-colors touch-manipulation"
                            >
                              Ver <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {documents.length} documento{documents.length !== 1 ? 's' : ''} en total
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>

          {/* Modales anidados */}
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
              onClose={() => {
                setDeletingDoc(null)
                setDeleteError('')
              }}
              onConfirm={async () => {
                const success = await handleDelete(deletingDoc.id)
                return success
              }}
              title="Eliminar documento"
              message={`¿Estás seguro de que quieres eliminar "${deletingDoc.title}"? Esta acción no se puede deshacer.`}
              confirmText="Eliminar"
              cancelText="Cancelar"
              type="danger"
            />
          )}

          {deleteError && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-60">
              {deleteError}
            </div>
          )}

          {/* Modal de compartir */}
          {sharingDoc && shareUrl && (
            <ShareQRModal
              documentId={sharingDoc.id}
              shareUrl={shareUrl}
              onClose={handleCloseShare}
              onShareWithFriends={() => {
                showToast && showToast('Documento compartido con amigos', 'success')
                handleCloseShare()
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  )
}

export default MisDocumentosModal





