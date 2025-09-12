const AuditLog = require('../models/AuditLog');

class AuditController {
  // Lista eventos de auditoría del usuario autenticado
  static async getMyAuditLogs(req, res) {
    try {
      const { userId } = req.user;
      const { limit = 50, page = 1, type } = req.query;

      const numericLimit = Math.min(parseInt(limit, 10) || 50, 100);
      const numericPage = Math.max(parseInt(page, 10) || 1, 1);
      const filter = { userId };
      if (type) filter.type = type;

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
          tipo: evt.type,
          actor: evt.actorId?.name || 'Usuario',
          actorEmail: evt.actorId?.email,
          documento: evt.documentId?.title || 'Documento',
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





