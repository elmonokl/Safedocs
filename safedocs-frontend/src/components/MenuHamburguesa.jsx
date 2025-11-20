import { Menu, X, User, Users, FileText, LogOut, Shield, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DeleteAccountModal from './DeleteAccountModal'

function MenuHamburguesa({ cambiarVista }) {
  const { user, logout, deleteAccount, error } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const [abierto, setAbierto] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const opciones = [
    { label: 'Ver mi perfil', icono: <User size={18} />, vista: 'perfil' },
    { label: 'Ver mis amigos', icono: <Users size={18} />, vista: 'amigos' },
    { label: 'Documentos oficiales', icono: <FileText size={18} />, vista: 'documentos-oficiales' },
    { label: 'Registro de Auditoría', icono: <FileText size={18} />, vista: 'auditoria' },
    { label: 'Quién vio mi documento', icono: <Users size={18} />, vista: 'vistos' },
    ...(isAdmin ? [{ label: 'Panel Admin', icono: <Shield size={18} />, vista: 'admin' }] : []),
    { label: 'Eliminar cuenta', icono: <Trash2 size={18} />, vista: 'delete', action: 'delete' },
    { label: 'Cerrar sesión', icono: <LogOut size={18} />, vista: 'inicio', action: 'logout' },
  ]

  const handleClick = async (vista, action) => {
    if (action === 'delete') {
      setShowDeleteModal(true)
      setAbierto(false)
      return
    }
    if (action === 'logout') {
      await logout()
      cambiarVista('inicio')
      setAbierto(false)
      return
    }
    cambiarVista(vista)
    setAbierto(false)
  }

  const handleDeleteAccount = async (confirmation) => {
    setDeleting(true)
    try {
      const success = await deleteAccount(confirmation)
      if (success) {
        setShowDeleteModal(false)
        cambiarVista('inicio')
      }
    } catch (error) {
      console.error('Error eliminando cuenta:', error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative z-50 text-right sm:text-left">
      <button
        onClick={() => setAbierto(!abierto)}
        className="p-2 rounded-full bg-sky-400 text-white hover:bg-sky-500 transition sm:absolute sm:right-6 sm:top-6"
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
                onClick={() => handleClick(op.vista, op.action)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition ${
                  op.action === 'delete'
                    ? 'hover:bg-red-50 text-red-600 hover:text-red-700 dark:hover:bg-red-900/20 dark:text-red-400'
                    : op.action === 'logout'
                    ? 'hover:bg-gray-100 text-gray-700 hover:text-gray-900 dark:hover:bg-gray-800 dark:text-gray-300'
                    : 'hover:bg-blue-50 text-blue-700 hover:text-blue-900 dark:hover:bg-blue-900/20 dark:text-blue-300'
                }`}
              >
                {op.icono}
                <span className="text-sm font-medium">{op.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleting}
        error={error}
      />
    </div>
  )
}

export default MenuHamburguesa
