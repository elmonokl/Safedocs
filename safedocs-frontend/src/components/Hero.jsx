import { motion } from 'framer-motion'
import BotonesInicio from '../components/BotonesInicio'

function Hero({ cambiarVista }) {
  return (
    <section className="relative flex flex-col items-center justify-center text-center mt-20 px-4 min-h-[60vh] overflow-hidden">
      {/* Fondo gradiente animado */}
      <motion.div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200 via-indigo-400 to-indigo-700 opacity-80 animate-gradient-move"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 1 }}
      />
      <motion.h2
        className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg mb-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Intercambio seguro de documentos académicos
      </motion.h2>
      <motion.p
        className="text-lg sm:text-xl text-indigo-100 max-w-xl mb-8 drop-shadow"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Plataforma creada por y para estudiantes. Comparte apuntes, guías y material académico de manera protegida y trazable.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <BotonesInicio cambiarVista={cambiarVista} />
      </motion.div>
    </section>
  )
}

export default Hero
