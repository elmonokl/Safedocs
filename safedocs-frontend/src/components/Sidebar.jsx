// src/components/Sidebar.jsx
// Barra lateral fija para navegación principal. Incluye acceso rápido a
// "Mis Documentos", scroll al formulario de subida y toggle de modo nocturno.
import React from 'react'
import { Upload, LogOut, LayoutGrid, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

function Sidebar({ cambiarVista, onGoToUpload, onGoToDocuments }) {
  const { dark, setDark } = useTheme()

  const goDocuments = () => {
    if (onGoToDocuments) onGoToDocuments()
    if (cambiarVista) cambiarVista('dashboard')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-52 bg-indigo-700 text-white flex flex-col shadow-lg z-40">
      <div className="px-4 py-4 font-semibold tracking-wide">SafeDocs UNAB</div>
      <nav className="flex-1 px-2 py-2 space-y-1 text-indigo-50">
        <button
          onClick={goDocuments}
          className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-indigo-600 text-left"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="text-sm">Mis Documentos</span>
        </button>
        <button
          onClick={() => {
            if (onGoToUpload) onGoToUpload()
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-indigo-600 text-left"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm">Subir Documento</span>
        </button>
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-indigo-600 text-left"
        >
          <Moon className="w-4 h-4" />
          <span className="text-sm">{dark ? 'Modo claro' : 'Modo nocturno'}</span>
        </button>
      </nav>
      <div className="px-2 py-3 border-t border-indigo-500/40">
        <button
          onClick={() => cambiarVista && cambiarVista('inicio')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-red-200 border border-red-300 hover:bg-red-50/10 hover:text-white text-left"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
