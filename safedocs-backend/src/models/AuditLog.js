const mongoose = require('mongoose');

// Esquema de registro de auditoría de acciones sobre documentos del usuario
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
  type: {
    type: String,
    enum: ['view', 'comment', 'download', 'like'],
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

module.exports = mongoose.model('AuditLog', auditLogSchema);





