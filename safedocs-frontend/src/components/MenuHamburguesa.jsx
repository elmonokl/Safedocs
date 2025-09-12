// src/components/MenuHamburguesa.jsx
import { Menu, X, User, Users, FileText, LogOut, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function MenuHamburguesa({ cambiarVista }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const [abierto, setAbierto] = useState(false)

  const opciones = [
    { label: 'Ver mi perfil', icono: <User size={18} />, vista: 'perfil' },
    { label: 'Ver mis amigos', icono: <Users size={18} />, vista: 'amigos' },
    { label: 'Documentos oficiales', icono: <FileText size={18} />, vista: 'dashboard' },
    { label: 'Registro de Auditoría', icono: <FileText size={18} />, vista: 'auditoria' },
    { label: 'Quién vio mi documento', icono: <Users size={18} />, vista: 'vistos' },
    ...(isAdmin ? [{ label: 'Panel Admin', icono: <Shield size={18} />, vista: 'admin' }] : []),
    { label: 'Cerrar sesión', icono: <LogOut size={18} />, vista: 'inicio' },
  ]

  const handleClick = (vista) => {
    cambiarVista(vista)
    setAbierto(false)
  }

  return (
    <div className="relative z-50 text-right sm:text-left">
      <button
        onClick={() => setAbierto(!abierto)}
        className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition sm:absolute sm:right-6 sm:top-6"
        aria-label="Menú"
      >
        {abierto ? <X size={24} /> : <Menu size={24} />}
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            className="absolute right-4 sm:right-6 top-14 w-60 bg-white rounded-xl shadow-xl ring-1 ring-black/10 p-4 space-y-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }}
            exit={{ opacity: 0, y: -10 }}
            role="menu"
            aria-label="Opciones de usuario"
          >
            {opciones.map((op, idx) => (
              <button
                key={idx}
                onClick={() => handleClick(op.vista)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 transition"
              >
                {op.icono}
                <span className="text-sm font-medium">{op.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MenuHamburguesa
