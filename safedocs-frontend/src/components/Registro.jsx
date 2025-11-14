import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function Registro({ cambiarVista, showToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    career: 'Ingeniería en Computación e Informática',
    role: 'student'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, loading, clearError } = useAuth()

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error')
      return
    }

    if (formData.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }

    try {
      const success = await register(formData)
      if (success) {
        showToast('¡Registro exitoso! Bienvenido a SafeDocs', 'success')
        cambiarVista('dashboard')
      } else {
        const errorMessage = 'Error en el registro. Verifica que todos los campos sean correctos.'
        showToast(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error en el registro:', error)
      showToast('Error en el registro. Intenta nuevamente.', 'error')
    }
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 px-4 min-h-[70vh] bg-gradient-to-br from-blue-100 via-white to-red-50"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-bold text-blue-800 mb-6 drop-shadow">Crear Cuenta</h2>
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100 space-y-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div>
          <label htmlFor="name" className="block mb-2 text-gray-700">
            Nombre completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            placeholder="Nombre Apellido"
            required
            aria-describedby="name-help"
          />
          <p id="name-help" className="text-xs text-gray-500 -mt-3 mb-4">
            Ingresa tu nombre completo
          </p>
        </div>

        <div>
          <label htmlFor="email" className="block mb-2 text-gray-700">
            Correo institucional
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            placeholder="correo@unab.cl"
            required
            aria-describedby="email-help"
          />
          <p id="email-help" className="text-xs text-gray-500 -mt-3 mb-4">
            Debe ser un correo institucional de la UNAB
          </p>
        </div>

        <div>
          <label htmlFor="career" className="block mb-2 text-gray-700">
            Carrera
          </label>
          <select
            id="career"
            name="career"
            value={formData.career}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            required
          >
            <option value="Ingeniería en Computación e Informática">Ingeniería en Computación e Informática</option>
            <option value="Ingeniería Civil Informática">Ingeniería Civil Informática</option>
            <option value="Ingeniería Civil">Ingeniería Civil</option>
            <option value="Ingeniería Comercial">Ingeniería Comercial</option>
            <option value="Medicina">Medicina</option>
            <option value="Derecho">Derecho</option>
            <option value="Psicología">Psicología</option>
            <option value="Otra">Otra</option>
          </select>
        </div>

        <div>
          <label htmlFor="role" className="block mb-2 text-gray-700">
            Rol
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition"
            required
            aria-describedby="role-help"
          >
            <option value="student">Estudiante</option>
            <option value="professor">Docente</option>
            <option value="admin">Administrador</option>
          </select>
          <p id="role-help" className="text-xs text-gray-500 -mt-3 mb-4">
            Selecciona tu rol en la plataforma
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block mb-2 text-gray-700">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 pr-10 border rounded mb-4 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 shadow-sm transition"
              placeholder="********"
              required
              minLength={6}
              aria-describedby="password-help"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p id="password-help" className="text-xs text-gray-500 -mt-3 mb-4">
            Mínimo 6 caracteres
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-2 text-gray-700">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 pr-10 border rounded mb-6 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 shadow-sm transition"
              placeholder="********"
              required
              aria-describedby="confirm-password-help"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p id="confirm-password-help" className="text-xs text-gray-500 -mt-3 mb-4">
            Repite tu contraseña
          </p>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-xl shadow-lg hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          whileHover={{ scale: loading ? 1 : 1.04 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Registrarse'
          )}
        </motion.button>
      </motion.form>
      <p className="mt-4 text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <button 
          onClick={() => cambiarVista('login')} 
          className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
        >
          Inicia sesión
        </button>
      </p>
    </motion.div>
  )
}

export default Registro
