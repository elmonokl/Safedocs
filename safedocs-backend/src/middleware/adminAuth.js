const User = require('../models/User');

// Middleware para verificar si el usuario es administrador
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    next();
  } catch (error) {
    console.error('Error en middleware de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar permisos específicos
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticación requerido'
        });
      }

      if (!req.user.hasPermission(permission)) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere el permiso: ${permission}`
        });
      }

      next();
    } catch (error) {
      console.error('Error en middleware de permisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

// Middleware para verificar si es super admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    // Verificar que el usuario es super admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de super administrador'
      });
    }

    next();
  } catch (error) {
    console.error('Error en middleware de super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  requireAdmin,
  requirePermission,
  requireSuperAdmin
};
