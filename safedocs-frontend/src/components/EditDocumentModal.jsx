import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Edit, X, Save } from 'lucide-react'
import { useDocuments } from '../contexts/DocumentContext'

function ModalEditarDocumento({ documento, onClose, onSuccess }) {
  const { updateDocument, loading } = useDocuments()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [course, setCourse] = useState('')

  const mapCategoryFromBackend = (category) => {
    const mapping = {
      'academic': 'Apuntes',
      'research': 'Guías',
      'project': 'Resumen',
      'other': 'Otro'
    }
    return mapping[category] || category || 'Apuntes'
  }

  useEffect(() => {
    if (documento) {
      setTitle(documento.title || '')
      setDescription(documento.description || '')
      setCategory(mapCategoryFromBackend(documento.category))
      setCourse(documento.course || '')
    }
  }, [documento])

  if (!documento) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('El título es obligatorio')
      return
    }

    const updateData = {
      title: title.trim(),
      description: description.trim(),
      category: category,
      course: course.trim()
    }

    const success = await updateDocument(documento.id, updateData)
    if (success) {
      onSuccess && onSuccess()
      onClose()
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

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <Edit className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-indigo-700">Editar Documento</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del documento *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="Título del documento"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option>Apuntes</option>
              <option>Guías</option>
              <option>Resumen</option>
              <option>Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Curso *
            </label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              required
            >
              <option value="">Selecciona un curso</option>
              <option>Cálculo Diferencial</option>
              <option>Mecánica</option>
              <option>Programación</option>
              <option>Base de Datos</option>
              <option>Ingeniería de Software</option>
              <option>Física</option>
              <option>Química</option>
              <option>Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="Descripción del documento (opcional)"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 caracteres
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <motion.button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default ModalEditarDocumento

