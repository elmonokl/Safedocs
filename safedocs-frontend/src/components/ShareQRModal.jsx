import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'

function ShareQRModal({ value, onClose }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!value) return
    QRCode.toCanvas(canvasRef.current, value, { width: 220 }, () => {})
  }, [value])

  if (!value) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-indigo-100 dark:border-gray-800 text-center"
      >
        <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-3">Comparte tu QR</h3>
        <canvas ref={canvasRef} className="mx-auto" />
        <p className="text-xs text-gray-500 mt-2 break-all">{value}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => navigator.clipboard.writeText(value)} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">
            Copiar enlace
          </button>
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ShareQRModal


