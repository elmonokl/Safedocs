// src/components/VistaDocumento.jsx
import { motion } from 'framer-motion'

function VistaDocumento({ documento, cerrarVista }) {
  if (!documento) return null

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg relative"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={cerrarVista}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-600 font-bold text-lg"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-indigo-700 mb-4">{documento.titulo}</h2>

        <div className="space-y-2">
          <p><span className="font-semibold">Categoría:</span> {documento.categoria}</p>
          <p><span className="font-semibold">Fecha de subida:</span> {documento.fecha}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={() => alert('Descarga simulada')}
          >
            Descargar documento
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default VistaDocumento
