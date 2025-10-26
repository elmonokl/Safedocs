const AuditLog = require('../models/AuditLog');

/**
 * Controlador de Auditoría
 * Gestiona todos los registros de actividad del sistema
 */
class AuditController {
  // Obtener todos los registros de auditoría con filtros y paginación
  static async getAllAuditLogs(req, res) {
    try {
      const { page = 1, limit = 50, action, actorId, documentId } = req.query;
      
      const filters = {};
      if (action) filters.action = action;
      if (actorId) filters.actorId = actorId;
      if (documentId) filters.documentId = documentId;

      const numericLimit = Math.min(parseInt(limit, 10) || 50, 100);
      const numericPage = Math.max(parseInt(page, 10) || 1, 1);

      const [logs, total] = await Promise.all([
        AuditLog.getAuditLogs(filters, {
          page: numericPage,
          limit: numericLimit,
          sortBy: 'createdAt',
          sortOrder: -1
        }),
        AuditLog.countDocuments(filters)
      ]);

      res.json({
        success: true,
        data: logs.map(log => ({
          id: log._id,
          action: log.action,
          actor: {
            id: log.actor?._id,
            name: log.actor?.name || 'Usuario eliminado',
            email: log.actor?.email || 'Email no disponible'
          },
          document: {
            id: log.document?._id,
            title: log.document?.title || 'Documento eliminado',
            fileName: log.document?.fileName || 'Archivo no disponible'
          },
          description: log.description,
          comment: log.comment,
          createdAt: log.createdAt
        })),
        pagination: {
          total,
          page: numericPage,
          limit: numericLimit,
          totalPages: Math.ceil(total / numericLimit)
        }
      });
    } catch (error) {
      console.error('Error obteniendo auditoría:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  }

  // Obtener estadísticas agregadas de acciones de auditoría
  static async getAuditStats(req, res) {
    try {
      const stats = await AuditLog.aggregate([
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            lastAction: { $max: '$createdAt' }
          }
        },
        {
          $project: {
            action: '$_id',
            count: 1,
            lastAction: 1,
            _id: 0
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const totalActions = await AuditLog.countDocuments();
      const uniqueActors = await AuditLog.distinct('actorId').length;

      res.json({
        success: true,
        data: {
          totalActions,
          uniqueActors,
          actionStats: stats,
          summary: {
            uploads: stats.find(s => s.action === 'upload')?.count || 0,
            deletions: stats.find(s => s.action === 'delete')?.count || 0,
            downloads: stats.find(s => s.action === 'download')?.count || 0,
            views: stats.find(s => s.action === 'view')?.count || 0
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  }

  // Obtener eventos de auditoría del usuario autenticado
  static async getMyAuditLogs(req, res) {
    try {
      const { userId } = req.user;
      const { limit = 50, page = 1, action } = req.query;

      const numericLimit = Math.min(parseInt(limit, 10) || 50, 100);
      const numericPage = Math.max(parseInt(page, 10) || 1, 1);
      const filter = { userId };
      if (action) filter.action = action;

      const [items, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: -1 })
          .limit(numericLimit)
          .skip((numericPage - 1) * numericLimit)
          .populate('actorId', 'name email')
          .populate('documentId', 'title'),
        AuditLog.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: items.map((evt) => ({
          id: evt._id,
          action: evt.action,
          actor: evt.actorId?.name || 'Usuario',
          actorEmail: evt.actorId?.email,
          document: evt.documentId?.title || 'Documento',
          fecha: evt.createdAt,
          descripcion: evt.description,
          comentario: evt.comment,
        })),
        pagination: {
          total,
          page: numericPage,
          limit: numericLimit,
        },
      });
    } catch (error) {
      console.error('Error obteniendo auditoría:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
}

module.exports = AuditController;


