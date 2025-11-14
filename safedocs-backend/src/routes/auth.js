const express = require('express');
const AuthController = require('../controllers/ControladorAutenticacion');
const { authenticateToken, authRateLimiter } = require('../middleware/auth');
const { authValidations, handleValidationErrors } = require('../middleware/validations');

const router = express.Router();

// Nota: Upload de perfiles disponible en middleware/upload si se requiere

// Validaciones centralizadas en middleware/validations.js

// Rutas públicas
router.post('/register', authValidations.register, handleValidationErrors, authRateLimiter, AuthController.register);
router.post('/login', authValidations.login, handleValidationErrors, authRateLimiter, AuthController.login);

// Rutas protegidas
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, authValidations.updateProfile, handleValidationErrors, AuthController.updateProfile);
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/verify', authenticateToken, AuthController.verifyToken);

// Ruta para cambiar contraseña
router.put('/change-password', authenticateToken, authValidations.updateProfile, handleValidationErrors, AuthController.changePassword);

// Ruta para solicitar restablecimiento de contraseña
router.post('/forgot-password', authValidations.login.slice(0, 1), handleValidationErrors, AuthController.forgotPassword);

// Ruta para restablecer contraseña
router.post('/reset-password', [
  (require('express-validator').body('token').notEmpty()),
  ...authValidations.updateProfile.filter(v => String(v.builder?.fields?.[0] || v?.fields?.[0]) === 'newPassword')
], handleValidationErrors, AuthController.resetPassword);

// Ruta para eliminar cuenta
router.delete('/account', authenticateToken, authValidations.deleteAccount, handleValidationErrors, AuthController.deleteAccount);

module.exports = router; 