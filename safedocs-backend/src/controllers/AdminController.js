const User = require('../models/User');
const Document = require('../models/Document');
const fs = require('fs').promises;
// Validaciones ya son manejadas en rutas con handleValidationErrors
const { VALID_ROLES } = require('../constants');

class AdminController {
  // Obtener estadísticas generales del sistema
  static async getSystemStats(req, res, next) {
    try {
      const userStats = await User.getUserStats();
      const documentStats = await Document.getStats();
      
      res.json({
        success: true,
        data: {
          users: userStats,
          documents: documentStats[0] || {},
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los usuarios (con paginación)
  static async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const role = req.query.role;
      const search = req.query.search;
      
      let query = { isActive: true };
      
      if (role) {
        query.role = role;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { career: { $regex: search, $options: 'i' } }
        ];
      }
      
      const skip = (page - 1) * limit;
      
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await User.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Cambiar rol de usuario
  static async changeUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { newRole } = req.body;

      // Verificar que el rol sea válido
      if (!VALID_ROLES.includes(newRole)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido'
        });
      }

      // Verificar que no se cambie el rol de un super admin (a menos que sea otro super admin)
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar que el usuario actual sea super admin si intenta cambiar el rol de otro super admin
      const currentUser = await User.findById(req.user.userId);
      if (targetUser.role === 'super_admin' && currentUser.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'No puedes cambiar el rol de un super administrador'
        });
      }

      // Actualizar rol
      targetUser.role = newRole;
      await targetUser.save();

      res.json({
        success: true,
        message: 'Rol de usuario actualizado exitosamente',
        data: {
          user: targetUser.toPublicJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Desactivar/activar usuario
  static async toggleUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir desactivar super admins
      if (user.role === 'super_admin' && !isActive) {
        return res.status(403).json({
          success: false,
          message: 'No puedes desactivar un super administrador'
        });
      }

      user.isActive = isActive;
      await user.save();

      res.json({
        success: true,
        message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
        data: {
          user: user.toPublicJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener documentos reportados o problemáticos
  static async getReportedDocuments(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const skip = (page - 1) * limit;
      
      // Por ahora, obtenemos documentos con 0 descargas (potencialmente problemáticos)
      const documents = await Document.find({ downloadsCount: 0, isPublic: true })
        .populate('author', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Document.countDocuments({ downloadsCount: 0, isPublic: true });
      
      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar documento como admin
  static async deleteDocumentAsAdmin(req, res, next) {
    try {
      const { documentId } = req.params;
      const { reason } = req.body;

      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      // Eliminar archivo físico del sistema
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.warn('No se pudo eliminar el archivo físico:', error.message);
      }

      // Aquí podrías agregar lógica para notificar al usuario
      // y guardar el motivo de eliminación

      await Document.findByIdAndDelete(documentId);

      res.json({
        success: true,
        message: 'Documento eliminado por administrador',
        data: {
          deletedDocument: {
            id: documentId,
            title: document.title,
            reason: reason || 'Eliminado por administrador'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
