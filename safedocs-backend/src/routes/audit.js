const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/AuditController');
const { authenticateToken } = require('../middleware/auth');

// Rutas de auditoría
router.get('/', authenticateToken, AuditController.getMyAuditLogs);
router.get('/all', AuditController.getAllAuditLogs);
router.get('/stats', AuditController.getAuditStats);

module.exports = router;


