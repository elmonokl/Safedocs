const express = require('express');
const FriendsController = require('../controllers/FriendsController');
const { authenticateToken, updateLastSeen } = require('../middleware/auth');
const { friendsValidations, handleValidationErrors } = require('../middleware/validations');

const router = express.Router();

// Validaciones centralizadas en middleware/validations.js

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);
router.use(updateLastSeen);

// Obtener lista de amigos
router.get('/',
  FriendsController.getFriends
);

// Buscar usuarios para agregar como amigos
router.get('/search',
  friendsValidations.searchUsers,
  handleValidationErrors,
  FriendsController.searchUsers
);

// Enviar solicitud de amistad
router.post('/request', friendsValidations.sendFriendRequest, handleValidationErrors, FriendsController.sendFriendRequest);

// Obtener solicitudes de amistad pendientes
router.get('/requests/pending',
  FriendsController.getPendingRequests
);

// Aceptar solicitud de amistad
router.post('/requests/accept', friendsValidations.acceptFriendRequest, handleValidationErrors, FriendsController.acceptFriendRequest);

// Rechazar solicitud de amistad
router.post('/requests/reject', friendsValidations.rejectFriendRequest, handleValidationErrors, FriendsController.rejectFriendRequest);

// Eliminar amigo
router.delete('/remove', friendsValidations.removeFriend, handleValidationErrors, FriendsController.removeFriend);

// Obtener amigos en línea
router.get('/online',
  FriendsController.getOnlineFriends
);

// Obtener sugerencias de amigos
router.get('/suggestions',
  friendsValidations.getFriendSuggestions,
  handleValidationErrors,
  FriendsController.getFriendSuggestions
);

module.exports = router; 