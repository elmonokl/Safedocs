// Contexto de autenticación que maneja el estado del usuario y las operaciones de login/registro
import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const AuthContext = createContext()

// Hook personalizado para acceder al contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

// Provider que envuelve la aplicación y provee el estado de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Efecto que verifica si el usuario está autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }
        // Verifica el token con el servidor
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

  // Función para iniciar sesión
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

  // Función para registrar un nuevo usuario
  const register = async (userData) => {
    setError('')
    setLoading(true)
    
    try {
      const { confirmPassword, ...dataToSend } = userData
      
      const resp = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: dataToSend
      })
      const token = resp?.data?.token
      const u = resp?.data?.user
      if (!token || !u) throw new Error('Respuesta inválida del servidor')
      localStorage.setItem('token', token)
      localStorage.setItem('safedocs_user', JSON.stringify(u))
      setUser(u)
      return true
    } catch (err) {
      // Extraer mensaje de error de la respuesta
      let errorMessage = 'Error en el registro'
      
      // Prioridad: mensaje directo > respuesta del servidor > errores de validación
      if (err.message && err.message !== 'Error en el registro') {
        errorMessage = err.message
      }
      
      if (err.response) {
        // Si hay respuesta del servidor con mensaje principal
        if (err.response.message) {
          errorMessage = err.response.message
        }
        
        // Si hay errores de validación específicos, agregarlos o reemplazar
        if (err.response.errors && Array.isArray(err.response.errors) && err.response.errors.length > 0) {
          const validationErrors = err.response.errors.map(e => e.message).join(', ')
          if (validationErrors) {
            errorMessage = validationErrors
          }
        }
      }
      
      console.error('Error completo en registro:', err)
      console.error('Mensaje de error extraído:', errorMessage)
      
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch (_) {}
    setUser(null)
    localStorage.removeItem('safedocs_user')
    localStorage.removeItem('token')
  }

  // Función para actualizar el perfil del usuario
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

  // Función para eliminar la cuenta del usuario
  const deleteAccount = async (confirmation) => {
    setError('')
    setLoading(true)
    
    try {
      const resp = await apiFetch('/api/auth/account', {
        method: 'DELETE',
        body: { confirmation }
      })
      if (!resp?.success) throw new Error(resp?.message || 'No se pudo eliminar la cuenta')
      setUser(null)
      localStorage.removeItem('safedocs_user')
      localStorage.removeItem('token')
      return true
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la cuenta')
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
    deleteAccount,
    clearError: () => setError('')
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 