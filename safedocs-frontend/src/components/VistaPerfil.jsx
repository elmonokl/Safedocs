import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Save, Edit3, User } from 'lucide-react'

const getRoleLabel = (role) => {
  const roleMap = {
    'student': 'Estudiante',
    'professor': 'Profesor',
    'admin': 'Administrador',
    'super_admin': 'Super Administrador'
  }
  return roleMap[role] || role
}

const getRoleColor = (role) => {
  const colorMap = {
    'student': 'bg-blue-100 text-blue-700 border-blue-300',
    'professor': 'bg-red-100 text-red-700 border-red-300',
    'admin': 'bg-purple-100 text-purple-700 border-purple-300',
    'super_admin': 'bg-red-200 text-red-800 border-red-400'
  }
  return colorMap[role] || 'bg-gray-100 text-gray-700 border-gray-300'
}

function VistaPerfil({ cambiarVista, showToast }) {
  const [modoEdicion, setModoEdicion] = useState(false)
  const { user, updateProfile, loading } = useAuth()
  
  const [formData, setFormData] = useState({
    name: user?.name || 'Álvaro Guevara',
    email: user?.email || '',
    career: user?.career || 'Ingeniería en Computación e Informática'
  })

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const guardarCambios = async () => {
    try {
      const success = await updateProfile(formData)
      if (success) {
        showToast('Perfil actualizado correctamente', 'success')
        setModoEdicion(false)
      } else {
        showToast('Error al actualizar perfil', 'error')
      }
    } catch (error) {
      showToast('Error al actualizar perfil', 'error')
    }
  }

  const cancelarEdicion = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      career: user?.career || ''
    })
    setModoEdicion(false)
  }

  return (
    <div className="p-4 sm:p-6">
      <button
        onClick={() => cambiarVista('dashboard')}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4"
        aria-label="Volver al panel"
        title="Volver al panel"
      >
        ← Volver al panel
      </button>

      <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-750 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 sm:p-10 max-w-2xl mx-auto hover:shadow-2xl transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md">
            <User className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
            Mi Perfil
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          <div className="relative">
            <img
              src={user?.avatar || user?.profilePicture || ""}
              alt="avatar"
              className="w-28 h-28 rounded-full border-4 border-blue-500 dark:border-blue-400 shadow-lg object-cover bg-gray-200 dark:bg-gray-700 ring-4 ring-blue-100 dark:ring-blue-900/30"
            />
          </div>
          <div className="text-center sm:text-left">
            {!modoEdicion ? (
              <>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{user?.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">{user?.career}</p>
                {user?.role && (
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border-2 shadow-sm ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="text-xl font-semibold border-2 border-blue-300 dark:border-blue-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-center sm:text-left w-full"
                placeholder="Nombre completo"
                required
              />
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Correo electrónico
            </label>
            {!modoEdicion ? (
              <p className="text-gray-800 dark:text-gray-200 font-medium text-base">{user?.email}</p>
            ) : (
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all hover:border-gray-400"
                placeholder="correo@unab.cl"
                required
              />
            )}
          </div>
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <label htmlFor="career" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Carrera
            </label>
            {!modoEdicion ? (
              <p className="text-gray-800 dark:text-gray-200 font-medium text-base">{user?.career}</p>
            ) : (
              <select
                id="career"
                name="career"
                value={formData.career}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all hover:border-gray-400"
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
            )}
          </div>
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Estado</label>
            <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-bold shadow-sm">
              Activo
            </span>
          </div>
          {!modoEdicion && user?.role && (
            <div className="bg-white/50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Rol</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border-2 shadow-sm ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          {!modoEdicion ? (
            <button
              onClick={() => setModoEdicion(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 font-medium transform hover:scale-105 active:scale-95"
            >
              <Edit3 className="w-5 h-5" />
              Editar perfil
            </button>
          ) : (
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={cancelarEdicion}
                className="flex-1 sm:flex-none bg-gray-500 text-white px-6 py-3 rounded-xl shadow-md hover:bg-gray-600 transition-all duration-200 font-medium transform hover:scale-105 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambios}
                disabled={loading}
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VistaPerfil
