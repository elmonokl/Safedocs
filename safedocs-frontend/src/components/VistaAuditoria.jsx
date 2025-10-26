import React, { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'

/**
 * Vista de Auditoría
 * Muestra todos los registros de actividad del sistema
 */
function VistaAuditoria({ cambiarVista }) {
  const [eventos, setEventos] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        setCargando(true)
        const params = new URLSearchParams()
        if (filtroAccion) params.append('action', filtroAccion)
        params.append('page', pagina)
        params.append('limit', 20)
        
        const [resAudit, resStats] = await Promise.all([
          apiFetch(`/api/audit/all?${params}`),
          apiFetch('/api/audit/stats')
        ])
        
        if (!cancelado) {
          setEventos(resAudit.data || [])
          setEstadisticas(resStats.data)
          setTotalPaginas(resAudit.pagination?.totalPages || 1)
        }
      } catch (e) {
        if (!cancelado) setError(e.message || 'Error cargando auditoría')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [filtroAccion, pagina])

  const formatFecha = (iso) => new Date(iso).toLocaleString()

  const getAccionColor = (accion) => {
    const colores = {
      upload: 'bg-green-100 text-green-700',
      delete: 'bg-red-100 text-red-700',
      download: 'bg-blue-100 text-blue-700',
      view: 'bg-yellow-100 text-yellow-700',
      update: 'bg-purple-100 text-purple-700',
      comment: 'bg-gray-100 text-gray-700',
      like: 'bg-pink-100 text-pink-700'
    }
    return colores[accion] || 'bg-gray-100 text-gray-700'
  }

  const getAccionTexto = (accion) => {
    const textos = {
      upload: 'Subida',
      delete: 'Eliminación',
      download: 'Descarga',
      view: 'Visualización',
      update: 'Actualización',
      comment: 'Comentario',
      like: 'Me gusta'
    }
    return textos[accion] || accion
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Registro de Auditoría</h1>
          <button onClick={() => cambiarVista('dashboard')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Volver</button>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{estadisticas.summary.uploads}</div>
              <div className="text-sm text-gray-500">Documentos Subidos</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-600">{estadisticas.summary.deletions}</div>
              <div className="text-sm text-gray-500">Documentos Eliminados</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.summary.downloads}</div>
              <div className="text-sm text-gray-500">Descargas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-600">{estadisticas.totalActions}</div>
              <div className="text-sm text-gray-500">Total de Acciones</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                {error ? (
                  <p className="text-red-600">{error}</p>
                ) : (
                  <p className="text-gray-500">Registro completo de todas las acciones en documentos.</p>
                )}
              </div>
              <select 
                value={filtroAccion} 
                onChange={(e) => {
                  setFiltroAccion(e.target.value)
                  setPagina(1)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas las acciones</option>
                <option value="upload">Subidas</option>
                <option value="delete">Eliminaciones</option>
                <option value="download">Descargas</option>
                <option value="view">Visualizaciones</option>
                <option value="update">Actualizaciones</option>
                <option value="comment">Comentarios</option>
                <option value="like">Me gusta</option>
              </select>
            </div>
          </div>
          {cargando ? (
            <div className="p-6 text-gray-500">Cargando...</div>
          ) : eventos.length === 0 ? (
            <div className="p-6 text-gray-500">No hay eventos aún.</div>
          ) : (
              <>
                <ul className="divide-y divide-gray-200">
                  {eventos.map((evt) => (
                    <li key={evt.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">{formatFecha(evt.createdAt)}</div>
                          <div className="text-gray-900">
                            <span className="font-medium text-indigo-600">{evt.actor.name}</span>
                            <span className="mx-1">({evt.actor.email})</span>
                            <span className="mx-1">
                              {evt.action === 'upload' && `subió el documento`}
                              {evt.action === 'delete' && `eliminó el documento`}
                              {evt.action === 'download' && `descargó el documento`}
                              {evt.action === 'view' && `visualizó el documento`}
                              {evt.action === 'update' && `actualizó el documento`}
                              {evt.action === 'comment' && `comentó el documento`}
                              {evt.action === 'like' && `le dio me gusta al documento`}
                            </span>
                            <span className="font-medium text-gray-700">"{evt.document.title}"</span>
                          </div>
                          {evt.description && (
                            <div className="mt-2 text-sm text-gray-600">{evt.description}</div>
                          )}
                          {evt.comment && (
                            <div className="mt-2 px-3 py-2 bg-gray-50 text-gray-700 rounded text-sm">"{evt.comment}"</div>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getAccionColor(evt.action)}`}>
                          {getAccionTexto(evt.action)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                {totalPaginas > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Página {pagina} de {totalPaginas}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPagina(pagina - 1)}
                        disabled={pagina === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPagina(pagina + 1)}
                        disabled={pagina === totalPaginas}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </>
          )}
        </div>
      </div>
    </div>
  )
}

export default VistaAuditoria