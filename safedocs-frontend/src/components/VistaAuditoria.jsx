// src/components/VistaAuditoria.jsx
import React, { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'

function VistaAuditoria({ cambiarVista }) {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        setCargando(true)
        const res = await apiFetch('/api/audit')
        if (!cancelado) setEventos(res.data || [])
      } catch (e) {
        if (!cancelado) setError(e.message || 'Error cargando auditoría')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  const formatFecha = (iso) => new Date(iso).toLocaleString()

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h1>
          <button onClick={() => cambiarVista('dashboard')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Volver</button>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            {error ? (<p className="text-red-600">{error}</p>) : (<p className="text-gray-500">Aquí verás cuando alguien visualiza o comenta tus documentos.</p>)}
          </div>
          {cargando ? (
            <div className="p-6 text-gray-500">Cargando...</div>
          ) : eventos.length === 0 ? (
            <div className="p-6 text-gray-500">No hay eventos aún.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {eventos.map((evt) => (
                <li key={evt.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{formatFecha(evt.fecha)}</div>
                      {evt.tipo === 'view' && (<div className="mt-1 text-gray-900"><span className="font-medium">{evt.actor}</span> vio tu documento <span className="font-medium">{evt.documento}</span>.</div>)}
                      {evt.tipo === 'comment' && (
                        <div className="mt-1 text-gray-900">
                          <span className="font-medium">{evt.actor}</span> comentó tu documento <span className="font-medium">{evt.documento}</span>.
                          {evt.comentario && (<div className="mt-2 px-3 py-2 bg-gray-50 text-gray-700 rounded">“{evt.comentario}”</div>)}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${evt.tipo === 'view' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{evt.tipo === 'view' ? 'Visualización' : 'Comentario'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default VistaAuditoria


