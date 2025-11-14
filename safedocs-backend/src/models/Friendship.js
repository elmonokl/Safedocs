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
friendshipSchema.statics.createFriendship = async function(user1Id, user2Id) {
  // Convertir a strings para comparar y ordenar correctamente
  const id1Str = user1Id.toString();
  const id2Str = user2Id.toString();
  
  // Asegurar que user1Id < user2Id para evitar duplicados (orden lexicográfico)
  // Esto garantiza que ambos usuarios se agreguen mutuamente con un solo registro
  let smallerId, largerId;
  if (id1Str < id2Str) {
    smallerId = user1Id;
    largerId = user2Id;
  } else {
    smallerId = user2Id;
    largerId = user1Id;
  }
  
  // Verificar si la amistad ya existe antes de crearla
  const existingFriendship = await this.findOne({
    user1Id: smallerId,
    user2Id: largerId
  });
  
  if (existingFriendship) {
    // Si ya existe, retornar la amistad existente (idempotencia)
    return existingFriendship;
  }
  
  // Crear la amistad mutua
  // Este único registro representa la amistad entre ambos usuarios
  // Ambos usuarios pueden ver esta amistad mediante getFriends() que busca en user1Id y user2Id
  return this.create({
    user1Id: smallerId,
    user2Id: largerId
  });
};

// Método estático para verificar si dos usuarios son amigos
friendshipSchema.statics.areFriends = function(user1Id, user2Id) {
  // Convertir a strings para comparar y ordenar correctamente
  const id1Str = user1Id.toString();
  const id2Str = user2Id.toString();
  
  // Ordenar de la misma manera que en createFriendship
  let smallerId, largerId;
  if (id1Str < id2Str) {
    smallerId = user1Id;
    largerId = user2Id;
  } else {
    smallerId = user2Id;
    largerId = user1Id;
  }
  
  // Buscar la amistad mutua (busca en ambas direcciones usando el orden consistente)
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
  }).populate('user1Id', 'name email career profilePicture isOnline lastSeen role')
    .populate('user2Id', 'name email career profilePicture isOnline lastSeen role');
};

// Método estático para eliminar amistad
friendshipSchema.statics.removeFriendship = function(user1Id, user2Id) {
  // Convertir a strings para comparar y ordenar correctamente
  const id1Str = user1Id.toString();
  const id2Str = user2Id.toString();
  
  // Ordenar de la misma manera que en createFriendship
  let smallerId, largerId;
  if (id1Str < id2Str) {
    smallerId = user1Id;
    largerId = user2Id;
  } else {
    smallerId = user2Id;
    largerId = user1Id;
  }
  
  // Eliminar la amistad mutua (elimina para ambos usuarios)
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