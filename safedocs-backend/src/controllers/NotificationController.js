const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Controlador de Notificaciones
 * Gestiona la creación, obtención y marcado de notificaciones
 */
class NotificationController {
  // Obtener notificaciones del usuario
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const { limit = 20, skip = 0, unreadOnly = false } = req.query;

      const notifications = await Notification.getUserNotifications(userId, {
        limit: parseInt(limit),
        skip: parseInt(skip),
        unreadOnly: unreadOnly === 'true'
      });

      const unreadCount = await Notification.countUnread(userId);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            limit: parseInt(limit),
            skip: parseInt(skip),
            total: notifications.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener contador de notificaciones no leídas
  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.userId;
      const count = await Notification.countUnread(userId);

      res.json({
        success: true,
        data: {
          unreadCount: count
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Marcar notificación como leída
  static async markAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const { notificationId } = req.params;

      const notification = await Notification.markAsRead(notificationId, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Notificación marcada como leída',
        data: {
          notification
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Marcar todas las notificaciones como leídas
  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await Notification.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'Todas las notificaciones han sido marcadas como leídas',
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear notificación de solicitud de amistad (método estático para usar desde otros controladores)
  static async createFriendRequestNotification(receiverId, senderId) {
    try {
      const sender = await User.findById(senderId).select('name');
      if (!sender) {
        console.error('Usuario remitente no encontrado para notificación');
        return null;
      }

      const notification = await Notification.createFriendRequestNotification(
        receiverId,
        senderId
      );

      // Personalizar el mensaje con el nombre del remitente
      notification.message = `${sender.name} te ha enviado una solicitud de amistad`;
      await notification.save();

      return notification;
    } catch (error) {
      console.error('Error creando notificación de solicitud de amistad:', error);
      return null;
    }
  }

  // Crear notificaciones de documento oficial (método estático para usar desde otros controladores)
  static async createOfficialDocumentNotification(documentId, professorId) {
    try {
      const professor = await User.findById(professorId).select('name');
      if (!professor) {
        console.error('Profesor no encontrado para notificación');
        return [];
      }

      // Obtener todos los usuarios activos excepto el profesor
      const users = await User.find({ 
        isActive: true, 
        _id: { $ne: professorId } 
      }).select('_id');

      if (users.length === 0) {
        return [];
      }

      const notifications = users.map(user => ({
        userId: user._id,
        type: 'official_document',
        title: 'Nuevo documento oficial',
        message: `${professor.name} ha subido un nuevo documento oficial`,
        relatedDocumentId: documentId,
        relatedUserId: professorId
      }));

      const createdNotifications = await Notification.insertMany(notifications);
      return createdNotifications;
    } catch (error) {
      console.error('Error creando notificaciones de documento oficial:', error);
      return [];
    }
  }
}

module.exports = NotificationController;

