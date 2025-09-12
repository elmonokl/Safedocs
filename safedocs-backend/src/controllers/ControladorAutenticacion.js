const User = require('../models/User');
const jwt = require('jsonwebtoken');
// Validaciones ya son manejadas en rutas con handleValidationErrors

/**
 * Controlador de Autenticación
 * Gestiona registro, login, perfil, logout y verificación de token.
 * Las validaciones se realizan en rutas; los errores se delegan al middleware global.
 */
class AuthController {
  // Registro de usuario
  static async register(req, res, next) {
    try {

      const { name, email, password, career, role } = req.body;

      // Verificar si el email ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }

      // Validar correo institucional
      if (!email.endsWith('@unab.cl')) {
        return res.status(400).json({
          success: false,
          message: 'Debes usar un correo institucional (@unab.cl)'
        });
      }

      // Validar contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Validar rol
      const validRoles = ['student', 'professor', 'admin'];
      const userRole = role && validRoles.includes(role) ? role : 'student';

      // Crear usuario
      const userData = {
        name,
        email,
        password,
        career: career || 'Ingeniería en Computación e Informática',
        role: userRole
      };

      const newUser = await User.create(userData);

      // Generar token JWT
      const token = jwt.sign(
        { userId: newUser._id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Respuesta exitosa
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

  // Login de usuario
  static async login(req, res, next) {
    try {

      const { email, password } = req.body;

      // Buscar usuario por email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Actualizar último acceso
      await user.updateLastSeen();

      // Generar token JWT
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Respuesta exitosa
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

  // Obtener perfil del usuario actual
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

  // Actualizar perfil de usuario
  static async updateProfile(req, res, next) {
    try {

      const userId = req.user.userId;
      const { name, career, profilePicture } = req.body;

      // Validar que al menos un campo se actualice
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

  // Logout de usuario
  static async logout(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Marcar usuario como offline
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

  // Verificar token
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

  // Cambiar contraseña
  static async changePassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      // Buscar usuario
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await user.verifyPassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Actualizar contraseña
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

  // Solicitar restablecimiento de contraseña
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // Buscar usuario
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // En un entorno real, aquí enviarías un email con un token de restablecimiento
      // Por ahora, solo devolvemos un mensaje genérico
      res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });

    } catch (error) {
      next(error);
    }
  }

  // Restablecer contraseña
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      // En un entorno real, aquí verificarías el token y actualizarías la contraseña
      // Por ahora, solo devolvemos un mensaje genérico
      res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController; 