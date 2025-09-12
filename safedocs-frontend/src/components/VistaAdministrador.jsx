import React from 'react'

export default function VistaAdministrador({ cambiarVista }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-indigo-700 mb-4">Panel Administrador</h1>
      <p className="text-gray-700 mb-6">Gestiona usuarios, documentos y auditorías.</p>
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => cambiarVista('admin')}>Ir al Panel Admin</button>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => cambiarVista('auditoria')}>Ver Auditoría</button>
      </div>
    </div>
  )
}




