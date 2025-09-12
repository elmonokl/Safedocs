const mongoose = require('mongoose');

// Esquema de Amistad
const friendshipSchema = new mongoose.Schema({
  user1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El primer usuario es obligatorio']
  },
  user2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El segundo usuario es obligatorio']
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
friendshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
friendshipSchema.index({ user1Id: 1 });
friendshipSchema.index({ user2Id: 1 });

// Método estático para crear amistad
friendshipSchema.statics.createFriendship = function(user1Id, user2Id) {
  // Asegurar que user1Id < user2Id para evitar duplicados
  const [smallerId, largerId] = [user1Id, user2Id].sort();
  
  return this.create({
    user1Id: smallerId,
    user2Id: largerId
  });
};

// Método estático para verificar si dos usuarios son amigos
friendshipSchema.statics.areFriends = function(user1Id, user2Id) {
  const [smallerId, largerId] = [user1Id, user2Id].sort();
  
  return this.findOne({
    user1Id: smallerId,
    user2Id: largerId
  });
};

// Método estático para obtener amigos de un usuario
friendshipSchema.statics.getFriends = function(userId) {
  return this.find({
    $or: [
      { user1Id: userId },
      { user2Id: userId }
    ]
  }).populate([
    {
      path: 'user1Id',
      select: 'name email career profilePicture isOnline lastSeen',
      match: { _id: { $ne: userId } }
    },
    {
      path: 'user2Id',
      select: 'name email career profilePicture isOnline lastSeen',
      match: { _id: { $ne: userId } }
    }
  ]);
};

// Método estático para eliminar amistad
friendshipSchema.statics.removeFriendship = function(user1Id, user2Id) {
  const [smallerId, largerId] = [user1Id, user2Id].sort();
  
  return this.findOneAndDelete({
    user1Id: smallerId,
    user2Id: largerId
  });
};

// Método estático para obtener amigos en línea
friendshipSchema.statics.getOnlineFriends = function(userId) {
  return this.find({
    $or: [
      { user1Id: userId },
      { user2Id: userId }
    ]
  }).populate([
    {
      path: 'user1Id',
      select: 'name email career profilePicture isOnline lastSeen',
      match: { _id: { $ne: userId }, isOnline: true }
    },
    {
      path: 'user2Id',
      select: 'name email career profilePicture isOnline lastSeen',
      match: { _id: { $ne: userId }, isOnline: true }
    }
  ]);
};

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = Friendship; 