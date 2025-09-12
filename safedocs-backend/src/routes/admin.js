const express = require('express');
const { body } = require('express-validator');
const AdminController = require('../controllers/AdminController');
const { requireAdmin, requirePermission, requireSuperAdmin } = require('../middleware/adminAuth');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener estadísticas del sistema (requiere admin)
router.get('/stats', requireAdmin, AdminController.getSystemStats);

// Obtener todos los usuarios (requiere permiso de gestión de usuarios)
router.get('/users', requirePermission('manage_users'), AdminController.getAllUsers);

// Cambiar rol de usuario (requiere permiso de gestión de usuarios)
router.put('/users/:userId/role', 
  requirePermission('manage_users'),
  [
    body('newRole')
      .isIn(['student', 'professor', 'admin', 'super_admin'])
      .withMessage('Rol inválido')
  ],
  AdminController.changeUserRole
);

// Activar/desactivar usuario (requiere permiso de gestión de usuarios)
router.put('/users/:userId/status',
  requirePermission('manage_users'),
  [
    body('isActive')
      .isBoolean()
      .withMessage('El estado debe ser un valor booleano')
  ],
  AdminController.toggleUserStatus
);

// Obtener documentos reportados (requiere permiso de gestión de documentos)
router.get('/documents/reported',
  requirePermission('manage_documents'),
  AdminController.getReportedDocuments
);

// Eliminar documento como admin (requiere permiso de gestión de documentos)
router.delete('/documents/:documentId',
  requirePermission('manage_documents'),
  [
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('El motivo debe tener entre 1 y 500 caracteres')
  ],
  AdminController.deleteDocumentAsAdmin
);

// Rutas solo para super administradores
router.use('/super', requireSuperAdmin);

// Aquí puedes agregar rutas específicas para super admins
// Por ejemplo: gestión de otros administradores, configuración del sistema, etc.

module.exports = router;
