import { motion } from 'framer-motion'

function BotonesInicio({ cambiarVista }) {
  return (
    <div className="flex gap-4">
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: '0 0 16px #2563eb' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => cambiarVista('login')}
        className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-lg hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Iniciar Sesión
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: '0 0 16px #dc2626' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => cambiarVista('registro')}
        className="bg-white text-red-700 border border-red-600 px-6 py-2 rounded-xl shadow-lg hover:bg-red-50 transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        Registrarse
      </motion.button>
    </div>
  )
}

export default BotonesInicio
