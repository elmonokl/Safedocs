const Document = require('../models/Document');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const path = require('path');
const fs = require('fs').promises;
// Validaciones ya son manejadas en rutas con handleValidationErrors
const { documentUpload } = require('../middleware/upload');

const upload = documentUpload;

/**
 * Controlador de Documentos
 * Gestiona CRUD completo de documentos y archivos
 */
class DocumentController {
  // Mapea categorías del frontend al modelo
  static mapCategoryToModel(category) {
    const mapping = {
      'Apuntes': 'academic',
      'Guías': 'research',
      'Resumen': 'project',
      'Otro': 'other'
    };
    return mapping[category] || category;
  }

  // Subir nuevo documento
  static async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Debes subir un archivo'
        });
      }

      const userId = req.user.userId;
      const { title, description, course } = req.body;
      const category = DocumentController.mapCategoryToModel(req.body.category);

      // Validar que course esté presente
      if (!course || !course.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El curso es obligatorio'
        });
      }

      const documentData = {
        userId,
        title,
        description: description || '',
        category,
        course: course.trim(),
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };

      const newDocument = await Document.create(documentData);
      const populatedDocument = await Document.findById(newDocument._id)
        .populate('author', 'name career profilePicture');

      await AuditLog.createLog({
        userId: userId, // El propietario del documento
        actorId: userId, // Quien realizó la acción
        documentId: newDocument._id,
        action: 'upload',
        description: `Documento "${title}" subido exitosamente`,
        comment: description || ''
      });

      res.status(201).json({
        success: true,
        message: 'Documento subido exitosamente',
        data: {
          document: populatedDocument
        }
      });

    } catch (error) {
      // Rollback: eliminar archivo si falla la BD
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          // Ignorar error de unlink
        }
      }
      next(error);
    }
  }

  // Obtener todos los documentos
  static async getAllDocuments(req, res, next) {
    try {
      const { page = 1, limit = 20, search, category } = req.query;
      const skip = (page - 1) * limit;

      let query = { isPublic: true };
      if (category) query.category = category;

      let documents;
      if (search) {
        documents = await Document.search(search, { category });
      } else {
        documents = await Document.findWithAuthor(query)
          .skip(skip)
          .limit(parseInt(limit));
      }

      // Contar total de documentos
      const total = await Document.countDocuments(query);

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener documentos del usuario
  static async getMyDocuments(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const documents = await Document.findByUser(userId)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Document.countDocuments({ userId });

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener documento por ID
  static async getDocumentById(req, res, next) {
    try {
      const { id } = req.params;
      const document = await Document.findById(id)
        .populate('author', 'name career profilePicture');

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          document
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Descargar documento
  static async downloadDocument(req, res, next) {
    try {
      const { id } = req.params;
      const document = await Document.findById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      try {
        await fs.access(document.filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      await document.incrementDownloads();

      const userId = req.user?.userId || null;
      if (userId) {
        await AuditLog.createLog({
          userId: document.userId, // El propietario del documento
          actorId: userId, // Quien descargó el documento
          documentId: document._id,
          action: 'download',
          description: `Documento "${document.title}" descargado`,
          comment: `Descarga #${document.downloadsCount + 1}`
        });
      }

      res.download(document.filePath, document.fileName);

    } catch (error) {
      next(error);
    }
  }

  // Actualizar documento
  static async updateDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { title, description, course } = req.body;
      const category = req.body.category 
        ? DocumentController.mapCategoryToModel(req.body.category) 
        : undefined;

      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      if (document.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar este documento'
        });
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category) updateData.category = category;
      if (course !== undefined) updateData.course = course;

      const updatedDocument = await Document.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('author', 'name career profilePicture');

      // Registrar en auditoría
      const changes = [];
      if (title && title !== document.title) {
        changes.push(`Título: "${document.title}" → "${title}"`);
      }
      if (description !== undefined && description !== document.description) {
        changes.push(`Descripción actualizada`);
      }
      if (category && category !== document.category) {
        changes.push(`Categoría: "${document.category}" → "${category}"`);
      }
      if (course !== undefined && course !== document.course) {
        changes.push(`Curso: "${document.course}" → "${course}"`);
      }

      await AuditLog.createLog({
        userId: userId, // El propietario del documento
        actorId: userId, // Quien realizó la acción
        documentId: document._id,
        action: 'update',
        description: `Documento "${updatedDocument.title}" actualizado exitosamente`,
        comment: changes.length > 0 ? changes.join(', ') : 'Sin cambios específicos'
      });

      res.json({
        success: true,
        message: 'Documento actualizado exitosamente',
        data: {
          document: updatedDocument
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Eliminar documento
  static async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Verificar que el documento existe y pertenece al usuario
      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      // Comparar ObjectIds correctamente
      const documentUserId = document.userId.toString();
      const requestUserId = userId.toString();
      
      if (documentUserId !== requestUserId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este documento'
        });
      }

      // Eliminar archivo del sistema
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.warn('No se pudo eliminar el archivo físico:', error.message);
      }

      await AuditLog.createLog({
        userId: userId, // El propietario del documento
        actorId: userId, // Quien realizó la acción
        documentId: document._id,
        action: 'delete',
        description: `Documento "${document.title}" eliminado exitosamente`,
        comment: `Archivo: ${document.fileName}`
      });

      await Document.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Documento eliminado exitosamente'
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener documentos populares
  static async getPopularDocuments(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const documents = await Document.findPopular(parseInt(limit));

      res.json({
        success: true,
        data: {
          documents
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas
  static async getStats(req, res, next) {
    try {
      const userId = req.user.userId;
      const stats = await Document.getStats(userId);

      res.json({
        success: true,
        data: {
          stats: stats[0] || {
            totalDocuments: 0,
            totalDownloads: 0,
            averageDownloads: 0,
            categories: []
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Generar o obtener link de compartir
  static async generateShareLink(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      let document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      // Verificar que el usuario es el propietario
      if (document.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para compartir este documento'
        });
      }

      // Generar token si no existe
      if (!document.shareToken) {
        await document.generateShareToken();
        // Recargar el documento desde la base de datos para obtener el token actualizado
        document = await Document.findById(id).populate('author', 'name career profilePicture');
      } else {
        // Si ya tiene token, solo poblar el autor
        await document.populate('author', 'name career profilePicture');
      }

      // Construir la URL del frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const shareUrl = `${frontendUrl}/documento/${document.shareToken}`;

      res.json({
        success: true,
        data: {
          shareToken: document.shareToken,
          shareUrl: shareUrl,
          document: document
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener documento por token de compartir (público, sin autenticación)
  static async getDocumentByToken(req, res, next) {
    try {
      const { token } = req.params;

      const document = await Document.findByShareToken(token);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado o link inválido'
        });
      }

      res.json({
        success: true,
        data: {
          document: document
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Descargar documento por token (público, sin autenticación)
  static async downloadByToken(req, res, next) {
    try {
      const { token } = req.params;

      const document = await Document.findByShareToken(token);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado o link inválido'
        });
      }

      try {
        await fs.access(document.filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      await document.incrementDownloads();

      res.download(document.filePath, document.fileName);

    } catch (error) {
      next(error);
    }
  }

  // Compartir documento con amigos específicos
  static async shareWithFriends(req, res, next) {
    try {
      const { id } = req.params;
      const { friendIds, message } = req.body;
      const userId = req.user.userId;

      if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes especificar al menos un amigo'
        });
      }

      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      // Verificar que el usuario es el propietario
      if (document.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para compartir este documento'
        });
      }

      // Verificar que los usuarios son amigos
      const Friendship = require('../models/Friendship');
      const User = require('../models/User');

      const friends = await Promise.all(
        friendIds.map(async (friendId) => {
          const areFriends = await Friendship.areFriends(userId, friendId);
          if (!areFriends) {
            return null;
          }
          return await User.findById(friendId).select('name email');
        })
      );

      const validFriends = friends.filter(f => f !== null);
      if (validFriends.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes compartir con amigos válidos'
        });
      }

      // Generar token si no existe
      if (!document.shareToken) {
        await document.generateShareToken();
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const shareUrl = `${frontendUrl}/documento/${document.shareToken}`;

      // Registrar en auditoría
      await AuditLog.createLog({
        userId: userId,
        actorId: userId,
        documentId: document._id,
        action: 'share',
        description: `Documento "${document.title}" compartido con ${validFriends.length} amigo(s)`,
        comment: `Amigos: ${validFriends.map(f => f.name).join(', ')}`
      });

      res.json({
        success: true,
        message: `Documento compartido con ${validFriends.length} amigo(s)`,
        data: {
          shareUrl: shareUrl,
          shareToken: document.shareToken,
          friends: validFriends,
          message: message || ''
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = { DocumentController, upload }; 