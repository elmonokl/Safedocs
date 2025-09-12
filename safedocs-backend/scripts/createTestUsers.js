const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

// Función para crear usuarios de prueba
async function createTestUsers() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safedocs');
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existen usuarios de prueba
    const existingTestUsers = await User.find({
      email: { 
        $in: [
          'estudiante1@unab.cl',
          'profesor2@unab.cl', 
          'admin3@unab.cl'
        ] 
      }
    });

    if (existingTestUsers.length > 0) {
      console.log('⚠️ Algunos usuarios de prueba ya existen:');
      existingTestUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - Rol: ${user.role}`);
      });
      console.log('\n¿Deseas continuar y crear los que faltan? (Ctrl+C para cancelar)');
      
      // Esperar 3 segundos para que el usuario pueda cancelar
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Datos de los usuarios de prueba
    const testUsers = [
      {
        name: 'Estudiante Prueba 1',
        email: 'estudiante1@unab.cl',
        password: 'Estudiante123!',
        career: 'Ingeniería en Computación e Informática',
        role: 'student'
      },
      {
        name: 'Profesor Prueba 2',
        email: 'profesor2@unab.cl',
        password: 'Profesor123!',
        career: 'Ingeniería en Computación e Informática',
        role: 'professor'
      },
      {
        name: 'Administrador Prueba 3',
        email: 'admin3@unab.cl',
        password: 'Admin123!',
        career: 'Administración del Sistema',
        role: 'admin'
      }
    ];

    console.log('\n🚀 Creando usuarios de prueba...\n');

    // Crear cada usuario
    for (const userData of testUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findByEmail(userData.email);
        
        if (existingUser) {
          console.log(`⚠️ Usuario ${userData.email} ya existe, actualizando rol...`);
          existingUser.role = userData.role;
          await existingUser.save();
          console.log(`✅ Usuario ${userData.name} actualizado con rol: ${userData.role}`);
        } else {
          // Crear nuevo usuario
          const newUser = new User(userData);
          await newUser.save();
          console.log(`✅ Usuario creado: ${newUser.name} (${newUser.email}) - Rol: ${newUser.role}`);
        }
      } catch (error) {
        console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
      }
    }

    // Mostrar resumen de usuarios creados
    console.log('\n📋 RESUMEN DE USUARIOS DE PRUEBA:');
    console.log('=====================================');
    
    const allTestUsers = await User.find({
      email: { 
        $in: [
          'estudiante1@unab.cl',
          'profesor2@unab.cl', 
          'admin3@unab.cl'
        ] 
      }
    }).select('name email role career');

    allTestUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Rol: ${user.role}`);
      console.log(`   🎓 Carrera: ${user.career}`);
      console.log(`   🔐 Contraseña: ${getPasswordByEmail(user.email)}`);
      console.log('');
    });

    console.log('🎯 INSTRUCCIONES DE PRUEBA:');
    console.log('============================');
    console.log('1. Inicia sesión con cada usuario para probar diferentes funcionalidades');
    console.log('2. El Estudiante solo puede ver y subir documentos');
    console.log('3. El Profesor puede gestionar documentos y ver estadísticas');
    console.log('4. El Administrador puede gestionar usuarios y documentos');
    console.log('5. Solo el Administrador verá la opción "Panel Admin" en el menú');
    console.log('6. Prueba cambiar roles entre usuarios desde el panel de administración');

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  }
}

// Función para obtener la contraseña según el email
function getPasswordByEmail(email) {
  const passwords = {
    'estudiante1@unab.cl': 'Estudiante123!',
    'profesor2@unab.cl': 'Profesor123!',
    'admin3@unab.cl': 'Admin123!'
  };
  return passwords[email] || 'No encontrada';
}

// Ejecutar script
if (require.main === module) {
  createTestUsers();
}

module.exports = createTestUsers;
