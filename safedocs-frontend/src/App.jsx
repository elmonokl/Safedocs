// src/App.jsx
import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { DocumentProvider } from './contexts/DocumentContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Hero from './components/Hero'
import Login from './components/Login'
import Registro from './components/Registro'
import Dashboard from './components/Dashboard'
import VistaAmigos from './components/VistaAmigos'
import VistaPerfil from './components/VistaPerfil'
import PanelAdmin from './components/PanelAdmin'
import VistaUsuario from './components/VistaUsuario'
import VistaProfesor from './components/VistaProfesor'
import VistaAdministrador from './components/VistaAdministrador'
import VistaAuditoria from './components/VistaAuditoria'
import VistaVistos from './components/VistaVistos'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'

// App: orquesta el enrutamiento por vista y provee contextos globales.
// Mantiene el estado de navegación simple (sin react-router) y
// expone utilidades para toasts y diálogos de confirmación.
function App() {
  const [vista, setVista] = useState('dashboard')
  const [toast, setToast] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Navegación rápida al dashboard de documentos
  const irADocumentos = () => setVista('dashboard')

  // API para mostrar toasts desde componentes hijos
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // API para mostrar diálogos de confirmación reutilizables
  const showConfirmDialog = (config) => {
    setConfirmDialog(config)
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <DocumentProvider>
          <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-950 dark:to-black">
          {vista === 'inicio' && <Hero cambiarVista={setVista} />}
          {vista === 'login' && <Login cambiarVista={setVista} showToast={showToast} />}
          {vista === 'registro' && <Registro cambiarVista={setVista} showToast={showToast} />}
          {vista === 'dashboard' && (
            <Dashboard 
              cambiarVista={setVista} 
              irADocumentos={irADocumentos}
              showToast={showToast}
              showConfirmDialog={showConfirmDialog}
            />
          )}
          {vista === 'usuario' && <VistaUsuario cambiarVista={setVista} />}
          {vista === 'profesor' && <VistaProfesor cambiarVista={setVista} />}
          {vista === 'administrador' && <VistaAdministrador cambiarVista={setVista} />}
          {vista === 'amigos' && <VistaAmigos cambiarVista={setVista} />}
          {vista === 'perfil' && <VistaPerfil cambiarVista={setVista} showToast={showToast} />}
          {vista === 'admin' && <PanelAdmin cambiarVista={setVista} showToast={showToast} showConfirmDialog={showConfirmDialog} />}
          {vista === 'auditoria' && <VistaAuditoria cambiarVista={setVista} />}
          {vista === 'vistos' && <VistaVistos cambiarVista={setVista} />}

          {/* Toast notifications */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

          {/* Confirm Dialog */}
          {confirmDialog && (
            <ConfirmDialog
              isOpen={!!confirmDialog}
              onClose={() => setConfirmDialog(null)}
              onConfirm={confirmDialog.onConfirm}
              title={confirmDialog.title}
              message={confirmDialog.message}
              confirmText={confirmDialog.confirmText}
              cancelText={confirmDialog.cancelText}
              type={confirmDialog.type}
            />
          )}

          {/* Botón flotante eliminado por solicitud del usuario */}
          </div>
        </DocumentProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
