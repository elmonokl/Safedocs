const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

/**
 * Middleware de Autenticación
 * Gestiona autenticación JWT, control de acceso y rate limiting
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe y está activo
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario inactivo'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
  }
  next();
};

// Rate limiter para autenticación
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: (req, res) => {
    // Obtener el tiempo de reset del header si está disponible
    const resetHeader = res.get('X-RateLimit-Reset');
    let resetTime;
    let secondsRemaining;
    
    if (resetHeader) {
      // Si el header es un timestamp en segundos
      resetTime = parseInt(resetHeader);
      secondsRemaining = resetTime - Math.floor(Date.now() / 1000);
    } else {
      // Fallback: calcular basado en la ventana de tiempo
      secondsRemaining = 15 * 60; // 15 minutos en segundos
      resetTime = Math.floor(Date.now() / 1000) + secondsRemaining;
    }
    
    const minutesRemaining = Math.max(1, Math.ceil(secondsRemaining / 60));
    
    return {
      success: false,
      message: `Demasiados intentos de autenticación. Intenta de nuevo en ${minutesRemaining} ${minutesRemaining === 1 ? 'minuto' : 'minutos'}`,
      retryAfter: secondsRemaining,
      resetTime: resetTime
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter general
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests
  message: (req, res) => {
    // Obtener el tiempo de reset del header si está disponible
    const resetHeader = res.get('X-RateLimit-Reset');
    let resetTime;
    let secondsRemaining;
    
    if (resetHeader) {
      // Si el header es un timestamp en segundos
      resetTime = parseInt(resetHeader);
      secondsRemaining = resetTime - Math.floor(Date.now() / 1000);
    } else {
      // Fallback: calcular basado en la ventana de tiempo
      secondsRemaining = 15 * 60; // 15 minutos en segundos
      resetTime = Math.floor(Date.now() / 1000) + secondsRemaining;
    }
    
    const minutesRemaining = Math.max(1, Math.ceil(secondsRemaining / 60));
    
    return {
      success: false,
      message: `Demasiadas solicitudes. Intenta de nuevo en ${minutesRemaining} ${minutesRemaining === 1 ? 'minuto' : 'minutos'}`,
      retryAfter: secondsRemaining,
      resetTime: resetTime
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Saltar rate limiting en rutas de health check
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Middleware para actualizar último acceso
const updateLastSeen = async (req, res, next) => {
  try {
    if (req.user && req.user.userId) {
      await User.findByIdAndUpdate(req.user.userId, {
        lastSeen: new Date(),
        isOnline: true
      });
    }
    next();
  } catch (error) {
    console.error('Error actualizando último acceso:', error);
    next(); // Continuar aunque falle la actualización
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  authRateLimiter,
  generalRateLimiter,
  updateLastSeen
}; 