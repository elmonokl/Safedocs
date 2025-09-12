const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/AuditController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/audit
router.get('/', authenticateToken, AuditController.getMyAuditLogs);

module.exports = router;





