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
        className="text-2xl font-semibold text-blue-800 mb-6 text-center sm:text-left flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
        aria-label="Volver al panel"
        title="Volver al panel"
      >
        <User className="w-6 h-6" />
        Mi Perfil
      </button>

      <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-6 sm:p-8 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <img
            src={user?.avatar || user?.profilePicture || ""}
            alt="avatar"
            className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-md object-cover bg-gray-200"
          />
          <div className="text-center sm:text-left">
            {!modoEdicion ? (
              <>
                <p className="text-2xl font-semibold text-blue-700">{user?.name}</p>
                <p className="text-sm text-gray-500 italic">{user?.career}</p>
                {user?.role && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
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
                className="text-xl font-semibold border-b border-blue-300 focus:outline-none bg-transparent text-center sm:text-left"
                placeholder="Nombre completo"
                required
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-gray-600">
              Correo electrónico
            </label>
            {!modoEdicion ? (
              <p className="text-gray-800 font-medium">{user?.email}</p>
            ) : (
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                placeholder="correo@unab.cl"
                required
              />
            )}
          </div>
          <div>
            <label htmlFor="career" className="text-sm text-gray-600">
              Carrera
            </label>
            {!modoEdicion ? (
              <p className="text-gray-800 font-medium">{user?.career}</p>
            ) : (
              <select
                id="career"
                name="career"
                value={formData.career}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
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
          <div>
            <label className="text-sm text-gray-600">Estado</label>
            <p className="text-green-600 font-semibold">Activo</p>
          </div>
          {!modoEdicion && user?.role && (
            <div>
              <label className="text-sm text-gray-600">Rol</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={() => cambiarVista('dashboard')}
            className="text-blue-600 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            ← Volver al panel
          </button>
          {!modoEdicion ? (
            <button
              onClick={() => setModoEdicion(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Editar perfil
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancelarEdicion}
                className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambios}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
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
