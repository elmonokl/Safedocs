// src/components/VistaAmigos.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// FUTURO: Funcionalidades avanzadas (agregar amigos, compartir QR, ver perfil)
// import AddFriendModal from './AddFriendModal'
// import ShareQRModal from './ShareQRModal'
// import FriendProfileModal from './FriendProfileModal'

const amigos = [
  {
    nombre: 'Don Carter',
    estado: 'En línea',
    ultimaConexion: null,
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Don_Carter.png',
  },
  {
    nombre: 'BACK',
    estado: 'Sin conexión',
    ultimaConexion: 'hace 18 h 28 min',
    avatar: 'https://i.pravatar.cc/150?img=51',
  },
  {
    nombre: 'Dexter Morgan',
    estado: 'Sin conexión',
    ultimaConexion: 'hace 5 h 44 min',
    avatar: 'https://i.pravatar.cc/150?img=68',
  },
  {
    nombre: 'dispei',
    estado: 'Sin conexión',
    ultimaConexion: 'hace 3 h 2 min',
    avatar: 'https://i.pravatar.cc/150?img=59',
  },
  {
    nombre: 'El_bordoy',
    estado: 'Sin conexión',
    ultimaConexion: 'hace 5 h 5 min',
    avatar: 'https://i.pravatar.cc/150?img=66',
  },
]

function VistaAmigos({ cambiarVista }) {
  const [cargando, setCargando] = useState(true)
  // FUTURO: estados para funcionalidades avanzadas
  // const [showAdd, setShowAdd] = useState(false)
  // const [showQR, setShowQR] = useState(false)
  // const [selected, setSelected] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setCargando(false), 900)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="p-6">
      <button
        onClick={() => cambiarVista('dashboard')}
        className="text-2xl font-bold text-indigo-800 mb-4 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
        aria-label="Volver al panel"
        title="Volver al panel"
      >
        Amigos
      </button>
      {/* FUTURO: acciones rápidas
      <div className="mb-4 flex gap-2">
        <button onClick={() => setShowAdd(true)} className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Agregar amigo</button>
        <button onClick={() => setShowQR(true)} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">Compartir QR</button>
      </div>
      */}
      <div className="space-y-4">
        <AnimatePresence>
          {cargando
            ? Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="flex items-center bg-white/60 rounded-lg shadow border p-4 gap-4 animate-pulse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-indigo-100 rounded w-1/2" />
                    <div className="h-3 bg-indigo-50 rounded w-1/3" />
                  </div>
                </motion.div>
              ))
            : amigos.map((amigo, i) => (
                <motion.div
                  key={i}
                  className="flex items-center bg-white rounded-lg shadow border p-4 gap-4 hover:bg-indigo-50 hover:shadow-lg transition transform-gpu"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <img src={amigo.avatar} alt={amigo.nombre} className="w-12 h-12 rounded-full object-cover shadow" />
                  <div>
                    {/* FUTURO: abrir perfil del amigo en modal al hacer clic */}
                    <p className={`font-semibold ${amigo.estado === 'En línea' ? 'text-green-600' : 'text-gray-800'}`}>
                      {amigo.nombre}
                    </p>
                    <p className="text-sm text-gray-500">
                      {amigo.estado === 'En línea' ? 'Conectado ahora' : `Última conexión: ${amigo.ultimaConexion}`}
                    </p>
                  </div>
                </motion.div>
              ))}
        </AnimatePresence>
      </div>
      {/* FUTURO: Modales para agregar amigos, compartir QR y ver perfil */}
      {/**
      <AddFriendModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ShareQRModal value={`safedocs:user:${'me'}`} onClose={() => setShowQR(false)} />
      <FriendProfileModal friend={selected} onClose={() => setSelected(null)} />
      */}
    </div>
  )
}

export default VistaAmigos
