import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

// Contexto de autenticación: expone usuario, estado de carga y acciones
const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Al montar: verifica sesión usando el token guardado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }
        const resp = await apiFetch('/api/auth/verify')
        const u = resp?.data?.user
        if (u) {
          setUser(u)
          localStorage.setItem('safedocs_user', JSON.stringify(u))
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('safedocs_user')
        }
      } catch (_) {
        localStorage.removeItem('token')
        localStorage.removeItem('safedocs_user')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Iniciar sesión y persistir token/usuario
  const login = async (email, password) => {
    setError('')
    setLoading(true)
    
    try {
      const resp = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      const token = resp?.data?.token
      const u = resp?.data?.user
      if (!token || !u) throw new Error('Respuesta inválida del servidor')
      localStorage.setItem('token', token)
      localStorage.setItem('safedocs_user', JSON.stringify(u))
      setUser(u)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Registro de usuario y login inmediato
  const register = async (userData) => {
    setError('')
    setLoading(true)
    
    try {
      const resp = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: userData
      })
      const token = resp?.data?.token
      const u = resp?.data?.user
      if (!token || !u) throw new Error('Respuesta inválida del servidor')
      localStorage.setItem('token', token)
      localStorage.setItem('safedocs_user', JSON.stringify(u))
      setUser(u)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Cerrar sesión: intenta notificar al backend y limpia storage
  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch (_) {}
    setUser(null)
    localStorage.removeItem('safedocs_user')
    localStorage.removeItem('token')
  }

  // Actualiza datos del perfil en el backend y en localStorage
  const updateProfile = async (profileData) => {
    setError('')
    setLoading(true)
    
    try {
      const resp = await apiFetch('/api/auth/profile', { method: 'PUT', body: profileData })
      const u = resp?.data?.user
      if (!u) throw new Error('No se pudo actualizar el perfil')
      setUser(u)
      localStorage.setItem('safedocs_user', JSON.stringify(u))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError: () => setError('')
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 