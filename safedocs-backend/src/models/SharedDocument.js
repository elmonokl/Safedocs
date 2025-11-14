const mongoose = require('mongoose');

// Esquema de Documento Compartido
const sharedDocumentSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'El documento es obligatorio'],
    index: true
  },
  sharedWithUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario con quien se compartió es obligatorio'],
    index: true
  },
  sharedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario que compartió es obligatorio'],
    index: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'El mensaje no puede exceder 500 caracteres'],
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
sharedDocumentSchema.index({ documentId: 1, sharedWithUserId: 1 }, { unique: true });
sharedDocumentSchema.index({ sharedWithUserId: 1, isRead: 1, createdAt: -1 });
sharedDocumentSchema.index({ sharedByUserId: 1, createdAt: -1 });

// Virtual para obtener información del documento
sharedDocumentSchema.virtual('document', {
  ref: 'Document',
  localField: 'documentId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener información del usuario que compartió
sharedDocumentSchema.virtual('sharedBy', {
  ref: 'User',
  localField: 'sharedByUserId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name email career profilePicture' }
});

// Método estático para crear o actualizar un documento compartido
sharedDocumentSchema.statics.createOrUpdate = async function(documentId, sharedWithUserId, sharedByUserId, message = '') {
  const existing = await this.findOne({ documentId, sharedWithUserId });
  
  if (existing) {
    // Actualizar mensaje y fecha si ya existe
    existing.message = message;
    existing.createdAt = new Date();
    existing.isRead = false;
    existing.readAt = null;
    return existing.save();
  }
  
  // Crear nuevo
  return this.create({
    documentId,
    sharedWithUserId,
    sharedByUserId,
    message
  });
};

// Método estático para obtener documentos compartidos con un usuario
sharedDocumentSchema.statics.getSharedWithUser = function(userId, options = {}) {
  const { limit = 50, skip = 0, unreadOnly = false } = options;
  
  const query = { sharedWithUserId: userId };
  if (unreadOnly) {
    query.isRead = false;
  }
  
  return this.find(query)
    .populate({
      path: 'documentId',
      populate: {
        path: 'userId',
        select: 'name email career profilePicture'
      }
    })
    .populate('sharedByUserId', 'name email career profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Método estático para marcar como leído (ya no se usa, se hace directamente en el controlador)
sharedDocumentSchema.statics.markAsRead = function(documentId, userId) {
  return this.findOneAndUpdate(
    { documentId, sharedWithUserId: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  ).populate('documentId').populate('sharedBy', 'name email career profilePicture');
};

// Método estático para contar documentos no leídos
sharedDocumentSchema.statics.countUnread = function(userId) {
  return this.countDocuments({ sharedWithUserId: userId, isRead: false });
};

const SharedDocument = mongoose.model('SharedDocument', sharedDocumentSchema);

module.exports = SharedDocument;

