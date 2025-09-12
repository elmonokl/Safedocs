const mongoose = require('mongoose');
const createSuperAdmin = require('./createSuperAdmin');
const createTestUsers = require('./createTestUsers');
require('dotenv').config();

// Script completo para configurar el sistema
async function setupComplete() {
  try {
    console.log('🚀 INICIANDO CONFIGURACIÓN COMPLETA DEL SISTEMA SAFEDOCS');
    console.log('========================================================\n');

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safedocs');
    console.log('✅ Conectado a MongoDB\n');

    // Paso 1: Crear Super Administrador
    console.log('📋 PASO 1: Creando Super Administrador...');
    console.log('----------------------------------------');
    await createSuperAdmin();
    console.log('');

    // Paso 2: Crear Usuarios de Prueba
    console.log('📋 PASO 2: Creando Usuarios de Prueba...');
    console.log('----------------------------------------');
    await createTestUsers();
    console.log('');

    // Paso 3: Verificar configuración
    console.log('📋 PASO 3: Verificando Configuración...');
    console.log('----------------------------------------');
    
    const User = require('../src/models/User');
    
    // Contar usuarios por rol
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('👥 USUARIOS EN EL SISTEMA:');
    userCounts.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} usuarios`);
    });

    console.log('\n🎯 CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('==========================================');
    console.log('✅ Super Administrador creado');
    console.log('✅ Usuarios de prueba creados');
    console.log('✅ Sistema listo para usar');
    
    console.log('\n🔐 CREDENCIALES DE ACCESO:');
    console.log('============================');
    console.log('👑 SUPER ADMIN:');
    console.log('   Email: admin@safedocs.unab.cl');
    console.log('   Contraseña: Admin123!');
    console.log('');
    console.log('👨‍🎓 ESTUDIANTE:');
    console.log('   Email: estudiante1@unab.cl');
    console.log('   Contraseña: Estudiante123!');
    console.log('');
    console.log('👨‍🏫 PROFESOR:');
    console.log('   Email: profesor2@unab.cl');
    console.log('   Contraseña: Profesor123!');
    console.log('');
    console.log('🛡️ ADMINISTRADOR:');
    console.log('   Email: admin3@unab.cl');
    console.log('   Contraseña: Admin123!');

    console.log('\n🎮 CÓMO PROBAR EL SISTEMA:');
    console.log('============================');
    console.log('1. Inicia el backend: npm run dev');
    console.log('2. Inicia el frontend: npm run dev (en otra terminal)');
    console.log('3. Inicia sesión con cada usuario para probar diferentes funcionalidades');
    console.log('4. Solo los admins verán la opción "Panel Admin" en el menú');
    console.log('5. Prueba cambiar roles entre usuarios desde el panel de administración');

  } catch (error) {
    console.error('❌ Error en la configuración:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n🔌 Conexión a MongoDB cerrada');
    console.log('\n✨ ¡Sistema configurado y listo para usar!');
  }
}

// Ejecutar script
if (require.main === module) {
  setupComplete();
}

module.exports = setupComplete;
