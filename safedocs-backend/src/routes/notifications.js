const express = require('express');
const NotificationController = require('../controllers/NotificationController');
const { authenticateToken, updateLastSeen } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(updateLastSeen);

// Obtener notificaciones del usuario
router.get('/', NotificationController.getNotifications);

// Obtener contador de notificaciones no leídas
router.get('/unread-count', NotificationController.getUnreadCount);

// Marcar notificación como leída
router.patch('/:notificationId/read', NotificationController.markAsRead);

// Marcar todas las notificaciones como leídas
router.patch('/read-all', NotificationController.markAllAsRead);

module.exports = router;

