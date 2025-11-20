const AuditLog = require('../models/AuditLog');

class AuditController {
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
          .populate('actorId', 'name email profilePicture')
          .populate('documentId', 'title fileName'),
        AuditLog.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: items.map((evt) => ({
          id: evt._id,
          action: evt.action,
          actor: evt.actorId?.name || 'Usuario',
          actorEmail: evt.actorId?.email,
          actorPicture: evt.actorId?.profilePicture,
          document: evt.documentId?.title || 'Documento',
          documentId: evt.documentId?._id,
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

  static async getDocumentViews(req, res) {
    try {
      const { userId } = req.user;
      const { limit = 100, page = 1, days = 30 } = req.query;

      const numericLimit = Math.min(parseInt(limit, 10) || 100, 200);
      const numericPage = Math.max(parseInt(page, 10) || 1, 1);
      const daysAgo = Math.max(parseInt(days, 10) || 30, 1);
      
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - daysAgo);

      const filter = {
        userId: userId,
        action: 'view',
        createdAt: { $gte: dateLimit },
        actorId: { $ne: userId }
      };

      const [views, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: -1 })
          .limit(numericLimit)
          .skip((numericPage - 1) * numericLimit)
          .populate('actorId', 'name email profilePicture career')
          .populate('documentId', 'title fileName category'),
        AuditLog.countDocuments(filter),
      ]);

      const viewsByDocument = {};
      views.forEach(view => {
        const docId = view.documentId?._id?.toString() || 'unknown';
        if (!viewsByDocument[docId]) {
          viewsByDocument[docId] = {
            document: {
              id: view.documentId?._id,
              title: view.documentId?.title || 'Documento eliminado',
              fileName: view.documentId?.fileName || '',
              category: view.documentId?.category || ''
            },
            views: []
          };
        }
        viewsByDocument[docId].views.push({
          id: view._id,
          viewer: {
            id: view.actorId?._id,
            name: view.actorId?.name || 'Usuario eliminado',
            email: view.actorId?.email || 'Email no disponible',
            profilePicture: view.actorId?.profilePicture,
            career: view.actorId?.career
          },
          viewedAt: view.createdAt,
          description: view.description
        });
      });

      const documentsWithViews = Object.values(viewsByDocument).sort((a, b) => {
        const lastViewA = a.views[0]?.viewedAt || new Date(0);
        const lastViewB = b.views[0]?.viewedAt || new Date(0);
        return lastViewB - lastViewA;
      });

      res.json({
        success: true,
        data: {
          documents: documentsWithViews,
          totalViews: total,
          uniqueDocuments: Object.keys(viewsByDocument).length,
          dateRange: {
            from: dateLimit,
            to: new Date()
          }
        },
        pagination: {
          total,
          page: numericPage,
          limit: numericLimit,
          totalPages: Math.ceil(total / numericLimit)
        }
      });
    } catch (error) {
      console.error('Error obteniendo visualizaciones:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  }
}

module.exports = AuditController;


