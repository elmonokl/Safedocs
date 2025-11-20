import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  Settings, 
  Eye, 
  Edit, 
  Trash2,
  UserCheck,
  UserX,
  Download,
  Upload
} from 'lucide-react';
import { apiFetch } from '../utils/api';

function PanelAdmin({ cambiarVista, showToast, showConfirmDialog }) {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reportedDocs, setReportedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const tabs = [
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/admin/stats');
      setStats(data.data);
    } catch (error) {
      showToast(error.message || 'Error cargando estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/admin/users?page=${page}&limit=10`);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      showToast(error.message || 'Error cargando usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadReportedDocs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/admin/documents/reported');
      setReportedDocs(data.data.documents);
    } catch (error) {
      showToast(error.message || 'Error cargando documentos reportados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/role`, { method: 'PUT', body: { newRole } });
      showToast('Rol de usuario actualizado', 'success');
      loadUsers(pagination.page);
    } catch (error) {
      showToast(error.message || 'Error actualizando rol', 'error');
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/status`, { method: 'PUT', body: { isActive } });
      showToast(`Usuario ${isActive ? 'activado' : 'desactivado'}`, 'success');
      loadUsers(pagination.page);
    } catch (error) {
      showToast(error.message || 'Error cambiando estado', 'error');
    }
  };

  const deleteDocumentAsAdmin = async (documentId, reason) => {
    try {
      await apiFetch(`/api/admin/documents/${documentId}`, { method: 'DELETE', body: { reason } });
      showToast('Documento eliminado', 'success');
      loadReportedDocs();
    } catch (error) {
      showToast(error.message || 'Error eliminando documento', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'documents') {
      loadReportedDocs();
    }
  }, [activeTab]);

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats?.users?.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500"
        >
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-full">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.role}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.totalUsers}</p>
              <p className="text-sm text-green-600">{stat.onlineUsers} en línea</p>
            </div>
          </div>
        </motion.div>
      ))}
      {stats?.documents && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documentos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.documents.totalDocuments}</p>
              <p className="text-sm text-blue-600">{stats.documents.totalDownloads} descargas</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  // Renderizar lista de usuarios
  const renderUsers = () => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Gestión de Usuarios</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'professor' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => changeUserRole(user._id, user.role === 'admin' ? 'student' : 'admin')}
                      className="text-indigo-600 hover:text-indigo-900"
                      disabled={user.role === 'super_admin'}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user._id, !user.isActive)}
                      className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                      disabled={user.role === 'super_admin'}
                    >
                      {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => loadUsers(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {pagination.page} de {pagination.pages}
            </span>
            <button
              onClick={() => loadUsers(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Documentos Reportados</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {reportedDocs.map((doc) => (
          <div key={doc._id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
                  <p className="text-sm text-gray-500">Subido por {doc.author?.name}</p>
                  <p className="text-xs text-gray-400">0 descargas • {new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => showConfirmDialog({
                    title: 'Eliminar documento',
                    message: `¿Estás seguro de que quieres eliminar "${doc.title}"?`,
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    type: 'danger',
                    onConfirm: () => deleteDocumentAsAdmin(doc._id, 'Documento problemático')
                  })}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {reportedDocs.length === 0 && (
          <div className="px-6 py-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay documentos reportados</p>
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar configuración
  const renderSettings = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración del Sistema</h3>
      <p className="text-gray-500">Configuraciones avanzadas del sistema estarán disponibles aquí.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
            <button
              onClick={() => cambiarVista('dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {!loading && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'stats' && renderStats()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'documents' && renderDocuments()}
            {activeTab === 'settings' && renderSettings()}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default PanelAdmin;
