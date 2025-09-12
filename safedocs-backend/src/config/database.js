const mongoose = require('mongoose');
require('dotenv').config();

// Configuración de MongoDB
const MONGODB_URI = process.env.NODE_ENV === 'production' 
  ? process.env.MONGODB_URI_PROD 
  : process.env.MONGODB_URI || 'mongodb://localhost:27017/safedocs_db';

// Opciones de conexión (compatibles con Mongoose 8)
const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

// Función para conectar a MongoDB
const connect = async () => {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ Conexión a MongoDB establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    return false;
  }
};

// Función para desconectar de MongoDB
const disconnect = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error desconectando de MongoDB:', error.message);
  }
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Error de conexión Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose desconectado de MongoDB');
});

// Manejar cierre de la aplicación
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

module.exports = {
  connect,
  disconnect,
  connection: mongoose.connection
}; 