# SafeDocs Backend

Backend de la aplicación SafeDocs, una plataforma para el intercambio seguro de documentos académicos.

## 🚀 Características

- **Autenticación JWT**: Sistema de autenticación seguro con tokens JWT
- **Gestión de documentos**: Subida, descarga y gestión de documentos académicos
- **Sistema de amigos**: Solicitudes de amistad y gestión de contactos
- **Validaciones robustas**: Validación de datos de entrada y archivos
- **Seguridad**: Rate limiting, CORS, Helmet y validaciones de seguridad
- **Base de datos MySQL**: Esquema optimizado con índices y procedimientos almacenados

## 📋 Requisitos

- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   cd safedocs-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Editar `.env` con tus configuraciones:
   ```env
   # Configuración del servidor
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:5173

   # Configuración de la base de datos
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=safedocs_user
   DB_PASSWORD=safedocs_password
   DB_NAME=safedocs_db

   # Configuración de JWT
   JWT_SECRET=tu_jwt_secret_super_seguro_aqui
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. **Configurar base de datos**
   ```bash
   # Crear usuario de base de datos
   mysql -u root -p
   CREATE USER 'safedocs_user'@'localhost' IDENTIFIED BY 'safedocs_password';
   GRANT ALL PRIVILEGES ON safedocs_db.* TO 'safedocs_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;

   # Ejecutar esquema de base de datos
   mysql -u safedocs_user -p < database/schema.sql
   ```

5. **Crear directorios de uploads**
   ```bash
   mkdir -p uploads/documents uploads/profiles
   ```

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📚 Estructura del Proyecto

```
safedocs-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de base de datos
│   │   └── config.js            # Configuración de la aplicación
│   ├── controllers/
│   │   ├── AuthController.js    # Controlador de autenticación
│   │   ├── DocumentController.js # Controlador de documentos
│   │   └── FriendsController.js  # Controlador de amigos
│   ├── middleware/
│   │   ├── auth.js             # Middleware de autenticación
│   │   └── validations.js      # Validaciones de datos
│   ├── models/
│   │   ├── User.js             # Modelo de usuario
│   │   └── Document.js         # Modelo de documento
│   ├── routes/
│   │   ├── auth.js             # Rutas de autenticación
│   │   ├── documents.js        # Rutas de documentos
│   │   └── friends.js          # Rutas de amigos
│   └── app.js                  # Aplicación Express
├── database/
│   └── schema.sql              # Esquema de base de datos
├── uploads/                    # Archivos subidos
├── server.js                   # Servidor principal
└── package.json
```

## 🔌 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh-token` - Renovar token

### Documentos
- `POST /api/documents/upload` - Subir documento
- `GET /api/documents` - Obtener todos los documentos
- `GET /api/documents/my-documents` - Documentos del usuario
- `GET /api/documents/:id` - Obtener documento por ID
- `GET /api/documents/:id/download` - Descargar documento
- `PUT /api/documents/:id` - Actualizar documento
- `DELETE /api/documents/:id` - Eliminar documento
- `GET /api/documents/popular/list` - Documentos populares
- `GET /api/documents/stats/overview` - Estadísticas

### Amigos
- `GET /api/friends` - Lista de amigos
- `GET /api/friends/search` - Buscar usuarios
- `POST /api/friends/request` - Enviar solicitud de amistad
- `GET /api/friends/requests/pending` - Solicitudes pendientes
- `POST /api/friends/requests/accept` - Aceptar solicitud
- `POST /api/friends/requests/reject` - Rechazar solicitud
- `DELETE /api/friends/remove` - Eliminar amigo
- `GET /api/friends/online` - Amigos en línea
- `GET /api/friends/suggestions` - Sugerencias de amigos

## 🔒 Seguridad

- **JWT Tokens**: Autenticación basada en tokens
- **Rate Limiting**: Límite de 100 requests por 15 minutos
- **CORS**: Configurado para el frontend
- **Helmet**: Headers de seguridad
- **Validaciones**: Validación de datos de entrada
- **Sanitización**: Limpieza de datos de entrada

## 📊 Base de Datos

### Tablas Principales
- `users` - Información de usuarios
- `documents` - Documentos subidos
- `friend_requests` - Solicitudes de amistad
- `friendships` - Relaciones de amistad
- `password_reset_tokens` - Tokens de restablecimiento
- `user_sessions` - Sesiones de usuario

### Índices Optimizados
- Índices en campos de búsqueda frecuente
- Índices full-text para búsquedas
- Índices en claves foráneas

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

## 📦 Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo
- `npm test` - Ejecutar tests
- `npm run lint` - Linting del código
- `npm run migrate` - Ejecutar migraciones

## 🔧 Configuración de Desarrollo

### Variables de Entorno
- `NODE_ENV`: Ambiente (development/production)
- `PORT`: Puerto del servidor
- `FRONTEND_URL`: URL del frontend
- `DB_HOST`: Host de la base de datos
- `DB_PORT`: Puerto de la base de datos
- `DB_USER`: Usuario de la base de datos
- `DB_PASSWORD`: Contraseña de la base de datos
- `DB_NAME`: Nombre de la base de datos
- `JWT_SECRET`: Secreto para JWT
- `JWT_EXPIRES_IN`: Expiración del token JWT
- `JWT_REFRESH_EXPIRES_IN`: Expiración del refresh token

## 🚀 Despliegue

### Docker
```bash
# Construir imagen
docker build -t safedocs-backend .

# Ejecutar contenedor
docker run -p 3000:3000 safedocs-backend
```

### PM2
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
pm2 start server.js --name "safedocs-backend"

# Monitorear
pm2 monit
```

## 📝 Logs

Los logs se guardan en:
- Desarrollo: Consola
- Producción: Archivos de log

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Para soporte técnico, contacta a:
- Email: soporte@safedocs.com
- GitHub Issues: [Crear issue](https://github.com/safedocs/backend/issues) 