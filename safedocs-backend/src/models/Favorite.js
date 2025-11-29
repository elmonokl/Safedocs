const mongoose = require('mongoose');

/**
 * Modelo de Favoritos
 * Relaciona usuarios con documentos que han marcado como favoritos
 */
const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio'],
    index: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'El documento es obligatorio'],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice compuesto único para evitar duplicados
favoriteSchema.index({ userId: 1, documentId: 1 }, { unique: true });

// Índices para optimizar consultas
favoriteSchema.index({ userId: 1, createdAt: -1 });

// Virtual para obtener información del documento
favoriteSchema.virtual('document', {
  ref: 'Document',
  localField: 'documentId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener información del usuario
favoriteSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name career profilePicture' }
});

// Método estático para verificar si un documento es favorito
favoriteSchema.statics.isFavorite = function(userId, documentId) {
  return this.findOne({ userId, documentId });
};

// Método estático para obtener favoritos de un usuario
favoriteSchema.statics.findByUser = function(userId) {
  return this.find({ userId })
    .populate({
      path: 'document',
      populate: {
        path: 'author',
        select: 'name career profilePicture'
      }
    })
    .sort({ createdAt: -1 });
};

// Método estático para contar favoritos de un usuario
favoriteSchema.statics.countByUser = function(userId) {
  return this.countDocuments({ userId });
};

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;

