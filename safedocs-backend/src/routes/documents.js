const express = require('express');
const { DocumentController, upload } = require('../controllers/DocumentController');
const { authenticateToken, updateLastSeen } = require('../middleware/auth');
const { documentValidations, handleValidationErrors } = require('../middleware/validations');

const router = express.Router();

// Validaciones centralizadas en middleware/validations.js

// Aplicar middleware de autenticación a todas las rutas
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

module.exports = router; 