// src/components/Dashboard.jsx
// Vista principal del usuario: formulario de subida y listado de documentos.
// Incluye menú hamburguesa y barra lateral con scroll a secciones.
import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileUp, Inbox, FileText, ChevronRight } from 'lucide-react'
import { useDocuments } from '../contexts/DocumentContext'
import MenuHamburguesa from './MenuHamburguesa'
import Sidebar from './Sidebar'
import ModalDocumento from './ModalDocumento'

function Dashboard({ cambiarVista, irADocumentos, showToast, showConfirmDialog }) {
  const { uploadDocument, loading, documents } = useDocuments()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Apuntes')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const inputRef = useRef(null)
  const uploadRef = useRef(null)
  const docsRef = useRef(null)

  // Límite de tamaño (cliente): 50MB
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

    // Validaciones cliente
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

    const ok = await uploadDocument({ title, category, description, file })
    if (ok) {
      setTitle('')
      setCategory('Apuntes')
      setDescription('')
      setFile(null)
      showToast && showToast('Documento subido correctamente', 'success')
    } else {
      showToast && showToast('No se pudo subir el documento', 'error')
    }
  }

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const scrollToDocuments = () => {
    docsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar cambiarVista={cambiarVista} onGoToUpload={scrollToUpload} onGoToDocuments={scrollToDocuments} />
      <div className="pl-52 p-6 space-y-6">
        <div className="relative">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-indigo-800">Bienvenido a tu Panel</h2>
            <MenuHamburguesa cambiarVista={cambiarVista} />
          </div>
        </div>

        <form ref={uploadRef} onSubmit={handleUpload} className="bg-white rounded-2xl shadow border p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Subir Documento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Título del documento</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                placeholder="Guía de Física 2024"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              >
                <option>Apuntes</option>
                <option>Guías</option>
                <option>Pruebas</option>
                <option>Resúmenes</option>
                <option>Otros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Subir Documento</label>
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'}`}
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
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-50 text-indigo-700 text-sm">
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
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> {loading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </form>

        <div ref={docsRef} className="bg-white rounded-2xl shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Tus Documentos</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-indigo-700 hover:underline cursor-default">{doc.title}</h4>
                    <p className="text-xs text-gray-500">
                      Categoría: {doc.category} | Subido: {new Date(doc.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded"
                  >
                    Ver <ChevronRight className="w-4 h-4" />
                  </button>
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
          <ModalDocumento documento={selectedDoc} onClose={() => setSelectedDoc(null)} />
        )}
      </div>
    </div>
  )
}

export default Dashboard


