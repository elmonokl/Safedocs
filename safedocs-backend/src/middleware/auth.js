const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario inactivo'
      });
    }

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

const optionalAuthenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      req.user = null;
      return next();
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: (req, res) => {
    const resetHeader = res.get('X-RateLimit-Reset');
    let resetTime;
    let secondsRemaining;
    
    if (resetHeader) {
      resetTime = parseInt(resetHeader);
      secondsRemaining = resetTime - Math.floor(Date.now() / 1000);
    } else {
      secondsRemaining = 15 * 60;
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

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: (req, res) => {
    const resetHeader = res.get('X-RateLimit-Reset');
    let resetTime;
    let secondsRemaining;
    
    if (resetHeader) {
      resetTime = parseInt(resetHeader);
      secondsRemaining = resetTime - Math.floor(Date.now() / 1000);
    } else {
      secondsRemaining = 15 * 60;
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
    return req.path === '/health' || req.path === '/api/health';
  }
});

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
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  authRateLimiter,
  generalRateLimiter,
  updateLastSeen
}; 