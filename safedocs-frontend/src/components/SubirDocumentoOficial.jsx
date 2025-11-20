import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileUp, Inbox, X, AlertCircle } from 'lucide-react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

function SubirDocumentoOficial({ cambiarVista, onSuccess, showToast }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Apuntes')
  const [course, setCourse] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const uploadRef = useRef(null)

  if (user?.role !== 'professor') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Solo los profesores pueden subir documentos oficiales.
          </p>
          <button
            onClick={() => cambiarVista('dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Volver al panel
          </button>
        </div>
      </div>
    )
  }

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
    if (dropped) {
      validateAndSetFile(dropped)
    }
  }

  const validateAndSetFile = (fileToValidate) => {
    if (!ALLOWED_TYPES.has(fileToValidate.type)) {
      setError('Formato no permitido. Solo se permiten PDF, DOC, DOCX, TXT, PPT, PPTX')
      return
    }
    if (fileToValidate.size > MAX_SIZE_BYTES) {
      setError('El archivo supera 50MB')
      return
    }
    setFile(fileToValidate)
    setError('')
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setError('')

    if (!file) {
      setError('Debes seleccionar un archivo')
      return
    }
    if (!title.trim()) {
      setError('El título es obligatorio')
      return
    }
    if (!course.trim()) {
      setError('El curso es obligatorio')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim())
      formData.append('category', category)
      formData.append('course', course.trim())
      formData.append('description', description.trim())

      const token = localStorage.getItem('token')
      const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
        ? import.meta.env.VITE_API_URL 
        : 'http://localhost:3000'
      const url = `${base}/api/documents/official/upload`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al subir documento oficial')
      }

      setTitle('')
      setCategory('Apuntes')
      setCourse('')
      setDescription('')
      setFile(null)

      if (showToast) {
        showToast('Documento oficial subido exitosamente', 'success')
      }

      if (onSuccess) {
        onSuccess(data.data.document)
      } else {
        setTimeout(() => {
          cambiarVista('documentos-oficiales')
        }, 1000)
      }
    } catch (err) {
      console.error('Error subiendo documento oficial:', err)
      setError(err.message || 'No se pudo subir el documento oficial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => cambiarVista('documentos-oficiales')}
            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 mb-2"
          >
            ← Volver a Documentos Oficiales
          </button>
          <h1 className="text-3xl font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
            <Upload className="w-8 h-8 text-indigo-500" />
            Subir Documento Oficial
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Sube un documento reglamentario que será público para todos los usuarios
          </p>
        </div>

        <form
          ref={uploadRef}
          onSubmit={handleUpload}
          className="bg-white dark:bg-gray-800 rounded-xl shadow border p-6 space-y-6"
        >
          {error && (
            <div className="p-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título del Documento *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Reglamento de Evaluación 2024"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="Apuntes">Apuntes</option>
                <option value="Guías">Guías</option>
                <option value="Resumen">Resumen</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Curso *
              </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Ej: Programación I"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del documento..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subir Documento *
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
                dragOver ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <Inbox className="w-8 h-8 mx-auto text-gray-400" />
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Arrastra aquí tu archivo o haz clic para seleccionarlo
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                PDF, DOC, DOCX, TXT, PPT, PPTX (máx. 50MB)
              </p>
              {file && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm">
                  <FileUp className="w-4 h-4" /> {file.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => cambiarVista('documentos-oficiales')}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Upload className="w-4 h-4" />
              {loading ? 'Subiendo...' : 'Subir Documento Oficial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubirDocumentoOficial

