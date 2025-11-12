import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, User, Calendar, X, AlertCircle } from 'lucide-react'
import { apiFetch } from '../utils/api'

function VistaDocumentoCompartido({ token, onClose }) {
  const [documento, setDocumento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (token) {
      loadDocumento()
    }
  }, [token])

  const loadDocumento = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await apiFetch(`/api/documents/shared/${token}`)
      if (resp?.success && resp?.data?.document) {
        setDocumento(resp.data.document)
      } else {
        setError('Documento no encontrado')
      }
    } catch (err) {
      setError(err.message || 'Error al cargar el documento')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!token) return
    
    setDownloading(true)
    try {
      const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
        ? import.meta.env.VITE_API_URL 
        : 'http://localhost:3000'
      const url = `${base}/api/documents/shared/${token}/download`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Error al descargar documento')
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = `documento-${token}`
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
    } catch (err) {
      setError('Error al descargar documento: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando documento...</p>
        </div>
      </div>
    )
  }

  if (error || !documento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Documento no encontrado'}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Cerrar
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  const categoriaMap = {
    'academic': 'Apuntes',
    'research': 'Guías',
    'project': 'Resumen',
    'other': 'Otro'
  }

  const categoria = categoriaMap[documento.category] || documento.category
  const fileSize = documento.fileSize ? `${(documento.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'N/A'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          <div className="flex items-start gap-4 mb-6">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-indigo-700 mb-2">{documento.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                {documento.course && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                    {documento.course}
                  </span>
                )}
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                  {categoria}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Fecha:</strong> {new Date(documento.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Autor:</strong> {documento.author?.name || 'Desconocido'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="w-4 h-4" />
              <span className="text-sm">
                <strong>Tamaño:</strong> {fileSize}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Download className="w-4 h-4" />
              <span className="text-sm">
                <strong>Descargas:</strong> {documento.downloadsCount || 0}
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

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {downloading ? 'Descargando...' : 'Descargar documento'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default VistaDocumentoCompartido

