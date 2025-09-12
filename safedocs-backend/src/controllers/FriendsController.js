const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Friendship = require('../models/Friendship');
// Validaciones ya son manejadas en rutas con handleValidationErrors

/**
 * Controlador de Amigos
 * Búsqueda de usuarios, solicitudes, aceptación/rechazo y listado de amigos.
 * Validaciones en rutas y manejo de errores unificado.
 */
class FriendsController {
  // Obtener lista de amigos
  static async getFriends(req, res) {
    try {
      const userId = req.user.userId;
      const friendships = await Friendship.getFriends(userId);

      // Extraer información de amigos
      const friends = friendships.map(friendship => {
        const friend = friendship.user1Id?._id.toString() === userId 
          ? friendship.user2Id 
          : friendship.user1Id;
        return friend;
      }).filter(friend => friend); // Filtrar valores null

      res.json({
        success: true,
        data: {
          friends
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Buscar usuarios
  static async searchUsers(req, res) {
    try {
      const userId = req.user.userId;
      const { q: searchTerm, limit = 20 } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }

      const users = await User.findUsers(userId, searchTerm.trim())
        .limit(parseInt(limit));

      // Obtener información de amistad para cada usuario
      const usersWithFriendshipStatus = await Promise.all(
        users.map(async (user) => {
          const friendshipStatus = await FriendsController.getFriendshipStatus(userId, user._id);
          return {
            ...user.toObject(),
            friendshipStatus
          };
        })
      );

      res.json({
        success: true,
        data: {
          users: usersWithFriendshipStatus
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Enviar solicitud de amistad
  static async sendFriendRequest(req, res) {
    try {

      const senderId = req.user.userId;
      const { receiverId } = req.body;

      // Verificar que el usuario receptor existe
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar que no se envíe solicitud a sí mismo
      if (senderId === receiverId) {
        return res.status(400).json({
          success: false,
          message: 'No puedes enviar solicitud de amistad a ti mismo'
        });
      }

      // Verificar si ya son amigos
      const existingFriendship = await Friendship.areFriends(senderId, receiverId);
      if (existingFriendship) {
        return res.status(400).json({
          success: false,
          message: 'Ya son amigos'
        });
      }

      // Verificar si ya existe una solicitud
      const existingRequest = await FriendRequest.existsBetweenUsers(senderId, receiverId);
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una solicitud de amistad entre estos usuarios'
        });
      }

      // Crear solicitud de amistad
      const friendRequest = await FriendRequest.createRequest(senderId, receiverId);

      res.status(201).json({
        success: true,
        message: 'Solicitud de amistad enviada exitosamente',
        data: {
          request: friendRequest
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener solicitudes pendientes
  static async getPendingRequests(req, res) {
    try {
      const userId = req.user.userId;
      const requests = await FriendRequest.findPendingForUser(userId);

      res.json({
        success: true,
        data: {
          requests
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Aceptar solicitud de amistad
  static async acceptFriendRequest(req, res) {
    try {

      const receiverId = req.user.userId;
      const { requestId } = req.body;

      // Verificar que la solicitud existe y pertenece al usuario
      const request = await FriendRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada'
        });
      }

      if (request.receiverId.toString() !== receiverId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para aceptar esta solicitud'
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'La solicitud ya no está pendiente'
        });
      }

      // Aceptar solicitud
      const updatedRequest = await FriendRequest.acceptRequest(requestId, receiverId);

      // Crear amistad
      await Friendship.createFriendship(request.senderId, request.receiverId);

      res.json({
        success: true,
        message: 'Solicitud de amistad aceptada exitosamente',
        data: {
          request: updatedRequest
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Rechazar solicitud de amistad
  static async rejectFriendRequest(req, res) {
    try {

      const receiverId = req.user.userId;
      const { requestId } = req.body;

      // Verificar que la solicitud existe y pertenece al usuario
      const request = await FriendRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada'
        });
      }

      if (request.receiverId.toString() !== receiverId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para rechazar esta solicitud'
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'La solicitud ya no está pendiente'
        });
      }

      // Rechazar solicitud
      const updatedRequest = await FriendRequest.rejectRequest(requestId, receiverId);

      res.json({
        success: true,
        message: 'Solicitud de amistad rechazada exitosamente',
        data: {
          request: updatedRequest
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Eliminar amigo
  static async removeFriend(req, res, next) {
    try {
      const userId = req.user.userId;
      const { friendId } = req.body;

      // Verificar que el amigo existe
      const friend = await User.findById(friendId);
      if (!friend) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar que son amigos
      const friendship = await Friendship.areFriends(userId, friendId);
      if (!friendship) {
        return res.status(400).json({
          success: false,
          message: 'No son amigos'
        });
      }

      // Eliminar amistad
      await Friendship.removeFriendship(userId, friendId);

      res.json({
        success: true,
        message: 'Amigo eliminado exitosamente'
      });

    } catch (error) {
      next(error);
    }
  }

  // Sugerencias de amigos (usuarios activos no amigos aún)
  static async getFriendSuggestions(req, res, next) {
    try {
      const userId = req.user.userId;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

      // Buscar usuarios activos, excluyendo el propio usuario y los que ya son amigos o tienen solicitudes pendientes
      const [friends, pendingRequests] = await Promise.all([
        Friendship.getFriends(userId),
        FriendRequest.find({ $or: [{ senderId: userId }, { receiverId: userId }], status: 'pending' })
      ]);

      const excludedIds = new Set([
        userId,
        ...friends.map(f => (f.user1Id?._id?.toString() === userId ? f.user2Id?._id?.toString() : f.user1Id?._id?.toString())).filter(Boolean),
        ...pendingRequests.map(r => r.senderId?.toString()).filter(Boolean),
        ...pendingRequests.map(r => r.receiverId?.toString()).filter(Boolean)
      ]);

      const suggestions = await User.find({
        _id: { $nin: Array.from(excludedIds) },
        isActive: true
      })
        .select('name email career profilePicture')
        .limit(limit)
        .sort({ lastSeen: -1 });

      res.json({
        success: true,
        data: { users: suggestions }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener amigos en línea
  static async getOnlineFriends(req, res) {
    try {
      const userId = req.user.userId;
      const friendships = await Friendship.getOnlineFriends(userId);

      // Extraer información de amigos en línea
      const onlineFriends = friendships.map(friendship => {
        const friend = friendship.user1Id?._id.toString() === userId 
          ? friendship.user2Id 
          : friendship.user1Id;
        return friend;
      }).filter(friend => friend); // Filtrar valores null

      res.json({
        success: true,
        data: {
          friends: onlineFriends
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Método auxiliar para obtener el estado de amistad entre dos usuarios
  static async getFriendshipStatus(userId1, userId2) {
    // Verificar si son amigos
    const friendship = await Friendship.areFriends(userId1, userId2);
    if (friendship) {
      return 'friend';
    }

    // Verificar si hay solicitud pendiente
    const request = await FriendRequest.existsBetweenUsers(userId1, userId2);
    if (request) {
      if (request.senderId.toString() === userId1) {
        return 'sent';
      } else {
        return 'received';
      }
    }

    return 'none';
  }
}

module.exports = FriendsController; 