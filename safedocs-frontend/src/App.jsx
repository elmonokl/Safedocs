// Componente principal de la aplicación
// Maneja el enrutamiento entre diferentes vistas y provee los contextos globales
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
import VistaFavoritos from './components/VistaFavoritos'
import SubirDocumentoOficial from './components/SubirDocumentoOficial'
import Toast from './components/Toast'
import DialogoConfirmacion from './components/ConfirmDialog'
import Cargador from './components/LoadingSpinner'

// Componente interno que maneja el estado de la aplicación
function AppContent() {
  const { user, loading } = useAuth()
  // Estado que controla qué vista mostrar (inicio, login, dashboard, etc.)
  const [vista, setVista] = useState('inicio')
  // Estado para mostrar notificaciones toast
  const [toast, setToast] = useState(null)
  // Estado para mostrar diálogos de confirmación
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Efecto que redirige al usuario según su estado de autenticación
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
    return <Cargador />
  }

  // Función para navegar a la vista de documentos
  const irADocumentos = () => setVista('dashboard')

  // Función para mostrar notificaciones toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // Función para mostrar diálogos de confirmación
  const showConfirmDialog = (config) => {
    setConfirmDialog(config)
  }

  return (
    <ThemeProvider>
      <DocumentProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
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
          {vista === 'favoritos' && <VistaFavoritos cambiarVista={setVista} />}
          {vista === 'subir-oficial' && <SubirDocumentoOficial cambiarVista={setVista} showToast={showToast} />}

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

          {confirmDialog && (
            <DialogoConfirmacion
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

// Componente raíz que envuelve la aplicación con los providers necesarios
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
