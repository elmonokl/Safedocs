const mongoose = require('mongoose');

// Esquema de Solicitud de Amistad
const friendRequestSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El remitente es obligatorio']
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El destinatario es obligatorio']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'rejected'],
      message: 'Estado debe ser: pending, accepted, rejected'
    },
    default: 'pending'
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
friendRequestSchema.index({ receiverId: 1, status: 1 });
friendRequestSchema.index({ senderId: 1, status: 1 });

// Método estático para crear solicitud
friendRequestSchema.statics.createRequest = function(senderId, receiverId) {
  return this.create({
    senderId,
    receiverId,
    status: 'pending'
  });
};

// Método estático para obtener solicitudes pendientes de un usuario
friendRequestSchema.statics.findPendingForUser = function(userId) {
  return this.find({
    receiverId: userId,
    status: 'pending'
  }).populate('senderId', 'name email career profilePicture');
};

// Método estático para obtener solicitudes enviadas por un usuario
friendRequestSchema.statics.findSentByUser = function(userId) {
  return this.find({
    senderId: userId,
    status: 'pending'
  }).populate('receiverId', 'name email career profilePicture');
};

// Método estático para verificar si existe una solicitud entre dos usuarios
friendRequestSchema.statics.existsBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 }
    ]
  });
};

// Método estático para aceptar solicitud
friendRequestSchema.statics.acceptRequest = function(requestId, receiverId) {
  return this.findOneAndUpdate(
    { _id: requestId, receiverId, status: 'pending' },
    { status: 'accepted' },
    { new: true }
  );
};

// Método estático para rechazar solicitud
friendRequestSchema.statics.rejectRequest = function(requestId, receiverId) {
  return this.findOneAndUpdate(
    { _id: requestId, receiverId, status: 'pending' },
    { status: 'rejected' },
    { new: true }
  );
};

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

module.exports = FriendRequest; 