import { motion } from 'framer-motion'

function BotonesInicio({ cambiarVista }) {
  return (
    <div className="flex gap-4">
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: '0 0 16px #6366f1' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => cambiarVista('login')}
        className="bg-indigo-600 text-white px-6 py-2 rounded-xl shadow-lg hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        Iniciar Sesión
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: '0 0 16px #c7d2fe' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => cambiarVista('registro')}
        className="bg-white text-indigo-700 border border-indigo-600 px-6 py-2 rounded-xl shadow-lg hover:bg-indigo-100 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        Registrarse
      </motion.button>
    </div>
  )
}

export default BotonesInicio
