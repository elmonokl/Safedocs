const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Friendship = require('../models/Friendship');
const NotificationController = require('./NotificationController');
// Validaciones ya son manejadas en rutas con handleValidationErrors

/**
 * Controlador de Amigos
 * Búsqueda de usuarios, solicitudes, aceptación/rechazo y listado de amigos.
 * Validaciones en rutas y manejo de errores unificado.
 */
class FriendsController {
  // Obtener lista de amigos
  static async getFriends(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Obtener todas las amistades donde el usuario está involucrado usando el método del modelo
      const friendships = await Friendship.getFriends(userId);

      // Extraer información de amigos
      const friends = friendships
        .map(friendship => {
          try {
            // Convertir friendship a objeto plano si es necesario
            const friendshipObj = friendship.toObject ? friendship.toObject() : friendship;
            
            // Obtener los usuarios de la amistad
            const user1Id = friendshipObj.user1Id;
            const user2Id = friendshipObj.user2Id;
            
            // Convertir userId a string para comparar
            const userIdStr = String(userId);
            
            // Determinar cuál es el amigo (el que NO es el usuario actual)
            let friendDoc = null;
            let user1IdStr = null;
            let user2IdStr = null;
            
            // Obtener los IDs como strings
            if (user1Id) {
              user1IdStr = user1Id._id ? String(user1Id._id) : String(user1Id);
            }
            if (user2Id) {
              user2IdStr = user2Id._id ? String(user2Id._id) : String(user2Id);
            }
            
            // Determinar cuál usuario es el amigo
            if (user1IdStr === userIdStr) {
              // El usuario es user1Id, el amigo es user2Id
              friendDoc = user2Id;
            } else if (user2IdStr === userIdStr) {
              // El usuario es user2Id, el amigo es user1Id
              friendDoc = user1Id;
            } else {
              // Si ninguno coincide (no debería pasar), retornar null
              console.warn(`Amistad sin coincidencia: userId=${userIdStr}, user1Id=${user1IdStr}, user2Id=${user2IdStr}`);
              return null;
            }

            // Si no se encontró el amigo, retornar null
            if (!friendDoc) {
              console.warn('Amistad sin amigo válido');
              return null;
            }

            // Si friendDoc es solo un ObjectId (no está populado), retornar null
            // Esto indica que el populate no funcionó correctamente
            if (typeof friendDoc === 'string' || !friendDoc.name) {
              console.warn('Amigo no populado correctamente:', friendDoc);
              return null;
            }

            // Extraer el ID del amigo
            const friendId = friendDoc._id || friendDoc;
            const friendIdStr = String(friendId);

            // Verificar que no sea el mismo usuario (doble verificación)
            if (friendIdStr === userIdStr) {
              console.warn('El amigo es el mismo usuario');
              return null;
            }

            // Construir objeto del amigo con todos los datos necesarios
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
        .filter(Boolean); // Filtrar valores null

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

  // Buscar usuarios
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
  static async sendFriendRequest(req, res, next) {
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

      // Crear notificación para el receptor (sin esperar, en segundo plano)
      NotificationController.createFriendRequestNotification(receiverId, senderId)
        .catch(error => {
          console.error('Error creando notificación de solicitud de amistad:', error);
          // No fallar la respuesta si la notificación falla
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

  // Obtener solicitudes pendientes
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

  // Aceptar solicitud de amistad
  static async acceptFriendRequest(req, res, next) {
    try {

      const receiverId = req.user.userId;
      const { requestId } = req.body;

      // Verificar que la solicitud existe y obtener información antes de aceptarla
      const request = await FriendRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada'
        });
      }

      // Verificar que el usuario autenticado es el receptor de la solicitud
      // Manejar tanto ObjectIds como referencias pobladas
      let requestReceiverIdValue = request.receiverId;
      // Si receiverId está poblado (es un objeto), obtener su _id
      if (requestReceiverIdValue && typeof requestReceiverIdValue === 'object' && requestReceiverIdValue._id) {
        requestReceiverIdValue = requestReceiverIdValue._id;
      }
      
      // Comparar ObjectIds de manera segura
      // Si ambos son ObjectIds de Mongoose, usar equals(), si no, convertir a string
      let isReceiver = false;
      if (requestReceiverIdValue && receiverId) {
        // Intentar usar equals() si ambos son ObjectIds
        if (typeof requestReceiverIdValue.equals === 'function') {
          isReceiver = requestReceiverIdValue.equals(receiverId);
        } else if (typeof receiverId.equals === 'function') {
          isReceiver = receiverId.equals(requestReceiverIdValue);
        } else {
          // Si no tienen equals(), convertir ambos a string
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

      // Aceptar solicitud (el método acceptRequest verifica receiverId en la consulta)
      // Si receiverId no coincide, updatedRequest será null
      const updatedRequest = await FriendRequest.acceptRequest(requestId, receiverId);
      
      if (!updatedRequest) {
        return res.status(403).json({
          success: false,
          message: 'No se pudo aceptar la solicitud. Verifica que eres el receptor de la solicitud.'
        });
      }

      // Crear amistad mutua usando los ObjectIds del request original
      // Asegurar que senderId y receiverId sean ObjectIds, no referencias pobladas
      let senderIdValue = request.senderId;
      let receiverIdValue = request.receiverId;
      
      // Si están poblados (son objetos), obtener sus _id
      if (senderIdValue && typeof senderIdValue === 'object' && senderIdValue._id) {
        senderIdValue = senderIdValue._id;
      }
      if (receiverIdValue && typeof receiverIdValue === 'object' && receiverIdValue._id) {
        receiverIdValue = receiverIdValue._id;
      }
      
      // Crear amistad mutua: ambos usuarios se agregarán como amigos
      // El método createFriendship crea un único registro que representa
      // la amistad bidireccional entre ambos usuarios
      const friendship = await Friendship.createFriendship(senderIdValue, receiverIdValue);
      
      // Verificar que la amistad se creó correctamente
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

  // Rechazar solicitud de amistad
  static async rejectFriendRequest(req, res, next) {
    try {

      const receiverId = req.user.userId;
      const { requestId } = req.body;

      // Verificar que la solicitud existe antes de rechazarla
      const request = await FriendRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada'
        });
      }

      // Verificar que el usuario autenticado es el receptor de la solicitud
      // Manejar tanto ObjectIds como referencias pobladas
      let requestReceiverIdValue = request.receiverId;
      // Si receiverId está poblado (es un objeto), obtener su _id
      if (requestReceiverIdValue && typeof requestReceiverIdValue === 'object' && requestReceiverIdValue._id) {
        requestReceiverIdValue = requestReceiverIdValue._id;
      }
      
      // Comparar ObjectIds de manera segura
      // Si ambos son ObjectIds de Mongoose, usar equals(), si no, convertir a string
      let isReceiver = false;
      if (requestReceiverIdValue && receiverId) {
        // Intentar usar equals() si ambos son ObjectIds
        if (typeof requestReceiverIdValue.equals === 'function') {
          isReceiver = requestReceiverIdValue.equals(receiverId);
        } else if (typeof receiverId.equals === 'function') {
          isReceiver = receiverId.equals(requestReceiverIdValue);
        } else {
          // Si no tienen equals(), convertir ambos a string
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

      // Rechazar solicitud (el método rejectRequest verifica receiverId en la consulta)
      // Si receiverId no coincide, updatedRequest será null
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

      // Obtener información de amistad para cada usuario sugerido
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

  // Obtener amigos en línea
  static async getOnlineFriends(req, res, next) {
    try {
      const userId = req.user.userId;
      const friendships = await Friendship.getOnlineFriends(userId);

      // Extraer información de amigos en línea
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
      }).filter(Boolean); // Filtrar valores null

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