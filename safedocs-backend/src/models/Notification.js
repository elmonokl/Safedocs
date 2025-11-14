const mongoose = require('mongoose');

// Esquema de Notificación
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio'],
    index: true
  },
  type: {
    type: String,
    enum: ['friend_request', 'official_document'],
    required: [true, 'El tipo de notificación es obligatorio']
  },
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'El mensaje es obligatorio'],
    trim: true
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  relatedDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    sparse: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar consultas
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

// Virtual para obtener información del usuario relacionado
notificationSchema.virtual('relatedUser', {
  ref: 'User',
  localField: 'relatedUserId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name profilePicture role' }
});

// Virtual para obtener información del documento relacionado
notificationSchema.virtual('relatedDocument', {
  ref: 'Document',
  localField: 'relatedDocumentId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'title fileName author' }
});

// Método estático para crear notificación de solicitud de amistad
notificationSchema.statics.createFriendRequestNotification = function(receiverId, senderId) {
  return this.create({
    userId: receiverId,
    type: 'friend_request',
    title: 'Nueva solicitud de amistad',
    message: 'Tienes una nueva solicitud de amistad pendiente',
    relatedUserId: senderId
  });
};

// Método estático para crear notificación de documento oficial
// Se define después para evitar dependencia circular

// Método estático para obtener notificaciones de un usuario
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { limit = 20, skip = 0, unreadOnly = false } = options;
  
  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }
  
  return this.find(query)
    .populate('relatedUser', 'name profilePicture role')
    .populate('relatedDocument', 'title fileName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Método estático para contar notificaciones no leídas
notificationSchema.statics.countUnread = function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Método estático para marcar como leída
notificationSchema.statics.markAsRead = function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

// Método estático para marcar todas como leídas
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

