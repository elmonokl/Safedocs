const express = require('express');
const { DocumentController, upload } = require('../controllers/DocumentController');
const { authenticateToken, optionalAuthenticateToken, updateLastSeen } = require('../middleware/auth');
const { documentValidations, friendsValidations, handleValidationErrors } = require('../middleware/validations');

const router = express.Router();

// Validaciones centralizadas en middleware/validations.js

// Rutas públicas (con autenticación opcional) para documentos compartidos
// Permiten acceso sin autenticación, pero registran visualizaciones si hay usuario autenticado
router.get('/shared/:token', optionalAuthenticateToken, DocumentController.getDocumentByToken);
router.get('/shared/:token/download', optionalAuthenticateToken, DocumentController.downloadByToken);

// Rutas públicas (con autenticación opcional) para documentos oficiales
// Permiten acceso sin autenticación, pero registran visualizaciones si hay usuario autenticado
router.get('/official', optionalAuthenticateToken, DocumentController.getOfficialDocuments);
router.get('/official/:id', optionalAuthenticateToken, DocumentController.getOfficialDocumentById);
router.get('/official/:id/download', optionalAuthenticateToken, DocumentController.downloadOfficialDocument);

// Aplicar middleware de autenticación al resto de las rutas
router.use(authenticateToken);
router.use(updateLastSeen);

// Rutas de documentos (específicas primero para evitar conflictos con /:id)
router.post('/upload', upload.single('file'), documentValidations.upload, handleValidationErrors, DocumentController.uploadDocument);
router.post('/official/upload', upload.single('file'), documentValidations.upload, handleValidationErrors, DocumentController.uploadOfficialDocument);
router.get('/', DocumentController.getAllDocuments);
router.get('/my-documents', DocumentController.getMyDocuments);
router.get('/shared-with-me', DocumentController.getSharedDocuments);
router.get('/popular', DocumentController.getPopularDocuments);
router.get('/stats', DocumentController.getStats);

// Rutas de documentos compartidos (antes de /:id para evitar conflictos)
router.patch('/shared/:id/read', DocumentController.markSharedDocumentAsRead);

// Rutas de compartir documentos (antes de /:id para evitar conflictos)
router.post('/:id/share', DocumentController.generateShareLink);
// Remover validación del middleware para shareWithFriends - se valida manualmente en el controlador
router.post('/:id/share-friends', DocumentController.shareWithFriends);

// Rutas de documento específico (al final para evitar conflictos con rutas específicas)
router.get('/:id', documentValidations.getById, handleValidationErrors, DocumentController.getDocumentById);
router.get('/:id/download', documentValidations.download, handleValidationErrors, DocumentController.downloadDocument);
router.put('/:id', documentValidations.update, handleValidationErrors, DocumentController.updateDocument);
router.delete('/:id', documentValidations.delete, handleValidationErrors, DocumentController.deleteDocument);

module.exports = router; 