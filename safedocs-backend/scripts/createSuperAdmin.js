const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
require('dotenv').config();

// Función para crear super administrador
async function createSuperAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safedocs');
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un super admin
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('⚠️ Ya existe un super administrador en el sistema');
      console.log(`Email: ${existingSuperAdmin.email}`);
      return;
    }

    // Datos del super administrador
    const superAdminData = {
      name: 'Super Administrador',
      email: 'admin@safedocs.unab.cl',
      password: 'Admin123!',
      career: 'Administración del Sistema',
      role: 'super_admin'
    };

    // Crear el super administrador
    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('✅ Super administrador creado exitosamente');
    console.log(`Nombre: ${superAdmin.name}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Rol: ${superAdmin.role}`);
    console.log(`Permisos: ${superAdmin.permissions.join(', ')}`);
    console.log('\n🔐 Credenciales de acceso:');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Contraseña: ${superAdminData.password}`);
    console.log('\n⚠️ IMPORTANTE: Cambia la contraseña después del primer inicio de sesión');

  } catch (error) {
    console.error('❌ Error creando super administrador:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar script
if (require.main === module) {
  createSuperAdmin();
}

module.exports = createSuperAdmin;
