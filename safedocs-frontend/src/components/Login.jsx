// src/components/Login.jsx
// Formulario de inicio de sesión con feedback y accesibilidad básica.
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function Login({ cambiarVista, showToast }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, error, clearError } = useAuth()

  const manejarLogin = async (e) => {
    e.preventDefault()
    clearError()
    
    const success = await login(correo, contrasena)
    if (success) {
      showToast('¡Inicio de sesión exitoso!', 'success')
      cambiarVista('dashboard')
    } else {
      showToast(error, 'error')
    }
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 px-4 min-h-[70vh] bg-gradient-to-br from-indigo-100 via-white to-indigo-200"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-bold text-indigo-800 mb-6 drop-shadow">Iniciar Sesión</h2>
      <motion.form
        onSubmit={manejarLogin}
        className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border border-indigo-100"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div>
          <label htmlFor="email" className="block mb-1 text-gray-700">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 shadow-sm transition"
            placeholder="correo@unab.cl"
            required
            aria-describedby="email-help"
          />
          <p id="email-help" className="text-xs text-gray-500 mt-1">
            Debe ser un correo institucional de la UNAB
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 text-gray-700">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full p-2 pr-10 border rounded focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 shadow-sm transition"
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
          <p id="password-help" className="text-xs text-gray-500 mt-1">
            Mínimo 6 caracteres
          </p>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-xl shadow-lg hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          whileHover={{ scale: loading ? 1 : 1.04 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            'Entrar'
          )}
        </motion.button>
      </motion.form>

      <p className="mt-4 text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <button 
          onClick={() => cambiarVista('registro')} 
          className="text-indigo-600 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
        >
          Regístrate
        </button>
      </p>
    </motion.div>
  )
}

export default Login
