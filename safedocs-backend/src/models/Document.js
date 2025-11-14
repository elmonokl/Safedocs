const mongoose = require('mongoose');

// Esquema de Documento
const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio']
  },
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede tener más de 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
  },
  category: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: {
      values: ['academic', 'research', 'project', 'other'],
      message: 'Categoría debe ser: academic, research, project, other'
    }
  },
  course: {
    type: String,
    required: false, // Hacer opcional para compatibilidad con documentos existentes
    trim: true,
    maxlength: [100, 'El nombre del curso no puede tener más de 100 caracteres'],
    default: ''
  },
  fileName: {
    type: String,
    required: [true, 'El nombre del archivo es obligatorio']
  },
  filePath: {
    type: String,
    required: [true, 'La ruta del archivo es obligatoria']
  },
  fileType: {
    type: String,
    required: [true, 'El tipo de archivo es obligatorio']
  },
  fileSize: {
    type: Number,
    required: [true, 'El tamaño del archivo es obligatorio']
  },
  downloadsCount: {
    type: Number,
    default: 0,
    min: [0, 'El contador de descargas no puede ser negativo']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isOfficial: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  shareToken: {
    type: String,
    unique: true, // Esto crea automáticamente un índice único, no necesitamos index() adicional
    sparse: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar consultas
documentSchema.index({ userId: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ course: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ downloadsCount: -1 });
documentSchema.index({ title: 'text', description: 'text' });
// shareToken ya tiene índice único por unique: true, no duplicar
documentSchema.index({ isOfficial: 1 });

// Virtual para obtener información del autor
documentSchema.virtual('author', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name career profilePicture' }
});

// Método para incrementar descargas
documentSchema.methods.incrementDownloads = function() {
  this.downloadsCount += 1;
  return this.save();
};

// Método para generar token de compartir
documentSchema.methods.generateShareToken = function() {
  const crypto = require('crypto');
  this.shareToken = crypto.randomBytes(32).toString('hex');
  return this.save();
};

// Método estático para encontrar documento por token
documentSchema.statics.findByShareToken = function(token) {
  return this.findOne({ shareToken: token })
    .populate('author', 'name career profilePicture');
};

// Método estático para obtener documentos con información del autor
documentSchema.statics.findWithAuthor = function(query = {}) {
  return this.find(query)
    .populate('author', 'name career profilePicture')
    .sort({ createdAt: -1 });
};

// Método estático para obtener documentos de un usuario
documentSchema.statics.findByUser = function(userId) {
  return this.find({ userId })
    .populate('author', 'name career profilePicture')
    .sort({ createdAt: -1 });
};

// Método estático para obtener documentos populares
documentSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isPublic: true })
    .populate('author', 'name career profilePicture')
    .sort({ downloadsCount: -1, createdAt: -1 })
    .limit(limit);
};

// Método estático para buscar documentos
documentSchema.statics.search = function(searchTerm, filters = {}) {
  let query = this.find({ isPublic: true });
  
  if (searchTerm) {
    query = query.or([
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]);
  }
  
  if (filters.category) {
    query = query.where('category', filters.category);
  }
  
  if (filters.userId) {
    query = query.where('userId', filters.userId);
  }
  
  return query
    .populate('author', 'name career profilePicture')
    .sort({ createdAt: -1 });
};

// Método estático para obtener estadísticas
documentSchema.statics.getStats = function(userId = null) {
  let matchStage = { isPublic: true };
  
  if (userId) {
    matchStage.userId = userId;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        totalDownloads: { $sum: '$downloadsCount' },
        averageDownloads: { $avg: '$downloadsCount' },
        categories: { $addToSet: '$category' }
      }
    },
    {
      $project: {
        _id: 0,
        totalDocuments: 1,
        totalDownloads: 1,
        averageDownloads: { $round: ['$averageDownloads', 2] },
        categories: 1
      }
    }
  ]);
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document; 