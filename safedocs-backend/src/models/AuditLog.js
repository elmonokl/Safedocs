const mongoose = require('mongoose');

/**
 * Modelo de Auditoría
 * Registra todas las acciones realizadas sobre documentos
 */
const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  action: {
    type: String,
    enum: ['upload', 'delete', 'view', 'download', 'update', 'comment', 'like', 'share', 'add_favorite', 'remove_favorite'],
    required: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  comment: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ documentId: 1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// Virtuals para relacionar con User y Document
auditLogSchema.virtual('actor', {
  ref: 'User',
  localField: 'actorId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name email' }
});

auditLogSchema.virtual('document', {
  ref: 'Document',
  localField: 'documentId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'title fileName' }
});

auditLogSchema.statics.createLog = async function(data) {
  const log = new this(data);
  return await log.save();
};

auditLogSchema.statics.getAuditLogs = function(filters = {}, options = {}) {
  const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = -1 } = options;
  const skip = (page - 1) * limit;
  
  return this.find(filters)
    .populate('actor', 'name email')
    .populate('document', 'title fileName')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);

