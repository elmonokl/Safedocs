// Configuración principal de Express
// Define middlewares de seguridad, CORS, logging y rutas de la API
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importación de rutas de la API
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const friendsRoutes = require('./routes/friends');
const adminRoutes = require('./routes/admin');
const auditRoutes = require('./routes/audit');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Middleware de seguridad que protege las cabeceras HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configuración de CORS para permitir solicitudes desde el frontend
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4173',
      'http://localhost:4174'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('CORS: Origen no permitido:', origin);
    return callback(new Error('CORS: origen no permitido')); 
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Middleware para parsear JSON y URL-encoded (límite de 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Endpoint de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SafeDocs API está funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Montaje de rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);

// Middleware para manejar rutas no encontradas (404)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores global
// Captura y formatea todos los errores no manejados
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);

  // Error de tamaño de archivo excedido
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Campo de archivo inesperado'
    });
  }

  if (error.message && error.message.includes('Solo se permiten')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Error de token JWT inválido
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  // Error de token JWT expirado
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Error de validación de Mongoose
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // Error de MongoDB: índice único duplicado
  if (error.code === 11000) {
    // Error de duplicado (índice único)
    const field = Object.keys(error.keyPattern || {})[0] || 'campo';
    let message = 'El recurso ya existe';
    
    console.error('Error de índice único duplicado (11000):', {
      field,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      message: error.message,
      stack: error.stack
    });
    
    if (field === 'email') {
      message = 'El correo electrónico ya está registrado';
    } else if (field === 'shareToken') {
      // Para documentos oficiales, este error no debería ocurrir porque no tienen shareToken
      // Si ocurre, puede ser un problema con documentos existentes o un error en otro lugar
      message = 'Error al procesar el documento. Por favor, verifica que el título y los datos sean únicos e intenta nuevamente.';
      console.error('Error de shareToken duplicado - esto no debería ocurrir para documentos oficiales:', {
        keyValue: error.keyValue,
        isOfficial: error.keyValue?.isOfficial,
        path: req.path,
        method: req.method
      });
    } else if (field) {
      message = `El ${field} ya está en uso. Por favor, usa un valor diferente.`;
    }
    
    return res.status(400).json({
      success: false,
      message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

module.exports = app; 