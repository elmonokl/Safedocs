const express = require('express');
const { DocumentController, upload } = require('../controllers/DocumentController');
const { authenticateToken, updateLastSeen } = require('../middleware/auth');
const { documentValidations, handleValidationErrors } = require('../middleware/validations');

const router = express.Router();

// Validaciones centralizadas en middleware/validations.js

// Rutas públicas (sin autenticación) para documentos compartidos
router.get('/shared/:token', DocumentController.getDocumentByToken);
router.get('/shared/:token/download', DocumentController.downloadByToken);

// Aplicar middleware de autenticación al resto de las rutas
router.use(authenticateToken);
router.use(updateLastSeen);

// Rutas de documentos
router.post('/upload', upload.single('file'), documentValidations.upload, handleValidationErrors, DocumentController.uploadDocument);
router.get('/', DocumentController.getAllDocuments);
router.get('/my-documents', DocumentController.getMyDocuments);
router.get('/popular', DocumentController.getPopularDocuments);
router.get('/stats', DocumentController.getStats);

// Rutas de documento específico
router.get('/:id', documentValidations.getById, handleValidationErrors, DocumentController.getDocumentById);
router.get('/:id/download', documentValidations.download, handleValidationErrors, DocumentController.downloadDocument);
router.put('/:id', documentValidations.update, handleValidationErrors, DocumentController.updateDocument);
router.delete('/:id', documentValidations.delete, handleValidationErrors, DocumentController.deleteDocument);

// Rutas de compartir documentos
router.post('/:id/share', DocumentController.generateShareLink);
router.post('/:id/share-friends', DocumentController.shareWithFriends);

module.exports = router; 