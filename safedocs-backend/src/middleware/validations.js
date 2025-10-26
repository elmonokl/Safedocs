const { body, param, query, validationResult } = require('express-validator');

/**
 * Validaciones de entrada
 * Registros de validación para todos los endpoints de la API
 */
const authValidations = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('El nombre debe tener entre 2 y 50 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.\-]+$/)
      .withMessage('El nombre solo puede contener letras, números, espacios, puntos y guiones'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    
    body('career')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('La carrera debe tener entre 2 y 100 caracteres')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    
    body('password')
      .notEmpty()
      .withMessage('La contraseña es requerida')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('El nombre debe tener entre 2 y 50 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.\-]+$/)
      .withMessage('El nombre solo puede contener letras, números, espacios, puntos y guiones'),
    
    body('career')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('La carrera debe tener entre 2 y 100 caracteres'),
    
    body('currentPassword')
      .optional()
      .notEmpty()
      .withMessage('La contraseña actual es requerida para cambiar la contraseña'),
    
    body('newPassword')
      .optional()
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
  ]
};

const documentValidations = {
  upload: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('El título debe tener entre 3 y 100 caracteres'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('category')
      .custom((value) => {
        const allowed = ['academic', 'research', 'project', 'other'];
        const allowedEs = ['Apuntes', 'Guías', 'Resumen', 'Otro'];
        return allowed.includes(value) || allowedEs.includes(value);
      })
      .withMessage('Categoría inválida')
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('ID de documento inválido'),
    
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('El título debe tener entre 3 y 100 caracteres'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('category')
      .optional()
      .isIn(['academic', 'research', 'project', 'other'])
      .withMessage('Categoría inválida')
  ],

  delete: [
    param('id')
      .isMongoId()
      .withMessage('ID de documento inválido')
  ],

  download: [
    param('id')
      .isMongoId()
      .withMessage('ID de documento inválido')
  ],

  getById: [
    param('id')
      .isMongoId()
      .withMessage('ID de documento inválido')
  ],

  getAll: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página debe ser un número mayor a 0'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite debe ser entre 1 y 100'),
    
    query('category')
      .optional()
      .isIn(['academic', 'research', 'project', 'other'])
      .withMessage('Categoría inválida'),
    
    query('search')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('La búsqueda debe tener al menos 2 caracteres'),
    
    query('sortBy')
      .optional()
      .isIn(['date', 'downloads', 'title'])
      .withMessage('Ordenamiento inválido')
  ]
};

// Validaciones para amigos
const friendsValidations = {
  searchUsers: [
    query('q')
      .trim()
      .isLength({ min: 2 })
      .withMessage('La búsqueda debe tener al menos 2 caracteres')
  ],

  sendFriendRequest: [
    body('receiverId')
      .isMongoId()
      .withMessage('ID de usuario inválido')
  ],

  acceptFriendRequest: [
    body('requestId')
      .isMongoId()
      .withMessage('ID de solicitud inválido')
  ],

  rejectFriendRequest: [
    body('requestId')
      .isMongoId()
      .withMessage('ID de solicitud inválido')
  ],

  removeFriend: [
    body('friendId')
      .isMongoId()
      .withMessage('ID de usuario inválido')
  ],

  getFriendSuggestions: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Límite debe ser entre 1 y 50')
  ]
};

const userValidations = {
  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de usuario inválido')
  ],

  updateById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de usuario inválido'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    
    body('career')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('La carrera debe tener entre 2 y 100 caracteres'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('Estado activo debe ser true o false')
  ]
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validaciones para archivos
const fileValidations = {
  upload: (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debes seleccionar un archivo'
      });
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no permitido'
      });
    }

    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'El archivo no puede exceder 10MB'
      });
    }

    next();
  }
};

module.exports = {
  authValidations,
  documentValidations,
  friendsValidations,
  userValidations,
  fileValidations,
  handleValidationErrors
}; 