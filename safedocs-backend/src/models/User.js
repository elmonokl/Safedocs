const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Esquema de Usuario
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/@unab\.cl$/, 'Debes usar un correo institucional (@unab.cl)']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  career: {
    type: String,
    default: 'Ingeniería en Computación e Informática',
    trim: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['student', 'professor', 'admin', 'super_admin'],
    default: 'student'
  },
  permissions: {
    type: [String],
    default: function() {
      if (this.role === 'admin') return ['manage_users', 'manage_documents', 'view_analytics'];
      if (this.role === 'super_admin') return ['manage_users', 'manage_documents', 'view_analytics', 'manage_admins', 'system_settings'];
      if (this.role === 'professor') return ['manage_documents', 'view_analytics'];
      return ['view_documents', 'upload_documents'];
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar consultas
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ name: 1 });

// Middleware para hashear contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para verificar contraseña
userSchema.methods.verifyPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener datos públicos del usuario
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Método estático para buscar por email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Método estático para buscar por ID
userSchema.statics.findByIdPublic = function(id) {
  return this.findById(id).select('-password');
};

// Método estático para buscar usuarios (excluyendo uno específico)
userSchema.statics.findUsers = function(excludeUserId = null, searchTerm = '') {
  let query = this.find({ isActive: true });
  
  if (excludeUserId) {
    query = query.where('_id').ne(excludeUserId);
  }
  
  if (searchTerm) {
    query = query.or([
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { career: { $regex: searchTerm, $options: 'i' } }
    ]);
  }
  
  return query.select('-password').sort({ name: 1 });
};

// Método para actualizar último acceso
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  this.isOnline = true;
  return this.save();
};

// Método para marcar como offline
userSchema.methods.setOffline = function() {
  this.isOnline = false;
  this.lastSeen = new Date();
  return this.save();
};

// Método para verificar permisos
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Método para verificar si es admin
userSchema.methods.isAdmin = function() {
  return ['admin', 'super_admin'].includes(this.role);
};

// Método para verificar si es super admin
userSchema.methods.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

// Método para obtener usuarios por rol (solo para admins)
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true }).select('-password');
};

// Método para obtener estadísticas de usuarios (solo para admins)
userSchema.statics.getUserStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        onlineCount: {
          $sum: { $cond: ['$isOnline', 1, 0] }
        }
      }
    },
    {
      $project: {
        role: '$_id',
        totalUsers: '$count',
        onlineUsers: '$onlineCount',
        _id: 0
      }
    }
  ]);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 