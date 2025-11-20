const User = require('../models/User');
const Document = require('../models/Document');
const Friendship = require('../models/Friendship');
const FriendRequest = require('../models/FriendRequest');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

class AuthController {
  static async register(req, res, next) {
    try {

      const { name, email, password, career, role } = req.body;

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }

      if (!email.endsWith('@unab.cl')) {
        return res.status(400).json({
          success: false,
          message: 'Debes usar un correo institucional (@unab.cl)'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      const validRoles = ['student', 'professor', 'admin'];
      const userRole = role && validRoles.includes(role) ? role : 'student';

      const userData = {
        name,
        email,
        password,
        career: career || 'Ingeniería en Computación e Informática',
        role: userRole
      };

      const newUser = await User.create(userData);

      const token = jwt.sign(
        { userId: newUser._id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: newUser.toPublicJSON(),
          token
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {

      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      await user.updateLastSeen();

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: user.toPublicJSON(),
          token
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await User.findByIdPublic(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toPublicJSON()
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {

      const userId = req.user.userId;
      const { name, career, profilePicture } = req.body;

      if (!name && !career && !profilePicture) {
        return res.status(400).json({
          success: false,
          message: 'Debes proporcionar al menos un campo para actualizar'
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (career) updateData.career = career;
      if (profilePicture) updateData.profilePicture = profilePicture;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          user: updatedUser.toPublicJSON()
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const userId = req.user.userId;
      
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      res.json({
        success: true,
        message: 'Logout exitoso'
      });

    } catch (error) {
      next(error);
    }
  }

  static async verifyToken(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await User.findByIdPublic(userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toPublicJSON()
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const isValidPassword = await user.verifyPassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });

    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente'
      });

    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const { confirmation } = req.body;

      if (!confirmation || confirmation !== 'ELIMINAR') {
        return res.status(400).json({
          success: false,
          message: 'Debes escribir "ELIMINAR" en mayúsculas para confirmar la eliminación'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      await Promise.all([
        Friendship.deleteMany({
          $or: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }),
        FriendRequest.deleteMany({
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }),
        AuditLog.deleteMany({
          $or: [
            { userId: userId },
            { actorId: userId }
          ]
        })
      ]);

      const documents = await Document.find({ userId: userId });
      
      const deletePromises = documents.map(async (doc) => {
        try {
          if (doc.filePath) {
            await fs.unlink(doc.filePath).catch(() => {
              console.error(`Error eliminando archivo ${doc.filePath}`);
            });
          }
        } catch (error) {
          console.error(`Error eliminando archivo ${doc.filePath}:`, error);
        }
      });
      await Promise.all(deletePromises);

      await Document.deleteMany({ userId: userId });

      await User.findByIdAndDelete(userId);

      res.json({
        success: true,
        message: 'Cuenta eliminada exitosamente'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController; 