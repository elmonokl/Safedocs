import React from 'react'

export default function VistaProfesor({ cambiarVista }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-2xl font-semibold text-blue-800 mb-4">Panel Profesor</h1>
      <p className="text-gray-700 mb-6">Puedes revisar y gestionar documentos de tus cursos.</p>
      <button className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition" onClick={() => cambiarVista('dashboard')}>Ir a Documentos</button>
    </div>
  )
}




