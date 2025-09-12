const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

// Función para eliminar todos los usuarios
async function deleteAllUsers() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safedocs_db');
    console.log('✅ Conectado a MongoDB');

    // Contar usuarios existentes
    const userCount = await User.countDocuments();
    console.log(`📊 Total de usuarios encontrados: ${userCount}`);

    if (userCount === 0) {
      console.log('ℹ️ No hay usuarios para eliminar');
      return;
    }

    // Eliminar todos los usuarios
    const result = await User.deleteMany({});
    console.log(`🗑️ Usuarios eliminados: ${result.deletedCount}`);

    // Verificar que se eliminaron todos
    const remainingUsers = await User.countDocuments();
    console.log(`✅ Usuarios restantes: ${remainingUsers}`);

    if (remainingUsers === 0) {
      console.log('🎉 ¡Todos los usuarios han sido eliminados exitosamente!');
    } else {
      console.log('⚠️ Algunos usuarios no pudieron ser eliminados');
    }

  } catch (error) {
    console.error('❌ Error eliminando usuarios:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar script
if (require.main === module) {
  deleteAllUsers();
}

module.exports = deleteAllUsers;
