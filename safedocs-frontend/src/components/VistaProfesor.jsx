import React from 'react'

export default function VistaProfesor({ cambiarVista }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-indigo-700 mb-4">Panel Profesor</h1>
      <p className="text-gray-700 mb-6">Puedes revisar y gestionar documentos de tus cursos.</p>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => cambiarVista('dashboard')}>Ir a Documentos</button>
    </div>
  )
}




