import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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
import VistaDocumentosOficiales from './components/VistaDocumentosOficiales'
import VistaDocumentosCompartidos from './components/VistaDocumentosCompartidos'
import SubirDocumentoOficial from './components/SubirDocumentoOficial'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'
import LoadingSpinner from './components/LoadingSpinner'

function AppContent() {
  const { user, loading } = useAuth()
  const [vista, setVista] = useState('inicio')
  const [toast, setToast] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    if (!loading) {
      if (user) {
        setVista('dashboard')
      } else {
        setVista('inicio')
      }
    }
  }, [user, loading])

  if (loading) {
    return <LoadingSpinner />
  }

  const irADocumentos = () => setVista('dashboard')

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const showConfirmDialog = (config) => {
    setConfirmDialog(config)
  }

  return (
    <ThemeProvider>
      <DocumentProvider>
        <div className="min-h-screen bg-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-black">
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
          {vista === 'documentos-oficiales' && <VistaDocumentosOficiales cambiarVista={setVista} />}
          {vista === 'documentos-compartidos' && <VistaDocumentosCompartidos cambiarVista={setVista} />}
          {vista === 'subir-oficial' && <SubirDocumentoOficial cambiarVista={setVista} showToast={showToast} />}

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

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
        </div>
      </DocumentProvider>
    </ThemeProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
