import React, { useState, useEffect } from 'react'
import { Upload, LogOut, LayoutGrid, Moon, X, Menu, Users, FileText, Share2 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

function Sidebar({ cambiarVista, onGoToUpload, onGoToDocuments }) {
  const { dark, setDark } = useTheme()
  const { user } = useAuth()
  const isProfessor = user?.role === 'professor'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const goDocuments = () => {
    setIsMobileMenuOpen(false)
    
    if (onGoToDocuments) {
      onGoToDocuments()
    }
    
    if (!onGoToDocuments && cambiarVista) {
      cambiarVista('dashboard')
    }
  }

  const goFriends = () => {
    if (cambiarVista) {
      cambiarVista('amigos')
    }
    setIsMobileMenuOpen(false)
  }

  const goOfficialDocuments = () => {
    if (cambiarVista) {
      cambiarVista('documentos-oficiales')
    }
    setIsMobileMenuOpen(false)
  }

  const goSharedDocuments = () => {
    if (cambiarVista) {
      cambiarVista('documentos-compartidos')
    }
    setIsMobileMenuOpen(false)
  }

  const handleUpload = () => {
    setIsMobileMenuOpen(false)
    
    if (cambiarVista) {
      cambiarVista('dashboard')
    }
    
    setTimeout(() => {
      if (onGoToUpload) {
        onGoToUpload()
      }
    }, 400)
  }

  const handleLogout = () => {
    if (cambiarVista) cambiarVista('inicio')
    setIsMobileMenuOpen(false)
  }

  const sidebarContent = (
    <>
      <div className="px-4 py-4 font-semibold tracking-wide text-white border-b border-sky-400/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold">SafeDocs UNAB</span>
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded hover:bg-sky-500 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {user?.name && (
          <div className="mt-3 pt-3 border-t border-sky-400/30">
            <p className="text-xs text-gray-400 mb-1">Bienvenido</p>
            <p className="text-sm font-medium text-gray-300 truncate" title={user.name}>
              {user.name}
            </p>
          </div>
        )}
      </div>
      
      <nav className="flex-1 px-2 py-2 space-y-1 text-sky-50">
        <button
          onClick={goDocuments}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sky-500 active:bg-sky-400 text-left transition-all duration-200 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sky-400"
          aria-label="Ver mis documentos"
        >
          <LayoutGrid className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Mis Documentos</span>
        </button>

        <button
          onClick={goFriends}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sky-500 active:bg-sky-400 text-left transition-all duration-200 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sky-400"
          aria-label="Gestionar amigos"
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Amigos</span>
        </button>

        <button
          onClick={goOfficialDocuments}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sky-500 active:bg-sky-400 text-left transition-all duration-200 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sky-400"
          aria-label="Documentos oficiales"
        >
          <FileText className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Documentos Oficiales</span>
        </button>

        <button
          onClick={goSharedDocuments}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sky-500 active:bg-sky-400 text-left transition-all duration-200 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sky-400"
          aria-label="Documentos compartidos"
        >
          <Share2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Documentos Compartidos</span>
        </button>
        
        <button
          onClick={handleUpload}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sky-500 active:bg-sky-400 text-left transition-all duration-200 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sky-400"
          aria-label="Subir documento"
        >
          <Upload className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Subir Documento</span>
        </button>
        
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sky-500 active:bg-sky-400 text-left transition-all duration-200 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sky-400"
          aria-label={`Cambiar a modo ${dark ? 'claro' : 'nocturno'}`}
        >
          <Moon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{dark ? 'Modo claro' : 'Modo nocturno'}</span>
        </button>
      </nav>
      
      <div className="px-2 py-3 border-t border-sky-400/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-red-500 border-2 border-red-600 text-white hover:bg-red-600 hover:border-red-700 active:bg-red-700 active:border-red-800 text-left transition-all duration-200 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-sky-400"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-50 p-3 rounded-lg bg-sky-400 text-white shadow-lg hover:bg-sky-500 active:bg-sky-600 transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
              />
              
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[280px] bg-sky-400 text-white flex flex-col shadow-2xl z-50"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-52 bg-sky-400 text-white flex flex-col shadow-lg z-40">
      {sidebarContent}
    </aside>
  )
}

export default Sidebar
