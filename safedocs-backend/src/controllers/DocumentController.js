const Document = require('../models/Document');
const User = require('../models/User');
const path = require('path');
const fs = require('fs').promises;
// Validaciones ya son manejadas en rutas con handleValidationErrors
const { documentUpload } = require('../middleware/upload');

// Upload centralizado
const upload = documentUpload;

/**
 * Controlador de Documentos
 * Subida, lectura, descarga, actualización y eliminación de documentos.
 * Upload centralizado con middleware/upload y validaciones en rutas.
 */
class DocumentController {
  static mapCategoryToModel(category) {
    const mapping = {
      'Apuntes': 'academic',
      'Guías': 'research',
      'Resumen': 'project',
      'Otro': 'other'
    };
    return mapping[category] || category;
  }
  // Subir documento
  static async uploadDocument(req, res, next) {
    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Debes subir un archivo'
        });
      }

      const userId = req.user.userId;
      const { title, description } = req.body;
      const category = DocumentController.mapCategoryToModel(req.body.category);

      // Crear documento en la base de datos
      const documentData = {
        userId,
        title,
        description: description || '',
        category,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };

      const newDocument = await Document.create(documentData);
      const populatedDocument = await Document.findById(newDocument._id)
        .populate('author', 'name career profilePicture');

      res.status(201).json({
        success: true,
        message: 'Documento subido exitosamente',
        data: {
          document: populatedDocument
        }
      });

    } catch (error) {
      // Eliminar archivo si se subió pero falló la base de datos
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          // No interrumpir el flujo; pasar error principal al manejador global
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

      // Verificar que el archivo existe
      try {
        await fs.access(document.filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      // Incrementar contador de descargas
      await document.incrementDownloads();

      // Enviar archivo
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
      const { title, description } = req.body;
      const category = req.body.category ? DocumentController.mapCategoryToModel(req.body.category) : undefined;

      // Verificar que el documento existe y pertenece al usuario
      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      if (document.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar este documento'
        });
      }

      // Actualizar documento
      const updateData = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category) updateData.category = category;

      const updatedDocument = await Document.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('author', 'name career profilePicture');

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

      if (document.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este documento'
        });
      }

      // Eliminar archivo físico
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.warn('No se pudo eliminar el archivo físico:', error.message);
      }

      // Eliminar documento de la base de datos
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
}

module.exports = { DocumentController, upload }; 