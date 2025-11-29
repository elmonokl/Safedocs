// Controlador de documentos
// Maneja todas las operaciones relacionadas con documentos: subida, descarga, actualización, eliminación, compartir y favoritos
const Document = require('../models/Document');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Friendship = require('../models/Friendship');
const SharedDocument = require('../models/SharedDocument');
const Favorite = require('../models/Favorite');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const { documentUpload } = require('../middleware/upload');

const upload = documentUpload;

class DocumentController {
  // Mapea las categorías del frontend al formato del modelo
  static mapCategoryToModel(category) {
    const mapping = {
      'Apuntes': 'academic',
      'Guías': 'research',
      'Resumen': 'project',
      'Resúmenes': 'project',
      'Pruebas': 'academic',
      'Otro': 'other',
      'Otros': 'other'
    };
    return mapping[category] || category;
  }
  // Sube un nuevo documento al sistema
  // Valida el archivo, guarda en el servidor y crea el registro en la base de datos
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
        fileSize: req.file.size,
        isOfficial: false
      };

      const newDocument = await Document.create(documentData);
      const populatedDocument = await Document.findById(newDocument._id)
        .populate('author', 'name career profilePicture');

      await AuditLog.createLog({
        userId: userId,
        actorId: userId,
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
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error eliminando archivo después de fallo:', unlinkError);
        }
      }
      next(error);
    }
  }
  static async uploadOfficialDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Debes subir un archivo'
        });
      }

      const userId = req.user.userId;
      const userRole = req.user.role;

      if (userRole !== 'professor') {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error eliminando archivo:', unlinkError);
        }
        return res.status(403).json({
          success: false,
          message: 'Solo los profesores pueden subir documentos oficiales'
        });
      }

      const professor = await User.findById(userId);
      if (!professor) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const { title, description, course } = req.body;
      const category = DocumentController.mapCategoryToModel(req.body.category || 'academic');

      if (!course || !course.trim()) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error eliminando archivo:', unlinkError);
        }
        return res.status(400).json({
          success: false,
          message: 'El curso es obligatorio'
        });
      }

      // Los documentos oficiales no necesitan shareToken ya que son públicos para todos
      const documentData = {
        userId,
        title,
        description: description || '',
        category,
        course: course.trim(),
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        isOfficial: true,
        isPublic: true
        // No incluir shareToken para documentos oficiales
      };

      console.log('Intentando crear documento oficial con datos:', {
        title,
        course: course.trim(),
        userId,
        isOfficial: true
      });

      const newDocument = await Document.create(documentData);
      const populatedDocument = await Document.findById(newDocument._id)
        .populate('author', 'name career profilePicture');

      await AuditLog.createLog({
        userId: userId,
        actorId: userId,
        documentId: newDocument._id,
        action: 'upload',
        description: `Documento oficial "${title}" subido por profesor ${professor.name}`,
        comment: `Curso: ${course.trim()}`
      });

      const NotificationController = require('./NotificationController');
      NotificationController.createOfficialDocumentNotification(newDocument._id, userId)
        .catch(error => {
          console.error('Error creando notificaciones de documento oficial:', error);
        });

      res.status(201).json({
        success: true,
        message: 'Documento oficial subido exitosamente',
        data: {
          document: populatedDocument
        }
      });

    } catch (error) {
      console.error('Error completo en uploadOfficialDocument:', {
        message: error.message,
        code: error.code,
        name: error.name,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        stack: error.stack
      });

      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error eliminando archivo después de fallo:', unlinkError);
        }
      }
      next(error);
    }
  }
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

  static async getMyDocuments(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const query = { userId, $or: [{ isOfficial: false }, { isOfficial: { $exists: false } }] };
      
      const documents = await Document.find(query)
        .populate('author', 'name career profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

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
      console.error('Error en getMyDocuments:', error);
      next(error);
    }
  }

  static async getDocumentById(req, res, next) {
    try {
      const { id } = req.params;
      const viewerId = req.user?.userId || null;
      
      const document = await Document.findById(id)
        .populate('author', 'name career profilePicture');

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      if (viewerId && document.userId.toString() !== viewerId) {
        try {
          await AuditLog.createLog({
            userId: document.userId,
            actorId: viewerId,
            documentId: document._id,
            action: 'view',
            description: `Documento "${document.title}" visualizado`,
            comment: ''
          });
        } catch (auditError) {
          console.error('Error registrando visualización:', auditError);
        }
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
          userId: document.userId,
          actorId: userId,
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
        userId: userId,
        actorId: userId,
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

  static async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      const documentUserId = document.userId.toString();
      const requestUserId = userId.toString();
      
      if (documentUserId !== requestUserId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este documento'
        });
      }

      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.warn('No se pudo eliminar el archivo físico:', error.message);
      }

      await AuditLog.createLog({
        userId: userId,
        actorId: userId,
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

      if (document.isOfficial) {
        return res.status(403).json({
          success: false,
          message: 'Los documentos oficiales no se pueden compartir por QR o enlaces. Son públicos para todos los usuarios.'
        });
      }

      if (document.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para compartir este documento'
        });
      }

      if (!document.shareToken) {
        await document.generateShareToken();
        document = await Document.findById(id).populate('author', 'name career profilePicture');
      } else {
        await document.populate('author', 'name career profilePicture');
      }

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

  static async getDocumentByToken(req, res, next) {
    try {
      const { token } = req.params;
      const viewerId = req.user?.userId || null;

      const document = await Document.findByShareToken(token);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado o link inválido'
        });
      }

      if (viewerId && document.userId.toString() !== viewerId) {
        try {
          await AuditLog.createLog({
            userId: document.userId,
            actorId: viewerId,
            documentId: document._id,
            action: 'view',
            description: `Documento compartido "${document.title}" visualizado`,
            comment: ''
          });
        } catch (auditError) {
          console.error('Error registrando visualización de documento compartido:', auditError);
        }
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

  static async downloadByToken(req, res, next) {
    try {
      const { token } = req.params;
      const downloaderId = req.user?.userId || null;

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

      if (downloaderId && document.userId.toString() !== downloaderId) {
        try {
          await AuditLog.createLog({
            userId: document.userId,
            actorId: downloaderId,
            documentId: document._id,
            action: 'download',
            description: `Documento compartido "${document.title}" descargado`,
            comment: `Descarga #${document.downloadsCount + 1}`
          });
        } catch (auditError) {
          console.error('Error registrando descarga de documento compartido:', auditError);
        }
      }

      res.download(document.filePath, document.fileName);

    } catch (error) {
      next(error);
    }
  }

  static async getOfficialDocuments(req, res, next) {
    try {
      const { page = 1, limit = 50, search, professor } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const numericLimit = Math.min(parseInt(limit) || 50, 100);
      
      let query = { isOfficial: true, isPublic: true };
      
      if (search && typeof search === 'string' && search.trim()) {
        query.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } }
        ];
      }
      
      if (professor && typeof professor === 'string' && professor.trim()) {
        try {
          const professorName = professor.trim();
          const professorUsers = await User.find({
            role: 'professor',
            isActive: true,
            name: { $regex: professorName, $options: 'i' }
          }).select('_id').lean();
          
          if (professorUsers && Array.isArray(professorUsers) && professorUsers.length > 0) {
            const professorIds = professorUsers.map(u => u._id).filter(Boolean);
            if (professorIds.length > 0) {
              query.userId = { $in: professorIds };
            } else {
              return res.json({
                success: true,
                data: {
                  documents: [],
                  pagination: {
                    page: parseInt(page),
                    limit: numericLimit,
                    total: 0,
                    pages: 0
                  }
                }
              });
            }
          } else {
            return res.json({
              success: true,
              data: {
                documents: [],
                pagination: {
                  page: parseInt(page),
                  limit: numericLimit,
                  total: 0,
                  pages: 0
                }
              }
            });
          }
        } catch (profError) {
          console.error('Error filtrando por profesor:', profError);
        }
      }
      
      const [documents, total] = await Promise.all([
        Document.find(query)
          .populate('author', 'name career profilePicture')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(numericLimit)
          .lean(),
        Document.countDocuments(query)
      ]);
      
      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: numericLimit,
            total,
            pages: Math.ceil(total / numericLimit)
          }
        }
      });
      
    } catch (error) {
      console.error('Error en getOfficialDocuments:', error);
      next(error);
    }
  }

  static async getOfficialDocumentById(req, res, next) {
    try {
      const { id } = req.params;
      const viewerId = req.user?.userId || null;

      const document = await Document.findOne({ _id: id, isOfficial: true, isPublic: true })
        .populate('author', 'name career profilePicture');
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento oficial no encontrado'
        });
      }

      if (viewerId && document.userId.toString() !== viewerId) {
        try {
          await AuditLog.createLog({
            userId: document.userId,
            actorId: viewerId,
            documentId: document._id,
            action: 'view',
            description: `Documento oficial "${document.title}" visualizado`,
            comment: `Curso: ${document.course}`
          });
        } catch (auditError) {
          console.error('Error registrando visualización de documento oficial:', auditError);
        }
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

  static async downloadOfficialDocument(req, res, next) {
    try {
      const { id } = req.params;
      const downloaderId = req.user?.userId || null;

      const document = await Document.findOne({ _id: id, isOfficial: true, isPublic: true });
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento oficial no encontrado'
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

      if (downloaderId && document.userId.toString() !== downloaderId) {
        try {
          await AuditLog.createLog({
            userId: document.userId,
            actorId: downloaderId,
            documentId: document._id,
            action: 'download',
            description: `Documento oficial "${document.title}" descargado`,
            comment: `Descarga #${document.downloadsCount + 1} - Curso: ${document.course}`
          });
        } catch (auditError) {
          console.error('Error registrando descarga de documento oficial:', auditError);
        }
      }

      res.download(document.filePath, document.fileName);

    } catch (error) {
      next(error);
    }
  }

  static async shareWithFriends(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de documento inválido'
        });
      }

      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }
      
      if (document.isOfficial) {
        return res.status(403).json({
          success: false,
          message: 'Los documentos oficiales no se pueden compartir con amigos. Son públicos para todos los usuarios.'
        });
      }

      if (document.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para compartir este documento'
        });
      }

      const { friendIds, message } = req.body;

      if (!friendIds) {
        return res.status(400).json({
          success: false,
          message: 'Debes especificar al menos un amigo',
          errors: [{ field: 'friendIds', message: 'El campo friendIds es requerido' }]
        });
      }

      let friendIdsArray = [];
      if (Array.isArray(friendIds)) {
        friendIdsArray = friendIds;
      } else if (typeof friendIds === 'string') {
        try {
          const parsed = JSON.parse(friendIds);
          friendIdsArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          friendIdsArray = [friendIds];
        }
      } else {
        friendIdsArray = [friendIds];
      }

      const validFriendIds = [];
      const invalidIds = [];
      
      for (const id of friendIdsArray) {
        if (!id || id === null || id === undefined) continue;
        
        const idStr = String(id).trim();
        
        if (!idStr || idStr === '' || idStr === 'undefined' || idStr === 'null' || idStr === '[object Object]') {
          invalidIds.push({ id, reason: 'ID vacío o inválido' });
          continue;
        }
        
        if (!mongoose.Types.ObjectId.isValid(idStr)) {
          invalidIds.push({ id: idStr, reason: 'Formato de ID inválido (debe ser un MongoId)' });
          continue;
        }
        
        validFriendIds.push(idStr);
      }

      if (validFriendIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes especificar al menos un amigo válido',
          errors: invalidIds.map(({ id, reason }) => ({ field: 'friendIds', message: `ID ${id}: ${reason}` }))
        });
      }

      const userIdObj = new mongoose.Types.ObjectId(userId);
      const friends = [];
      const notFriends = [];
      
      for (const friendIdStr of validFriendIds) {
        try {
          const friendIdObj = new mongoose.Types.ObjectId(friendIdStr);
          const friendship = await Friendship.areFriends(userIdObj, friendIdObj);
          
          if (!friendship) {
            notFriends.push(friendIdStr);
            continue;
          }
          
          const friend = await User.findById(friendIdObj).select('name email career profilePicture');
          if (!friend) continue;
          
          friends.push({ 
            id: friend._id.toString(), 
            name: friend.name, 
            email: friend.email 
          });
        } catch (error) {
          console.error(`Error verificando amistad con ${friendIdStr}:`, error);
          notFriends.push(friendIdStr);
        }
      }

      if (friends.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes compartir con amigos válidos. Verifica que los usuarios seleccionados sean tus amigos.',
          errors: notFriends.length > 0 ? [
            { field: 'friendIds', message: `Los siguientes usuarios no son tus amigos: ${notFriends.join(', ')}` }
          ] : []
        });
      }

      if (!document.shareToken) {
        await document.generateShareToken();
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const shareUrl = `${frontendUrl}/documento/${document.shareToken}`;

      const sharedDocuments = await Promise.all(
        friends.map(friend =>
          SharedDocument.createOrUpdate(
            document._id,
            friend.id,
            userId,
            message || ''
          ).catch(error => {
            console.error(`Error guardando documento compartido para ${friend.id}:`, error);
            return null;
          })
        )
      );

      const savedDocuments = sharedDocuments.filter(sd => sd !== null);

      try {
        await AuditLog.createLog({
          userId: userId,
          actorId: userId,
          documentId: document._id,
          action: 'share',
          description: `Documento "${document.title}" compartido con ${friends.length} amigo(s)`,
          comment: `Amigos: ${friends.map(f => f.name).join(', ')}`
        });
      } catch (auditError) {
        console.error('Error registrando en auditoría:', auditError);
      }

      res.json({
        success: true,
        message: `Documento compartido con ${friends.length} amigo(s)${notFriends.length > 0 ? `. ${notFriends.length} usuario(s) no eran amigos` : ''}`,
        data: {
          shareUrl: shareUrl,
          shareToken: document.shareToken,
          friends: friends,
          message: message || '',
          sharedDocuments: savedDocuments.length,
          warnings: notFriends.length > 0 ? [`Los siguientes usuarios no eran amigos: ${notFriends.join(', ')}`] : []
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getSharedDocuments(req, res, next) {
    try {
      const userId = req.user.userId;
      const { limit = 50, skip = 0, unreadOnly = false } = req.query;

      const sharedDocuments = await SharedDocument.getSharedWithUser(userId, {
        limit: parseInt(limit),
        skip: parseInt(skip),
        unreadOnly: unreadOnly === 'true'
      });

      const unreadCount = await SharedDocument.countUnread(userId);

      const documents = sharedDocuments
        .filter(sd => sd.documentId)
        .map(sd => {
          const doc = sd.documentId.toObject();
          const sharedBy = sd.sharedByUserId || sd.sharedBy || null;
          return {
            ...doc,
            sharedBy: sharedBy,
            sharedAt: sd.createdAt,
            message: sd.message || '',
            isRead: sd.isRead || false,
            readAt: sd.readAt || null
          };
        });

      res.json({
        success: true,
        data: {
          documents,
          unreadCount,
          total: documents.length
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async markSharedDocumentAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const sharedDocument = await SharedDocument.markAsRead(id, userId);

      if (!sharedDocument) {
        return res.status(404).json({
          success: false,
          message: 'Documento compartido no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Documento marcado como leído',
        data: {
          sharedDocument
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Agregar documento a favoritos
  static async addToFavorites(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de documento inválido'
        });
      }

      // Verificar que el documento existe
      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      // Verificar si ya es favorito
      const existingFavorite = await Favorite.isFavorite(userId, id);
      if (existingFavorite) {
        return res.status(400).json({
          success: false,
          message: 'El documento ya está en tus favoritos'
        });
      }

      // Crear favorito
      const favorite = new Favorite({
        userId,
        documentId: id
      });
      await favorite.save();

      // Registrar en auditoría
      try {
        await AuditLog.createLog({
          userId: userId,
          actorId: userId,
          documentId: document._id,
          action: 'add_favorite',
          description: `Documento "${document.title}" agregado a favoritos`,
          comment: `Curso: ${document.course || 'N/A'}`
        });
      } catch (auditError) {
        console.error('Error registrando agregado a favoritos en auditoría:', auditError);
      }

      res.json({
        success: true,
        message: 'Documento agregado a favoritos',
        data: { favorite }
      });

    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'El documento ya está en tus favoritos'
        });
      }
      next(error);
    }
  }

  // Remover documento de favoritos
  static async removeFromFavorites(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de documento inválido'
        });
      }

      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      const favorite = await Favorite.findOneAndDelete({ userId, documentId: id });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'El documento no está en tus favoritos'
        });
      }

      // Registrar en auditoría
      try {
        await AuditLog.createLog({
          userId: userId,
          actorId: userId,
          documentId: document._id,
          action: 'remove_favorite',
          description: `Documento "${document.title}" removido de favoritos`,
          comment: `Curso: ${document.course || 'N/A'}`
        });
      } catch (auditError) {
        console.error('Error registrando remoción de favorito en auditoría:', auditError);
      }

      res.json({
        success: true,
        message: 'Documento removido de favoritos',
        data: { favorite }
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener documentos favoritos del usuario
  static async getFavoriteDocuments(req, res, next) {
    try {
      const userId = req.user.userId;
      const { limit = 50, skip = 0 } = req.query;

      const favorites = await Favorite.find({ userId })
        .populate({
          path: 'document',
          populate: {
            path: 'author',
            select: 'name career profilePicture'
          }
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      // Filtrar documentos que puedan haber sido eliminados
      const validFavorites = favorites.filter(fav => fav.document);
      const documents = validFavorites.map(fav => {
        const doc = fav.document.toObject();
        return {
          ...doc,
          favoritedAt: fav.createdAt
        };
      });

      const total = await Favorite.countDocuments({ userId });

      res.json({
        success: true,
        data: {
          documents,
          total,
          count: documents.length
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Verificar si un documento es favorito
  static async checkIsFavorite(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de documento inválido'
        });
      }

      const favorite = await Favorite.isFavorite(userId, id);

      res.json({
        success: true,
        data: {
          isFavorite: !!favorite
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = { DocumentController, upload }; 