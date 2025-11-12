// src/components/ModalDocumento.jsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useDocuments } from '../contexts/DocumentContext'
import { Download, Calendar, User, FileText, X, Edit, Trash2, Share2 } from 'lucide-react'
import EditDocumentModal from './EditDocumentModal'
import ConfirmDialog from './ConfirmDialog'
import ShareQRModal from './ShareQRModal'

function ModalDocumento({ documento, onClose, onDocumentUpdated, onDocumentDeleted }) {
  const { downloadDocument, deleteDocument, generateShareLink, error } = useDocuments()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [loadingShare, setLoadingShare] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  
  if (!documento) return null

  const handleDownload = async () => {
    const success = await downloadDocument(documento.id)
    if (success) {
      onClose()
    }
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleDelete = async () => {
    setDeleteError('')
    const success = await deleteDocument(documento.id)
    if (success) {
      onDocumentDeleted && onDocumentDeleted()
      onClose()
    } else {
      setDeleteError(error || 'No se pudo eliminar el documento')
    }
  }

  const handleEditSuccess = () => {
    onDocumentUpdated && onDocumentUpdated()
    setShowEditModal(false)
  }

  const handleShare = async () => {
    setLoadingShare(true)
    try {
      const shareData = await generateShareLink(documento.id)
      if (shareData && shareData.shareUrl) {
        setShareUrl(shareData.shareUrl)
        setShowShareModal(true)
      }
    } catch (err) {
      console.error('Error generando link de compartir:', err)
    } finally {
      setLoadingShare(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl max-w-lg w-full p-8 relative border border-indigo-100"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          className="absolute top-4 right-4 text-gray-500 hover:text-indigo-700 text-xl bg-white/60 rounded-full p-2 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onClick={onClose}
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </motion.button>
        
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-indigo-700 mb-2">{documento.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
              {documento.course && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                  {documento.course}
                </span>
              )}
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                {documento.category}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                <strong>Fecha:</strong> {new Date(documento.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">
                <strong>Autor:</strong> {documento.author}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="w-4 h-4" />
            <span className="text-sm">
              <strong>Tamaño:</strong> {documento.size}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Download className="w-4 h-4" />
            <span className="text-sm">
              <strong>Descargas:</strong> {documento.downloads}
            </span>
          </div>
        </div>

        {documento.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Descripción</h3>
            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
              {documento.description}
            </p>
          </div>
        )}

        {deleteError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {deleteError}
          </div>
        )}

        <div className="flex gap-3 justify-end flex-wrap">
          <motion.button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cerrar
          </motion.button>
          <motion.button
            onClick={handleShare}
            disabled={loadingShare}
            className="px-4 py-2 text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-4 h-4" />
            {loadingShare ? 'Cargando...' : 'Compartir'}
          </motion.button>
          <motion.button
            onClick={handleEdit}
            className="px-4 py-2 text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit className="w-4 h-4" />
            Editar
          </motion.button>
          <motion.button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-all flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </motion.button>
          <motion.button
            onClick={handleDownload}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            Descargar
          </motion.button>
        </div>
      </motion.div>

      {showEditModal && (
        <EditDocumentModal
          documento={documento}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeleteError('')
        }}
        onConfirm={async () => {
          const success = await handleDelete()
          // Retornar false si falla para que el diálogo no se cierre
          return success
        }}
        title="Eliminar documento"
        message={`¿Estás seguro de que quieres eliminar "${documento.title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {showShareModal && (
        <ShareQRModal
          documentId={documento.id}
          shareUrl={shareUrl}
          onClose={() => {
            setShowShareModal(false)
            setShareUrl('')
          }}
          onShareWithFriends={() => {
            // Opcional: recargar documentos o mostrar notificación
          }}
        />
      )}
    </motion.div>
  )
}

export default ModalDocumento
