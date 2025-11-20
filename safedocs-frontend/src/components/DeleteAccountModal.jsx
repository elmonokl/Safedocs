import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

function DeleteAccountModal({ isOpen, onClose, onConfirm, loading, error: externalError }) {
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (confirmation !== 'ELIMINAR') {
      setError('Debes escribir "ELIMINAR" en mayúsculas para confirmar')
      return
    }
    setError('')
    onConfirm(confirmation)
  }

  useEffect(() => {
    if (!isOpen) {
      setConfirmation('')
      setError('')
    }
  }, [isOpen])

  const handleClose = () => {
    setConfirmation('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-red-200 dark:border-red-900"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Eliminar Cuenta
              </h3>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Esta acción es <strong className="text-red-600 dark:text-red-400">irreversible</strong>. 
              Se eliminará permanentemente:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
              <li>Tu cuenta y todos tus datos personales</li>
              <li>Todos tus documentos y archivos</li>
              <li>Todas tus amistades y solicitudes</li>
              <li>Todos los registros de auditoría asociados</li>
            </ul>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Para confirmar, escribe <span className="text-red-600 dark:text-red-400">ELIMINAR</span> en mayúsculas:
            </p>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => {
                setConfirmation(e.target.value)
                setError('')
              }}
              placeholder="ELIMINAR"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
              disabled={loading}
              autoFocus
            />
            {(error || externalError) && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error || externalError}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || confirmation !== 'ELIMINAR'}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Eliminando...
                </>
              ) : (
                'Eliminar Cuenta'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default DeleteAccountModal

