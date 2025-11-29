import React, { useEffect, useState } from 'react'
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react'
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
      upload: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      download: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      view: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      update: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      comment: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      like: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
    }
    return colores[accion] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-md">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Registro de Auditoría
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Historial completo de acciones del sistema</p>
            </div>
          </div>
          <button 
            onClick={() => cambiarVista('dashboard')} 
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow"
          >
            Volver
          </button>
        </div>

        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg dark:border-2 dark:border-gray-700 hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{estadisticas.summary.uploads}</div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">Documentos Subidos</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg dark:border-2 dark:border-gray-700 hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-red-200 dark:border-red-800">
              <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">{estadisticas.summary.deletions}</div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">Documentos Eliminados</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg dark:border-2 dark:border-gray-700 hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{estadisticas.summary.downloads}</div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">Descargas</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg dark:border-2 dark:border-gray-700 hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">{estadisticas.totalActions}</div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">Total de Acciones</div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:border-2 dark:border-gray-700 hover:shadow-xl transition-shadow">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
            <div className="flex items-center justify-between">
              <div>
                {error ? (
                  <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Registro completo de todas las acciones en documentos.</p>
                )}
              </div>
              <select 
                value={filtroAccion} 
                onChange={(e) => {
                  setFiltroAccion(e.target.value)
                  setPagina(1)
                }}
                className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all hover:border-gray-400 dark:hover:border-gray-600 shadow-sm font-medium"
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
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-pulse" />
              </div>
              <p className="text-base font-medium text-gray-600 dark:text-gray-400">Cargando registros de auditoría...</p>
            </div>
          ) : eventos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">No hay eventos aún</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Los registros de actividad aparecerán aquí</p>
            </div>
          ) : (
              <>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {eventos.map((evt) => (
                    <li key={evt.id} className="p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 dark:hover:from-gray-700/50 dark:hover:to-gray-700/30 transition-all duration-200 group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {formatFecha(evt.createdAt)}
                            </div>
                          </div>
                          <div className="text-gray-900 dark:text-gray-100">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{evt.actor?.name || evt.actorName || 'Usuario desconocido'}</span>
                            {(evt.actor?.email || evt.actorEmail) && (
                              <span className="mx-1 text-gray-500 dark:text-gray-400 text-sm">({evt.actor?.email || evt.actorEmail})</span>
                            )}
                            <span className="mx-1 text-gray-600 dark:text-gray-400">
                              {evt.action === 'upload' && `subió el documento`}
                              {evt.action === 'delete' && `eliminó el documento`}
                              {evt.action === 'download' && `descargó el documento`}
                              {evt.action === 'view' && `visualizó el documento`}
                              {evt.action === 'update' && `actualizó el documento`}
                              {evt.action === 'comment' && `comentó el documento`}
                              {evt.action === 'like' && `le dio me gusta al documento`}
                            </span>
                            {(evt.document?.title || evt.documentTitle) && (
                              <span className="font-semibold text-gray-800 dark:text-gray-200">"{evt.document?.title || evt.documentTitle}"</span>
                            )}
                          </div>
                          {evt.description && (
                            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                              {evt.description}
                            </div>
                          )}
                          {evt.comment && (
                            <div className="mt-3 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 text-gray-700 dark:text-gray-300 rounded-r-lg text-sm italic">
                              "{evt.comment}"
                            </div>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${getAccionColor(evt.action)} dark:${getAccionColor(evt.action).replace('bg-', 'dark:bg-').replace('text-', 'dark:text-')}`}>
                          {getAccionTexto(evt.action)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                {totalPaginas > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Página <span className="font-bold text-gray-900 dark:text-gray-100">{pagina}</span> de <span className="font-bold text-gray-900 dark:text-gray-100">{totalPaginas}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagina(pagina - 1)}
                        disabled={pagina === 1}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-2 border-gray-300 dark:border-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm disabled:hover:scale-100 text-gray-700 dark:text-gray-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </button>
                      <button
                        onClick={() => setPagina(pagina + 1)}
                        disabled={pagina === totalPaginas}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-2 border-gray-300 dark:border-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm disabled:hover:scale-100 text-gray-700 dark:text-gray-300"
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
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