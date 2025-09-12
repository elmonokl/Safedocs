import React from 'react'
import { Search, Filter, SortAsc } from 'lucide-react'

const SearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  filterCategory, 
  onFilterChange,
  sortBy,
  onSortChange 
}) => {
  const categories = ['', 'Apuntes', 'Guías', 'Resumen', 'Otro']
  const sortOptions = [
    { value: 'date', label: 'Fecha' },
    { value: 'title', label: 'Título' },
    { value: 'downloads', label: 'Descargas' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Barra de búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar documentos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            aria-label="Buscar documentos"
          />
        </div>

        {/* Filtro por categoría */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filterCategory}
            onChange={(e) => onFilterChange(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors appearance-none bg-white"
            aria-label="Filtrar por categoría"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category || 'Todas las categorías'}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenamiento */}
        <div className="relative">
          <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors appearance-none bg-white"
            aria-label="Ordenar por"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default SearchBar 