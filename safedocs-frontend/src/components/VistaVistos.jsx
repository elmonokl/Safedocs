import React from 'react'

// VistaVistos
// Lista quiénes vieron tus documentos recientes
function VistaVistos({ cambiarVista }) {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quién vio mis documentos</h1>
          <button
            onClick={() => cambiarVista('dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Volver
          </button>
        </div>

        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          <div className="p-4">
            <p className="text-gray-500">
              Aquí podrás ver una lista de usuarios que han visto tus documentos (últimos 30 días).
            </p>
          </div>
          {/* Placeholder de lista */}
          <div className="p-4">
            <div className="text-sm text-gray-400">Aún no hay visualizaciones registradas.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VistaVistos






