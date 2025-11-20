# Guía de Estudio - SafeDocs UNAB
## Documentación Completa del Sistema

---

## 📋 Índice

1. [Arquitectura General](#arquitectura-general)
2. [Backend - Estructura y Archivos](#backend---estructura-y-archivos)
3. [Frontend - Estructura y Componentes](#frontend---estructura-y-componentes)
4. [Flujo de Funcionamiento](#flujo-de-funcionamiento)
5. [Base de Datos](#base-de-datos)

---

## 🏗️ Arquitectura General

### Descripción del Sistema
SafeDocs UNAB es una plataforma web para el intercambio de documentos académicos entre estudiantes y profesores de la Universidad Andrés Bello. Permite subir, compartir, ver y descargar documentos de manera segura.

### Tecnologías Utilizadas
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, Vite, Framer Motion, Tailwind CSS
- **Autenticación**: JWT (JSON Web Tokens)
- **Almacenamiento**: Sistema de archivos local (Multer)

---

## 🔧 Backend - Estructura y Archivos

### 1. `server.js`
**Ubicación**: `safedocs-backend/server.js`

**Propósito**: Punto de entrada principal del servidor backend.

**Funciones**:
- Inicia el servidor Express
- Conecta a la base de datos MongoDB
- Configura el puerto de escucha
- Maneja errores de conexión

**Cómo funciona**:
1. Carga las variables de entorno (`.env`)
2. Conecta a MongoDB usando la URI configurada
3. Inicia el servidor en el puerto especificado (por defecto 3000)
4. Escucha las solicitudes HTTP entrantes

---

### 2. `app.js`
**Ubicación**: `safedocs-backend/src/app.js`

**Propósito**: Configuración principal de la aplicación Express.

**Funciones**:
- Configura middleware de seguridad (Helmet, CORS)
- Configura middleware de parsing (body-parser, multer)
- Define las rutas de la API
- Configura el manejo de errores global
- Sirve archivos estáticos (uploads)

**Middleware Configurado**:
- **Helmet**: Protección de cabeceras HTTP
- **CORS**: Control de acceso cross-origin
- **Morgan**: Logging de solicitudes HTTP
- **Body Parser**: Parsing de JSON y URL-encoded
- **Multer**: Manejo de archivos multipart/form-data

**Rutas Principales**:
- `/api/auth` - Autenticación de usuarios
- `/api/documents` - Gestión de documentos
- `/api/friends` - Gestión de amigos
- `/api/admin` - Panel de administración
- `/api/audit` - Registros de auditoría
- `/api/notifications` - Notificaciones

---

### 3. Controladores

#### 3.1. `ControladorAutenticacion.js`
**Ubicación**: `safedocs-backend/src/controllers/ControladorAutenticacion.js`

**Propósito**: Gestiona todas las operaciones de autenticación y gestión de usuarios.

**Funciones Principales**:

1. **register** - Registro de nuevos usuarios
   - Valida datos de entrada (nombre, email, contraseña, carrera)
   - Verifica que el email no esté en uso
   - Encripta la contraseña con bcrypt
   - Crea el usuario en la base de datos
   - Genera token JWT
   - Retorna usuario y token

2. **login** - Inicio de sesión
   - Valida credenciales (email y contraseña)
   - Verifica contraseña encriptada
   - Genera token JWT
   - Actualiza última conexión del usuario
   - Retorna usuario y token

3. **verify** - Verificación de token
   - Valida token JWT
   - Retorna información del usuario autenticado

4. **getProfile** - Obtener perfil del usuario
   - Retorna información completa del usuario autenticado

5. **updateProfile** - Actualizar perfil
   - Permite actualizar nombre, carrera, avatar
   - Valida datos de entrada
   - Actualiza en base de datos

6. **changePassword** - Cambiar contraseña
   - Valida contraseña actual
   - Encripta nueva contraseña
   - Actualiza en base de datos

7. **deleteAccount** - Eliminar cuenta
   - Valida confirmación
   - Elimina usuario y todos sus datos asociados
   - Limpia documentos, amigos, notificaciones

8. **logout** - Cerrar sesión
   - Actualiza última conexión
   - Invalida token (opcional)

---

#### 3.2. `DocumentController.js`
**Ubicación**: `safedocs-backend/src/controllers/DocumentController.js`

**Propósito**: Gestiona todas las operaciones relacionadas con documentos.

**Funciones Principales**:

1. **upload** - Subir documento
   - Recibe archivo mediante Multer
   - Valida tipo y tamaño de archivo
   - Guarda archivo en sistema de archivos
   - Crea registro en base de datos
   - Registra acción en auditoría
   - Notifica a amigos (opcional)

2. **getMyDocuments** - Obtener documentos del usuario
   - Lista todos los documentos del usuario autenticado
   - Filtra por categoría, curso (opcional)
   - Ordena por fecha de creación

3. **getDocument** - Obtener documento específico
   - Retorna información del documento
   - Registra visualización en auditoría
   - Verifica permisos de acceso

4. **updateDocument** - Actualizar documento
   - Permite actualizar título, descripción, categoría, curso
   - Valida datos de entrada
   - Actualiza en base de datos
   - Registra acción en auditoría

5. **deleteDocument** - Eliminar documento
   - Elimina archivo del sistema de archivos
   - Elimina registro de base de datos
   - Elimina compartidos asociados
   - Registra acción en auditoría

6. **downloadDocument** - Descargar documento
   - Verifica permisos de acceso
   - Retorna archivo para descarga
   - Registra descarga en auditoría
   - Incrementa contador de descargas

7. **shareDocument** - Compartir documento
   - Genera link de compartir único
   - Permite compartir con amigos específicos
   - Crea registros de compartido
   - Envía notificaciones

8. **getSharedWithMe** - Obtener documentos compartidos
   - Lista documentos compartidos con el usuario
   - Incluye información del usuario que compartió
   - Marca documentos como leídos

9. **uploadOfficial** - Subir documento oficial (profesores)
   - Similar a upload pero para documentos oficiales
   - Solo accesible para profesores
   - Notifica a todos los estudiantes

10. **getOfficialDocuments** - Obtener documentos oficiales
    - Lista todos los documentos oficiales
    - Filtra por profesor, categoría, curso
    - Permite búsqueda por título

---

#### 3.3. `FriendsController.js`
**Ubicación**: `safedocs-backend/src/controllers/FriendsController.js`

**Propósito**: Gestiona las relaciones de amistad entre usuarios.

**Funciones Principales**:

1. **getFriends** - Obtener lista de amigos
   - Retorna todos los amigos del usuario
   - Incluye información básica de cada amigo
   - Muestra estado en línea

2. **searchUsers** - Buscar usuarios
   - Busca usuarios por nombre o email
   - Excluye al usuario actual y amigos existentes
   - Retorna resultados limitados

3. **sendFriendRequest** - Enviar solicitud de amistad
   - Crea solicitud de amistad
   - Envía notificación al usuario receptor
   - Valida que no exista solicitud previa

4. **getPendingRequests** - Obtener solicitudes pendientes
   - Lista solicitudes recibidas pendientes
   - Incluye información del remitente

5. **acceptFriendRequest** - Aceptar solicitud
   - Crea relación de amistad
   - Elimina solicitud
   - Envía notificación de confirmación

6. **rejectFriendRequest** - Rechazar solicitud
   - Elimina solicitud
   - Opcional: envía notificación

7. **removeFriend** - Eliminar amigo
   - Elimina relación de amistad
   - Elimina solicitudes asociadas

8. **getSuggestions** - Obtener sugerencias de amigos
   - Sugiere usuarios con intereses similares
   - Basado en carrera, cursos comunes
   - Excluye amigos existentes

---

#### 3.4. `NotificationController.js`
**Ubicación**: `safedocs-backend/src/controllers/NotificationController.js`

**Propósito**: Gestiona las notificaciones del sistema.

**Funciones Principales**:

1. **getNotifications** - Obtener notificaciones
   - Lista notificaciones del usuario
   - Filtra por no leídas (opcional)
   - Ordena por fecha (más recientes primero)
   - Paginación

2. **markAsRead** - Marcar como leída
   - Marca notificación como leída
   - Actualiza timestamp de lectura

3. **markAllAsRead** - Marcar todas como leídas
   - Marca todas las notificaciones como leídas
   - Actualiza en lote

4. **deleteNotification** - Eliminar notificación
   - Elimina notificación específica

**Tipos de Notificaciones**:
- Solicitud de amistad recibida
- Solicitud de amistad aceptada
- Documento compartido
- Documento oficial subido
- Comentario en documento

---

#### 3.5. `AuditController.js`
**Ubicación**: `safedocs-backend/src/controllers/AuditController.js`

**Propósito**: Gestiona los registros de auditoría del sistema.

**Funciones Principales**:

1. **getAllAuditLogs** - Obtener todos los registros
   - Lista todos los registros de auditoría
   - Filtra por acción, usuario, documento
   - Paginación
   - Solo accesible para administradores

2. **getAuditStats** - Obtener estadísticas
   - Retorna estadísticas agregadas
   - Contador de acciones por tipo
   - Contador por usuario
   - Contador por documento

3. **getUserAuditLogs** - Obtener registros del usuario
   - Lista registros del usuario autenticado
   - Filtra por acción
   - Paginación

4. **getDocumentViews** - Obtener visualizaciones de documento
   - Lista quién vio un documento
   - Incluye información del visualizador
   - Ordena por fecha de visualización

**Acciones Registradas**:
- Upload (subir documento)
- Delete (eliminar documento)
- Download (descargar documento)
- View (visualizar documento)
- Update (actualizar documento)
- Share (compartir documento)

---

#### 3.6. `AdminController.js`
**Ubicación**: `safedocs-backend/src/controllers/AdminController.js`

**Propósito**: Gestiona las operaciones de administración del sistema.

**Funciones Principales**:

1. **getAllUsers** - Obtener todos los usuarios
   - Lista todos los usuarios del sistema
   - Filtra por rol, estado
   - Paginación
   - Solo accesible para administradores

2. **updateUserRole** - Actualizar rol de usuario
   - Cambia el rol de un usuario
   - Valida permisos
   - Actualiza en base de datos

3. **deleteUser** - Eliminar usuario
   - Elimina usuario y todos sus datos
   - Solo accesible para super administradores

4. **getReportedDocuments** - Obtener documentos reportados
   - Lista documentos reportados por usuarios
   - Incluye motivo del reporte
   - Permite moderación

5. **getSystemStats** - Obtener estadísticas del sistema
   - Contador de usuarios por rol
   - Contador de documentos
   - Contador de compartidos
   - Contador de visualizaciones

---

### 4. Middleware

#### 4.1. `auth.js`
**Ubicación**: `safedocs-backend/src/middleware/auth.js`

**Propósito**: Middleware de autenticación y autorización.

**Funciones**:

1. **authenticateToken** - Autenticar token JWT
   - Extrae token del header Authorization
   - Verifica y decodifica token JWT
   - Valida que el usuario exista
   - Agrega información del usuario a `req.user`
   - Actualiza última conexión

2. **optionalAuth** - Autenticación opcional
   - Similar a authenticateToken pero no requiere token
   - Útil para rutas públicas con funcionalidades opcionales

3. **requireRole** - Requerir rol específico
   - Valida que el usuario tenga un rol específico
   - Usado para rutas de administradores o profesores

4. **rateLimit** - Limitar tasa de solicitudes
   - Previene abuso de API
   - Limita número de solicitudes por IP
   - Configurable por ruta

---

#### 4.2. `validations.js`
**Ubicación**: `safedocs-backend/src/middleware/validations.js`

**Propósito**: Validaciones de datos de entrada usando express-validator.

**Validaciones Incluidas**:

1. **authValidations** - Validaciones de autenticación
   - Email válido
   - Contraseña segura (mínimo 8 caracteres)
   - Nombre no vacío
   - Carrera válida

2. **documentValidations** - Validaciones de documentos
   - Título no vacío
   - Categoría válida
   - Curso no vacío
   - Descripción opcional

3. **friendsValidations** - Validaciones de amigos
   - Búsqueda mínimo 2 caracteres
   - ID de usuario válido

---

#### 4.3. `upload.js`
**Ubicación**: `safedocs-backend/src/middleware/upload.js`

**Propósito**: Configuración de Multer para manejo de archivos.

**Configuración**:

1. **Storage** - Almacenamiento de archivos
   - Define directorio de destino
   - Genera nombres únicos para archivos
   - Organiza por tipo de documento

2. **File Filter** - Filtro de archivos
   - Valida tipos de archivo permitidos
   - Rechaza archivos no permitidos
   - Tipos permitidos: PDF, DOC, DOCX, TXT, PPT, PPTX

3. **Limits** - Límites de tamaño
   - Tamaño máximo: 50MB
   - Configurable mediante variables de entorno

**Funciones**:
- `uploadDocument` - Middleware para subir documentos
- `uploadProfilePicture` - Middleware para subir foto de perfil

---

### 5. Modelos

#### 5.1. `User.js`
**Ubicación**: `safedocs-backend/src/models/User.js`

**Propósito**: Modelo de datos para usuarios.

**Campos**:
- `name` - Nombre del usuario (requerido)
- `email` - Email del usuario (único, requerido)
- `password` - Contraseña encriptada (requerido)
- `career` - Carrera del usuario (requerido)
- `role` - Rol del usuario (student, professor, admin, super_admin)
- `avatar` - URL de foto de perfil
- `lastSeen` - Última conexión
- `isOnline` - Estado en línea
- `permissions` - Array de permisos

**Métodos Estáticos**:
- `findByEmail` - Buscar usuario por email
- `findByRole` - Buscar usuarios por rol
- `hashPassword` - Encriptar contraseña
- `comparePassword` - Comparar contraseña

**Métodos de Instancia**:
- `save` - Guardar usuario (encripta contraseña automáticamente)
- `toJSON` - Excluir contraseña al serializar

---

#### 5.2. `Document.js`
**Ubicación**: `safedocs-backend/src/models/Document.js`

**Propósito**: Modelo de datos para documentos.

**Campos**:
- `title` - Título del documento (requerido)
- `description` - Descripción del documento
- `category` - Categoría (academic, research, project, other)
- `course` - Curso asociado (requerido)
- `fileName` - Nombre del archivo
- `filePath` - Ruta del archivo en el servidor
- `fileSize` - Tamaño del archivo en bytes
- `fileType` - Tipo MIME del archivo
- `author` - Referencia al usuario autor
- `isOfficial` - Si es documento oficial (profesor)
- `downloadsCount` - Contador de descargas
- `viewsCount` - Contador de visualizaciones
- `sharedWith` - Array de usuarios con quienes se compartió

**Índices**:
- Índice en `author` para búsquedas rápidas
- Índice en `category` para filtrado
- Índice en `course` para búsquedas por curso

---

#### 5.3. `Friendship.js`
**Ubicación**: `safedocs-backend/src/models/Friendship.js`

**Propósito**: Modelo de datos para relaciones de amistad.

**Campos**:
- `user1Id` - ID del primer usuario
- `user2Id` - ID del segundo usuario
- `status` - Estado de la amistad (pending, accepted, rejected)
- `createdAt` - Fecha de creación
- `acceptedAt` - Fecha de aceptación

**Métodos Estáticos**:
- `getFriends` - Obtener amigos de un usuario
- `areFriends` - Verificar si dos usuarios son amigos
- `getFriendRequest` - Obtener solicitud de amistad

---

#### 5.4. `Notification.js`
**Ubicación**: `safedocs-backend/src/models/Notification.js`

**Propósito**: Modelo de datos para notificaciones.

**Campos**:
- `userId` - ID del usuario receptor
- `type` - Tipo de notificación
- `title` - Título de la notificación
- `message` - Mensaje de la notificación
- `relatedUserId` - ID del usuario relacionado (opcional)
- `relatedDocumentId` - ID del documento relacionado (opcional)
- `isRead` - Si la notificación fue leída
- `readAt` - Fecha de lectura

**Tipos de Notificación**:
- `friend_request` - Solicitud de amistad
- `friend_accepted` - Amistad aceptada
- `document_shared` - Documento compartido
- `official_document` - Documento oficial subido

---

#### 5.5. `AuditLog.js`
**Ubicación**: `safedocs-backend/src/models/AuditLog.js`

**Propósito**: Modelo de datos para registros de auditoría.

**Campos**:
- `action` - Acción realizada
- `actorId` - ID del usuario que realizó la acción
- `documentId` - ID del documento (opcional)
- `targetUserId` - ID del usuario objetivo (opcional)
- `description` - Descripción de la acción
- `ipAddress` - Dirección IP
- `userAgent` - User Agent del navegador
- `metadata` - Datos adicionales (JSON)

**Acciones Registradas**:
- `upload` - Subir documento
- `delete` - Eliminar documento
- `download` - Descargar documento
- `view` - Visualizar documento
- `update` - Actualizar documento
- `share` - Compartir documento

---

### 6. Rutas

#### 6.1. `auth.js`
**Ubicación**: `safedocs-backend/src/routes/auth.js`

**Propósito**: Define las rutas de autenticación.

**Rutas**:
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/verify` - Verificar token
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `PUT /api/auth/password` - Cambiar contraseña
- `DELETE /api/auth/account` - Eliminar cuenta
- `POST /api/auth/logout` - Cerrar sesión

---

#### 6.2. `documents.js`
**Ubicación**: `safedocs-backend/src/routes/documents.js`

**Propósito**: Define las rutas de documentos.

**Rutas**:
- `POST /api/documents/upload` - Subir documento
- `GET /api/documents/my-documents` - Obtener mis documentos
- `GET /api/documents/:id` - Obtener documento específico
- `PUT /api/documents/:id` - Actualizar documento
- `DELETE /api/documents/:id` - Eliminar documento
- `GET /api/documents/:id/download` - Descargar documento
- `POST /api/documents/:id/share` - Compartir documento
- `GET /api/documents/shared-with-me` - Obtener documentos compartidos
- `POST /api/documents/official/upload` - Subir documento oficial
- `GET /api/documents/official` - Obtener documentos oficiales
- `GET /api/documents/official/:id` - Obtener documento oficial específico
- `GET /api/documents/official/:id/download` - Descargar documento oficial

---

#### 6.3. `friends.js`
**Ubicación**: `safedocs-backend/src/routes/friends.js`

**Propósito**: Define las rutas de amigos.

**Rutas**:
- `GET /api/friends` - Obtener lista de amigos
- `GET /api/friends/search` - Buscar usuarios
- `POST /api/friends/request` - Enviar solicitud de amistad
- `GET /api/friends/requests/pending` - Obtener solicitudes pendientes
- `POST /api/friends/requests/accept` - Aceptar solicitud
- `POST /api/friends/requests/reject` - Rechazar solicitud
- `DELETE /api/friends/remove` - Eliminar amigo
- `GET /api/friends/suggestions` - Obtener sugerencias de amigos

---

#### 6.4. `notifications.js`
**Ubicación**: `safedocs-backend/src/routes/notifications.js`

**Propósito**: Define las rutas de notificaciones.

**Rutas**:
- `GET /api/notifications` - Obtener notificaciones
- `PATCH /api/notifications/:id/read` - Marcar como leída
- `PATCH /api/notifications/read-all` - Marcar todas como leídas
- `DELETE /api/notifications/:id` - Eliminar notificación

---

#### 6.5. `audit.js`
**Ubicación**: `safedocs-backend/src/routes/audit.js`

**Propósito**: Define las rutas de auditoría.

**Rutas**:
- `GET /api/audit/logs` - Obtener todos los registros (admin)
- `GET /api/audit/stats` - Obtener estadísticas (admin)
- `GET /api/audit/user` - Obtener registros del usuario
- `GET /api/audit/views` - Obtener visualizaciones de documentos

---

#### 6.6. `admin.js`
**Ubicación**: `safedocs-backend/src/routes/admin.js`

**Propósito**: Define las rutas de administración.

**Rutas**:
- `GET /api/admin/users` - Obtener todos los usuarios (admin)
- `PUT /api/admin/users/:id/role` - Actualizar rol de usuario (admin)
- `DELETE /api/admin/users/:id` - Eliminar usuario (super_admin)
- `GET /api/admin/documents/reported` - Obtener documentos reportados (admin)
- `GET /api/admin/stats` - Obtener estadísticas del sistema (admin)

---

## 🎨 Frontend - Estructura y Componentes

### 1. `App.jsx`
**Ubicación**: `safedocs-frontend/src/App.jsx`

**Propósito**: Componente principal de la aplicación React.

**Funciones**:
- Configura el enrutamiento de la aplicación
- Gestiona el estado global (toast, confirm dialogs)
- Proporciona contextos a los componentes hijos
- Maneja la navegación entre vistas

**Vistas Principales**:
- Landing page (no autenticado)
- Dashboard (autenticado)
- Login/Register
- Panel Admin
- Vista de Auditoría

**Contextos Proporcionados**:
- `AuthProvider` - Autenticación
- `ThemeProvider` - Tema (modo oscuro/claro)
- `DocumentProvider` - Gestión de documentos

---

### 2. Contextos

#### 2.1. `AuthContext.jsx`
**Ubicación**: `safedocs-frontend/src/contexts/AuthContext.jsx`

**Propósito**: Gestiona el estado de autenticación del usuario.

**Estado**:
- `user` - Usuario actual
- `loading` - Estado de carga
- `error` - Mensajes de error

**Funciones**:
- `login` - Iniciar sesión
- `register` - Registrarse
- `logout` - Cerrar sesión
- `updateProfile` - Actualizar perfil
- `deleteAccount` - Eliminar cuenta
- `clearError` - Limpiar errores

**Cómo funciona**:
1. Al montar, verifica si hay un token guardado
2. Si hay token, valida con el backend
3. Si es válido, carga la información del usuario
4. Proporciona funciones para autenticación a los componentes

---

#### 2.2. `DocumentContext.jsx`
**Ubicación**: `safedocs-frontend/src/contexts/DocumentContext.jsx`

**Propósito**: Gestiona el estado de los documentos del usuario.

**Estado**:
- `documents` - Lista de documentos
- `loading` - Estado de carga
- `error` - Mensajes de error
- `searchTerm` - Término de búsqueda
- `filterCategory` - Filtro por categoría
- `sortBy` - Ordenamiento

**Funciones**:
- `loadDocuments` - Cargar documentos
- `uploadDocument` - Subir documento
- `updateDocument` - Actualizar documento
- `deleteDocument` - Eliminar documento
- `getDocumentById` - Obtener documento por ID
- `downloadDocument` - Descargar documento
- `generateShareLink` - Generar link de compartir

**Cómo funciona**:
1. Carga documentos del usuario al montar
2. Proporciona funciones CRUD para documentos
3. Mantiene el estado sincronizado con el backend
4. Mapea categorías del backend al frontend

---

#### 2.3. `ThemeContext.jsx`
**Ubicación**: `safedocs-frontend/src/contexts/ThemeContext.jsx`

**Propósito**: Gestiona el tema de la aplicación (modo oscuro/claro).

**Estado**:
- `dark` - Modo oscuro activado
- `sidebarColor` - Color de la barra lateral

**Funciones**:
- `toggleDark` - Alternar modo oscuro
- `setSidebarColor` - Cambiar color de la barra lateral

**Cómo funciona**:
1. Lee preferencias guardadas en localStorage
2. Aplica clases de Tailwind según el modo
3. Guarda preferencias en localStorage

---

### 3. Componentes Principales

#### 3.1. `Dashboard.jsx`
**Ubicación**: `safedocs-frontend/src/components/Dashboard.jsx`

**Propósito**: Componente principal del dashboard del usuario.

**Funciones**:
- Muestra formulario de subida de documentos
- Lista documentos del usuario
- Permite búsqueda y filtrado
- Maneja drag & drop de archivos
- Valida archivos antes de subir

**Características**:
- Drag & drop para subir archivos
- Validación de tipo y tamaño de archivo
- Preview de archivos seleccionados
- Formulario de metadatos (título, descripción, categoría, curso)
- Lista de documentos con opciones de acción

---

#### 3.2. `Sidebar.jsx`
**Ubicación**: `safedocs-frontend/src/components/Sidebar.jsx`

**Propósito**: Barra lateral de navegación.

**Funciones**:
- Navegación entre secciones
- Toggle de modo oscuro
- Información del usuario
- Logout
- Acceso rápido a funcionalidades

**Elementos**:
- Logo/Nombre de la aplicación
- Información del usuario (nombre, avatar)
- Enlaces de navegación
- Toggle de modo oscuro
- Botón de logout
- Menu hamburguesa (móvil)

---

#### 3.3. `MenuHamburguesa.jsx`
**Ubicación**: `safedocs-frontend/src/components/MenuHamburguesa.jsx`

**Propósito**: Menú hamburguesa para dispositivos móviles.

**Funciones**:
- Navegación móvil
- Acceso a perfil, amigos, documentos oficiales
- Acceso a panel admin (si es admin)
- Acceso a auditoría
- Opción de eliminar cuenta

**Elementos**:
- Perfil
- Amigos
- Documentos oficiales
- Panel Admin (solo admins)
- Auditoría
- Eliminar cuenta
- Logout

---

#### 3.4. `Notifications.jsx`
**Ubicación**: `safedocs-frontend/src/components/Notifications.jsx`

**Propósito**: Componente de notificaciones.

**Funciones**:
- Muestra notificaciones del usuario
- Marca notificaciones como leídas
- Elimina notificaciones
- Muestra contador de no leídas
- Auto-refresh periódico

**Características**:
- Dropdown de notificaciones
- Badge con contador de no leídas
- Lista de notificaciones con tipo e icono
- Acciones: marcar como leída, eliminar
- Link a contenido relacionado

---

### 4. Componentes de Documentos

#### 4.1. `MisDocumentosModal.jsx`
**Ubicación**: `safedocs-frontend/src/components/MisDocumentosModal.jsx`

**Propósito**: Modal que muestra todos los documentos del usuario.

**Funciones**:
- Lista todos los documentos del usuario
- Permite compartir documentos
- Permite editar documentos
- Permite eliminar documentos
- Permite ver detalles del documento

**Características**:
- Lista de documentos con información básica
- Botones de acción (compartir, editar, eliminar, ver)
- Búsqueda y filtrado
- Paginación (opcional)

---

#### 4.2. `EditDocumentModal.jsx`
**Ubicación**: `safedocs-frontend/src/components/EditDocumentModal.jsx`

**Propósito**: Modal para editar un documento.

**Funciones**:
- Permite editar título, descripción, categoría, curso
- Valida datos de entrada
- Actualiza documento en el backend
- Cierra modal y actualiza lista

**Campos Editables**:
- Título
- Descripción
- Categoría
- Curso

---

#### 4.3. `ShareQRModal.jsx`
**Ubicación**: `safedocs-frontend/src/components/ShareQRModal.jsx`

**Propósito**: Modal para compartir documentos.

**Funciones**:
- Genera código QR del link de compartir
- Permite copiar link al portapapeles
- Permite compartir con amigos específicos
- Muestra link de compartir

**Características**:
- Generación de código QR
- Copiar link al portapapeles
- Selección de amigos para compartir
- Envío de notificaciones a amigos

---

#### 4.4. `VistaDocumentosCompartidos.jsx`
**Ubicación**: `safedocs-frontend/src/components/VistaDocumentosCompartidos.jsx`

**Propósito**: Vista de documentos compartidos con el usuario.

**Funciones**:
- Lista documentos compartidos con el usuario
- Permite ver documentos compartidos
- Permite descargar documentos compartidos
- Marca documentos como leídos
- Muestra contador de no leídos

**Características**:
- Lista de documentos compartidos
- Información del usuario que compartió
- Indicador de no leídos
- Búsqueda y filtrado
- Acciones: ver, descargar

---

#### 4.5. `VistaDocumentosOficiales.jsx`
**Ubicación**: `safedocs-frontend/src/components/VistaDocumentosOficiales.jsx`

**Propósito**: Vista de documentos oficiales (subidos por profesores).

**Funciones**:
- Lista documentos oficiales
- Permite ver documentos oficiales
- Permite descargar documentos oficiales
- Filtra por profesor, categoría, curso
- Búsqueda por título

**Características**:
- Lista de documentos oficiales
- Información del profesor que subió
- Filtros por profesor, categoría, curso
- Búsqueda por título
- Acciones: ver, descargar

---

#### 4.6. `SubirDocumentoOficial.jsx`
**Ubicación**: `safedocs-frontend/src/components/SubirDocumentoOficial.jsx`

**Propósito**: Formulario para que profesores suban documentos oficiales.

**Funciones**:
- Permite a profesores subir documentos oficiales
- Valida tipo y tamaño de archivo
- Envía notificaciones a estudiantes
- Similar a Dashboard pero para documentos oficiales

**Características**:
- Solo accesible para profesores
- Drag & drop para subir archivos
- Validación de archivos
- Formulario de metadatos
- Envío de notificaciones

---

### 5. Componentes de Usuario

#### 5.1. `VistaPerfil.jsx`
**Ubicación**: `safedocs-frontend/src/components/VistaPerfil.jsx`

**Propósito**: Vista de perfil del usuario.

**Funciones**:
- Muestra información del usuario
- Permite editar perfil
- Muestra avatar, nombre, email, carrera, rol
- Guarda cambios en el backend

**Características**:
- Información del usuario
- Modo de edición
- Validación de datos
- Actualización de perfil
- Visualización de rol

---

#### 5.2. `VistaAmigos.jsx`
**Ubicación**: `safedocs-frontend/src/components/VistaAmigos.jsx`

**Propósito**: Vista de gestión de amigos.

**Funciones**:
- Lista amigos del usuario
- Muestra solicitudes pendientes
- Permite aceptar/rechazar solicitudes
- Permite eliminar amigos
- Permite agregar nuevos amigos

**Características**:
- Lista de amigos
- Lista de solicitudes pendientes
- Acciones: aceptar, rechazar, eliminar
- Modal para agregar amigos
- Perfil de amigos

---

#### 5.3. `AddFriendModal.jsx`
**Ubicación**: `safedocs-frontend/src/components/AddFriendModal.jsx`

**Propósito**: Modal para agregar amigos.

**Funciones**:
- Busca usuarios por nombre o email
- Muestra sugerencias de amigos
- Envía solicitudes de amistad
- Muestra resultados de búsqueda

**Características**:
- Búsqueda de usuarios
- Sugerencias de amigos
- Envío de solicitudes
- Resultados de búsqueda
- Debounce en búsqueda

---

#### 5.4. `FriendProfileModal.jsx`
**Ubicación**: `safedocs-frontend/src/components/FriendProfileModal.jsx`

**Propósito**: Modal con perfil de un amigo.

**Funciones**:
- Muestra información del amigo
- Permite eliminar amigo
- Muestra estado en línea
- Muestra última conexión

**Características**:
- Información del amigo
- Avatar, nombre, email, carrera
- Estado en línea
- Última conexión
- Botón para eliminar amigo

---

### 6. Componentes de Administración

#### 6.1. `PanelAdmin.jsx`
**Ubicación**: `safedocs-frontend/src/components/PanelAdmin.jsx`

**Propósito**: Panel de administración del sistema.

**Funciones**:
- Gestiona usuarios (lista, editar, eliminar)
- Gestiona documentos reportados
- Muestra estadísticas del sistema
- Cambia roles de usuarios
- Solo accesible para administradores

**Características**:
- Tabs para diferentes secciones
- Lista de usuarios con filtros
- Lista de documentos reportados
- Estadísticas del sistema
- Acciones: editar rol, eliminar usuario

---

#### 6.2. `VistaAuditoria.jsx`
**Ubicación**: `safedocs-frontend/src/components/VistaAuditoria.jsx`

**Propósito**: Vista de registros de auditoría.

**Funciones**:
- Muestra todos los registros de auditoría
- Filtra por acción, usuario, documento
- Muestra estadísticas
- Paginación de registros

**Características**:
- Lista de registros de auditoría
- Filtros por acción, usuario, documento
- Estadísticas agregadas
- Paginación
- Información detallada de cada acción

---

#### 6.3. `VistaVistos.jsx`
**Ubicación**: `safedocs-frontend/src/components/VistaVistos.jsx`

**Propósito**: Vista de quién vio los documentos del usuario.

**Funciones**:
- Muestra quién vio cada documento
- Filtra por período de tiempo
- Muestra información del visualizador
- Agrupa por documento

**Características**:
- Lista de documentos con visualizaciones
- Información del visualizador
- Filtro por período (7, 30, 60, 90 días)
- Agrupación por documento
- Expansión/colapso de documentos

---

### 7. Componentes Auxiliares

#### 7.1. `Hero.jsx`
**Ubicación**: `safedocs-frontend/src/components/Hero.jsx`

**Propósito**: Sección hero de la página de inicio.

**Funciones**:
- Muestra título y descripción de la aplicación
- Botones de registro/login
- Animaciones de fondo
- Call to action

**Características**:
- Título y descripción
- Botones de acción
- Animaciones
- Diseño atractivo

---

#### 7.2. `Toast.jsx`
**Ubicación**: `safedocs-frontend/src/components/Toast.jsx`

**Propósito**: Componente de notificaciones toast.

**Funciones**:
- Muestra notificaciones temporales
- Auto-cierre después de un tiempo
- Diferentes tipos (success, error, warning)
- Animaciones de entrada/salida

**Características**:
- Tipos: success, error, warning
- Auto-cierre configurable
- Animaciones
- Iconos según tipo

---

#### 7.3. `ConfirmDialog.jsx`
**Ubicación**: `safedocs-frontend/src/components/ConfirmDialog.jsx`

**Propósito**: Diálogo de confirmación.

**Funciones**:
- Muestra diálogo de confirmación
- Diferentes tipos (warning, danger, info)
- Botones de confirmar/cancelar
- Callback de confirmación

**Características**:
- Tipos: warning, danger, info
- Botones de acción
- Animaciones
- Callback de confirmación

---

#### 7.4. `DeleteAccountModal.jsx`
**Ubicación**: `safedocs-frontend/src/components/DeleteAccountModal.jsx`

**Propósito**: Modal para eliminar cuenta.

**Funciones**:
- Muestra advertencia de eliminación
- Requiere confirmación escrita
- Elimina cuenta del usuario
- Limpia datos locales

**Características**:
- Advertencia de eliminación
- Confirmación escrita (ELIMINAR)
- Validación de confirmación
- Eliminación de cuenta

---

#### 7.5. `LoadingSpinner.jsx`
**Ubicación**: `safedocs-frontend/src/components/LoadingSpinner.jsx`

**Propósito**: Componente de carga.

**Funciones**:
- Muestra spinner de carga
- Diferentes tamaños
- Texto opcional
- Animaciones

**Características**:
- Tamaños: sm, md, lg, xl
- Texto opcional
- Animaciones
- Diseño consistente

---

#### 7.6. `ModalDocumento.jsx`
**Ubicación**: `safedocs-frontend/src/components/ModalDocumento.jsx`

**Propósito**: Modal con detalles de un documento.

**Funciones**:
- Muestra información del documento
- Permite descargar documento
- Permite editar documento
- Permite eliminar documento
- Permite compartir documento

**Características**:
- Información completa del documento
- Acciones: descargar, editar, eliminar, compartir
- Animaciones
- Diseño atractivo

---

### 8. Utilidades

#### 8.1. `api.js`
**Ubicación**: `safedocs-frontend/src/utils/api.js`

**Propósito**: Utilidad para realizar peticiones HTTP al backend.

**Funciones**:
- `apiFetch` - Función principal para peticiones HTTP
- Maneja autenticación automática
- Maneja errores de red
- Maneja rate limiting
- Configura headers automáticamente

**Características**:
- Autenticación automática con JWT
- Manejo de errores
- Soporte para FormData y JSON
- Rate limiting
- Configuración de base URL

---

## 🔄 Flujo de Funcionamiento

### 1. Flujo de Autenticación

1. Usuario ingresa email y contraseña
2. Frontend envía petición POST a `/api/auth/login`
3. Backend valida credenciales
4. Backend genera token JWT
5. Backend retorna token y usuario
6. Frontend guarda token en localStorage
7. Frontend guarda usuario en estado
8. Frontend redirige al dashboard

### 2. Flujo de Subida de Documento

1. Usuario selecciona archivo (drag & drop o input)
2. Frontend valida tipo y tamaño de archivo
3. Usuario completa formulario (título, descripción, categoría, curso)
4. Frontend crea FormData con archivo y metadatos
5. Frontend envía petición POST a `/api/documents/upload`
6. Backend valida datos y archivo
7. Backend guarda archivo en sistema de archivos
8. Backend crea registro en base de datos
9. Backend registra acción en auditoría
10. Backend retorna documento creado
11. Frontend actualiza lista de documentos
12. Frontend muestra notificación de éxito

### 3. Flujo de Compartir Documento

1. Usuario hace clic en "Compartir" en un documento
2. Frontend genera link de compartir o selecciona amigos
3. Frontend envía petición POST a `/api/documents/:id/share`
4. Backend crea registros de compartido
5. Backend envía notificaciones a amigos
6. Backend retorna confirmación
7. Frontend muestra notificación de éxito
8. Amigos reciben notificación

### 4. Flujo de Descarga de Documento

1. Usuario hace clic en "Descargar"
2. Frontend envía petición GET a `/api/documents/:id/download`
3. Backend verifica permisos
4. Backend registra descarga en auditoría
5. Backend incrementa contador de descargas
6. Backend retorna archivo
7. Frontend descarga archivo
8. Frontend muestra notificación de éxito

### 5. Flujo de Solicitud de Amistad

1. Usuario busca otro usuario
2. Usuario hace clic en "Agregar amigo"
3. Frontend envía petición POST a `/api/friends/request`
4. Backend crea solicitud de amistad
5. Backend envía notificación al usuario receptor
6. Backend retorna confirmación
7. Frontend muestra notificación de éxito
8. Usuario receptor recibe notificación

### 6. Flujo de Aceptar Solicitud de Amistad

1. Usuario recibe notificación de solicitud
2. Usuario hace clic en "Aceptar"
3. Frontend envía petición POST a `/api/friends/requests/accept`
4. Backend crea relación de amistad
5. Backend elimina solicitud
6. Backend envía notificación de confirmación
7. Backend retorna confirmación
8. Frontend actualiza lista de amigos
9. Frontend muestra notificación de éxito

---

## 🗄️ Base de Datos

### Estructura de Colecciones

#### 1. Users (Usuarios)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (único),
  password: String (encriptado),
  career: String,
  role: String (student, professor, admin, super_admin),
  avatar: String (URL),
  lastSeen: Date,
  isOnline: Boolean,
  permissions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Documents (Documentos)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String (academic, research, project, other),
  course: String,
  fileName: String,
  filePath: String,
  fileSize: Number,
  fileType: String,
  author: ObjectId (referencia a User),
  isOfficial: Boolean,
  downloadsCount: Number,
  viewsCount: Number,
  sharedWith: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Friendships (Amistades)
```javascript
{
  _id: ObjectId,
  user1Id: ObjectId (referencia a User),
  user2Id: ObjectId (referencia a User),
  status: String (pending, accepted, rejected),
  createdAt: Date,
  acceptedAt: Date
}
```

#### 4. Notifications (Notificaciones)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (referencia a User),
  type: String (friend_request, friend_accepted, document_shared, official_document),
  title: String,
  message: String,
  relatedUserId: ObjectId (opcional),
  relatedDocumentId: ObjectId (opcional),
  isRead: Boolean,
  readAt: Date,
  createdAt: Date
}
```

#### 5. AuditLogs (Registros de Auditoría)
```javascript
{
  _id: ObjectId,
  action: String (upload, delete, download, view, update, share),
  actorId: ObjectId (referencia a User),
  documentId: ObjectId (opcional),
  targetUserId: ObjectId (opcional),
  description: String,
  ipAddress: String,
  userAgent: String,
  metadata: Object,
  createdAt: Date
}
```

---

## 📝 Notas Finales

### Mejores Prácticas Implementadas

1. **Seguridad**:
   - Autenticación JWT
   - Encriptación de contraseñas
   - Validación de datos de entrada
   - Rate limiting
   - Helmet para protección de cabeceras

2. **Performance**:
   - Índices en base de datos
   - Paginación de resultados
   - Lazy loading de componentes
   - Debounce en búsquedas

3. **UX/UI**:
   - Diseño responsive
   - Animaciones con Framer Motion
   - Modo oscuro
   - Notificaciones toast
   - Confirmaciones de acciones destructivas

4. **Mantenibilidad**:
   - Código modular
   - Separación de concerns
   - Reutilización de componentes
   - Documentación en código

### Próximos Pasos para Estudio

1. **Backend**:
   - Estudiar modelos de datos
   - Entender middleware de autenticación
   - Revisar controladores uno por uno
   - Probar rutas con Postman

2. **Frontend**:
   - Estudiar contextos de React
   - Revisar componentes principales
   - Entender flujo de datos
   - Probar componentes individualmente

3. **Integración**:
   - Entender flujo completo de una funcionalidad
   - Revisar comunicación frontend-backend
   - Probar casos de uso completos

---

## 🔗 Recursos Adicionales

### Documentación de Tecnologías

- **React**: https://react.dev/
- **Express.js**: https://expressjs.com/
- **MongoDB**: https://www.mongodb.com/docs/
- **Mongoose**: https://mongoosejs.com/
- **JWT**: https://jwt.io/
- **Tailwind CSS**: https://tailwindcss.com/
- **Framer Motion**: https://www.framer.com/motion/

### Archivos de Configuración

- `package.json` - Dependencias del proyecto
- `.env` - Variables de entorno
- `vite.config.js` - Configuración de Vite
- `tailwind.config.js` - Configuración de Tailwind
- `.eslintrc.js` - Configuración de ESLint

---

**¡Éxito en tu estudio del código! 🚀**



