const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Friendship = require('../models/Friendship');
const NotificationController = require('./NotificationController');

class FriendsController {
  static async getFriends(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const friendships = await Friendship.getFriends(userId);

      const friends = friendships
        .map(friendship => {
          try {
            const friendshipObj = friendship.toObject ? friendship.toObject() : friendship;
            
            const user1Id = friendshipObj.user1Id;
            const user2Id = friendshipObj.user2Id;
            
            const userIdStr = String(userId);
            
            let friendDoc = null;
            let user1IdStr = null;
            let user2IdStr = null;
            
            if (user1Id) {
              user1IdStr = user1Id._id ? String(user1Id._id) : String(user1Id);
            }
            if (user2Id) {
              user2IdStr = user2Id._id ? String(user2Id._id) : String(user2Id);
            }
            
            if (user1IdStr === userIdStr) {
              friendDoc = user2Id;
            } else if (user2IdStr === userIdStr) {
              friendDoc = user1Id;
            } else {
              console.warn(`Amistad sin coincidencia: userId=${userIdStr}, user1Id=${user1IdStr}, user2Id=${user2IdStr}`);
              return null;
            }

            if (!friendDoc) {
              console.warn('Amistad sin amigo válido');
              return null;
            }

            if (typeof friendDoc === 'string' || !friendDoc.name) {
              console.warn('Amigo no populado correctamente:', friendDoc);
              return null;
            }

            const friendId = friendDoc._id || friendDoc;
            const friendIdStr = String(friendId);

            if (friendIdStr === userIdStr) {
              console.warn('El amigo es el mismo usuario');
              return null;
            }

            const friend = {
              _id: friendId,
              name: friendDoc.name || 'Usuario',
              email: friendDoc.email || '',
              career: friendDoc.career || '',
              profilePicture: friendDoc.profilePicture || '',
              isOnline: friendDoc.isOnline || false,
              lastSeen: friendDoc.lastSeen || null,
              role: friendDoc.role || 'student',
              status: 'friend'
            };

            return friend;
          } catch (mapError) {
            console.error('Error procesando amistad:', mapError);
            return null;
          }
        })
        .filter(Boolean);

      console.log(`Usuario ${userId} tiene ${friends.length} amigos de ${friendships.length} amistades`);

      res.json({
        success: true,
        data: {
          friends
        }
      });

    } catch (error) {
      console.error('Error obteniendo amigos:', error);
      next(error);
    }
  }

  static async searchUsers(req, res, next) {
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

  static async sendFriendRequest(req, res, next) {
    try {

      const senderId = req.user.userId;
      const { receiverId } = req.body;

      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (senderId === receiverId) {
        return res.status(400).json({
          success: false,
          message: 'No puedes enviar solicitud de amistad a ti mismo'
        });
      }

      const existingFriendship = await Friendship.areFriends(senderId, receiverId);
      if (existingFriendship) {
        return res.status(400).json({
          success: false,
          message: 'Ya son amigos'
        });
      }

      const existingRequest = await FriendRequest.existsBetweenUsers(senderId, receiverId);
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una solicitud de amistad entre estos usuarios'
        });
      }

      const friendRequest = await FriendRequest.createRequest(senderId, receiverId);

      NotificationController.createFriendRequestNotification(receiverId, senderId)
        .catch(error => {
          console.error('Error creando notificación de solicitud de amistad:', error);
        });

      res.status(201).json({
        success: true,
        message: 'Solicitud de amistad enviada exitosamente',
        data: {
          request: friendRequest
        }
      });

    } catch (error) {
      if (error?.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una solicitud de amistad entre estos usuarios'
        });
      }

      next(error);
    }
  }

  static async getPendingRequests(req, res, next) {
    try {
      const userId = req.user.userId;
      const pendingRequests = await FriendRequest.findPendingForUser(userId);
      const requests = pendingRequests.map(request => ({
        _id: request._id,
        status: request.status,
        createdAt: request.createdAt,
        sender: request.senderId ? {
          _id: request.senderId._id,
          name: request.senderId.name,
          email: request.senderId.email,
          career: request.senderId.career,
          profilePicture: request.senderId.profilePicture
        } : null
      }));

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

  static async acceptFriendRequest(req, res, next) {
    try {

      const receiverId = req.user.userId;
      const { requestId } = req.body;

      const request = await FriendRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada'
        });
      }

      let requestReceiverIdValue = request.receiverId;
      if (requestReceiverIdValue && typeof requestReceiverIdValue === 'object' && requestReceiverIdValue._id) {
        requestReceiverIdValue = requestReceiverIdValue._id;
      }
      
      let isReceiver = false;
      if (requestReceiverIdValue && receiverId) {
        if (typeof requestReceiverIdValue.equals === 'function') {
          isReceiver = requestReceiverIdValue.equals(receiverId);
        } else if (typeof receiverId.equals === 'function') {
          isReceiver = receiverId.equals(requestReceiverIdValue);
        } else {
          isReceiver = String(requestReceiverIdValue) === String(receiverId);
        }
      }
      
      if (!isReceiver) {
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

      const updatedRequest = await FriendRequest.acceptRequest(requestId, receiverId);
      
      if (!updatedRequest) {
        return res.status(403).json({
          success: false,
          message: 'No se pudo aceptar la solicitud. Verifica que eres el receptor de la solicitud.'
        });
      }

      let senderIdValue = request.senderId;
      let receiverIdValue = request.receiverId;
      
      if (senderIdValue && typeof senderIdValue === 'object' && senderIdValue._id) {
        senderIdValue = senderIdValue._id;
      }
      if (receiverIdValue && typeof receiverIdValue === 'object' && receiverIdValue._id) {
        receiverIdValue = receiverIdValue._id;
      }
      
      const friendship = await Friendship.createFriendship(senderIdValue, receiverIdValue);
      
      if (!friendship) {
        return res.status(500).json({
          success: false,
          message: 'Error al crear la amistad'
        });
      }

      res.json({
        success: true,
        message: 'Solicitud de amistad aceptada exitosamente. Ambos usuarios ahora son amigos mutuamente.',
        data: {
          request: updatedRequest,
          friendship: {
            id: friendship._id,
            user1Id: friendship.user1Id,
            user2Id: friendship.user2Id,
            createdAt: friendship.createdAt
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async rejectFriendRequest(req, res, next) {
    try {

      const receiverId = req.user.userId;
      const { requestId } = req.body;

      const request = await FriendRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada'
        });
      }

      let requestReceiverIdValue = request.receiverId;
      if (requestReceiverIdValue && typeof requestReceiverIdValue === 'object' && requestReceiverIdValue._id) {
        requestReceiverIdValue = requestReceiverIdValue._id;
      }
      
      let isReceiver = false;
      if (requestReceiverIdValue && receiverId) {
        if (typeof requestReceiverIdValue.equals === 'function') {
          isReceiver = requestReceiverIdValue.equals(receiverId);
        } else if (typeof receiverId.equals === 'function') {
          isReceiver = receiverId.equals(requestReceiverIdValue);
        } else {
          isReceiver = String(requestReceiverIdValue) === String(receiverId);
        }
      }
      
      if (!isReceiver) {
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

      const updatedRequest = await FriendRequest.rejectRequest(requestId, receiverId);
      
      if (!updatedRequest) {
        return res.status(403).json({
          success: false,
          message: 'No se pudo rechazar la solicitud. Verifica que eres el receptor de la solicitud.'
        });
      }

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

  static async removeFriend(req, res, next) {
    try {
      const userId = req.user.userId;
      const { friendId } = req.body;

      const friend = await User.findById(friendId);
      if (!friend) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const friendship = await Friendship.areFriends(userId, friendId);
      if (!friendship) {
        return res.status(400).json({
          success: false,
          message: 'No son amigos'
        });
      }

      await Friendship.removeFriendship(userId, friendId);

      res.json({
        success: true,
        message: 'Amigo eliminado exitosamente'
      });

    } catch (error) {
      next(error);
    }
  }

  static async getFriendSuggestions(req, res, next) {
    try {
      const userId = req.user.userId;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

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

      const usersWithFriendshipStatus = await Promise.all(
        suggestions.map(async (user) => {
          const friendshipStatus = await FriendsController.getFriendshipStatus(userId, user._id);
          return {
            ...user.toObject(),
            friendshipStatus
          };
        })
      );

      res.json({
        success: true,
        data: { users: usersWithFriendshipStatus }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOnlineFriends(req, res, next) {
    try {
      const userId = req.user.userId;
      const friendships = await Friendship.getOnlineFriends(userId);

      const onlineFriends = friendships.map(friendship => {
        const friendDoc = friendship.user1Id?._id?.toString() === userId
          ? friendship.user2Id
          : friendship.user1Id;

        if (!friendDoc) {
          return null;
        }

        return {
          ...friendDoc.toObject({
            versionKey: false,
            transform: (_, ret) => {
              delete ret.password;
              return ret;
            }
          }),
          status: 'friend'
        };
      }).filter(Boolean);

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

  static async getFriendshipStatus(userId1, userId2) {
    const friendship = await Friendship.areFriends(userId1, userId2);
    if (friendship) {
      return 'friend';
    }

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