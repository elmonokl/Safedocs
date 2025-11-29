# SafeDocs UNAB - Documentación Técnica

## 📋 Descripción General

SafeDocs UNAB es una plataforma web para el intercambio de documentos académicos entre estudiantes y profesores de la Universidad Andrés Bello. Permite subir, compartir, ver, descargar y gestionar documentos de manera segura.

### Tecnologías Principales

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, Vite, Framer Motion, Tailwind CSS
- **Autenticación**: JWT (JSON Web Tokens)
- **Almacenamiento**: Sistema de archivos local (Multer)
- **Seguridad**: Helmet, CORS, Rate Limiting, Bcrypt

---

## 🏗️ Arquitectura del Sistema

### Estructura General

```
Safedocs/
├── safedocs-backend/     # API REST con Express
│   ├── src/
│   │   ├── app.js        # Configuración de Express
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── models/       # Modelos de MongoDB
│   │   ├── routes/       # Definición de rutas
│   │   ├── middleware/   # Middlewares (auth, validations, upload)
│   │   └── config/       # Configuración de BD
│   └── server.js         # Punto de entrada
└── safedocs-frontend/    # Aplicación React
    ├── src/
    │   ├── components/   # Componentes React
    │   ├── contexts/     # Context API (Auth, Document, Theme)
    │   ├── utils/        # Utilidades (api.js)
    │   └── App.jsx       # Componente principal
```

---

## 🔧 Backend - Detalles Técnicos

### 1. Punto de Entrada (`server.js`)

- Conecta a MongoDB usando la URI de `.env`
- Inicia el servidor Express en el puerto 3000 (por defecto)
- Maneja errores de conexión y cierre graceful

### 2. Configuración de Express (`app.js`)

**Middlewares Configurados:**
- **Helmet**: Protección de cabeceras HTTP
- **CORS**: Control de acceso cross-origin (permite localhost en desarrollo)
- **Morgan**: Logging de solicitudes HTTP
- **Body Parser**: Parsing de JSON y URL-encoded (límite 10MB)
- **Static Files**: Servir archivos desde `/uploads`

**Rutas Principales:**
- `/api/auth` - Autenticación
- `/api/documents` - Gestión de documentos
- `/api/friends` - Gestión de amigos
- `/api/admin` - Panel de administración
- `/api/audit` - Registros de auditoría
- `/api/notifications` - Notificaciones

**Manejo de Errores:**
- Errores de validación (400)
- Errores de autenticación JWT (401)
- Errores de duplicado (índices únicos) (400)
- Errores de tamaño de archivo (400)
- Errores genéricos (500)

### 3. Modelos de Base de Datos

#### 3.1. User (`models/User.js`)

**Campos Principales:**
- `name`: String (requerido, max 50 caracteres)
- `email`: String (requerido, único, debe ser @unab.cl)
- `password`: String (requerido, min 6 caracteres, hasheado con bcrypt)
- `career`: String (default: 'Ingeniería en Computación e Informática')
- `profilePicture`: String (ruta de imagen)
- `role`: Enum ['student', 'professor', 'admin', 'super_admin'] (default: 'student')
- `permissions`: Array de strings (asignado según rol)
- `isActive`: Boolean (default: true)
- `isOnline`: Boolean (default: false)
- `lastSeen`: Date

**Métodos Importantes:**
- `verifyPassword(candidatePassword)`: Compara contraseña con hash
- `updateLastSeen()`: Actualiza última conexión
- `hasPermission(permission)`: Verifica si tiene permiso
- `isAdmin()`: Verifica si es admin o super_admin
- `toPublicJSON()`: Retorna usuario sin contraseña

**Índices:**
- `email` (único)
- `isActive`
- `isOnline`
- `name`

#### 3.2. Document (`models/Document.js`)

**Campos Principales:**
- `userId`: ObjectId (referencia a User)
- `title`: String (requerido, max 100 caracteres)
- `description`: String (max 500 caracteres)
- `category`: Enum ['academic', 'research', 'project', 'other']
- `course`: String (opcional, max 100 caracteres)
- `fileName`: String (requerido)
- `filePath`: String (requerido, ruta en servidor)
- `fileType`: String (MIME type)
- `fileSize`: Number (en bytes)
- `downloadsCount`: Number (default: 0)
- `isPublic`: Boolean (default: true)
- `isOfficial`: Boolean (default: false)
- `tags`: Array de strings
- `shareToken`: String (único, sparse, para compartir)

**Métodos Importantes:**
- `incrementDownloads()`: Incrementa contador de descargas
- `generateShareToken()`: Genera token único para compartir
- `findByShareToken(token)`: Busca documento por token
- `findPopular(limit)`: Obtiene documentos más descargados
- `search(searchTerm, filters)`: Búsqueda con filtros

**Virtual:**
- `author`: Popula información del usuario (name, career, profilePicture)

**Índices:**
- `userId`
- `category`
- `course`
- `createdAt` (descendente)
- `downloadsCount` (descendente)
- `shareToken` (único)
- `isOfficial`
- Text search en `title` y `description`

#### 3.3. Otros Modelos

- **Favorite**: Relación usuario-documento para favoritos
- **Friendship**: Relación de amistad entre usuarios
- **FriendRequest**: Solicitudes de amistad pendientes
- **SharedDocument**: Documentos compartidos con usuarios específicos
- **Notification**: Notificaciones del sistema
- **AuditLog**: Registro de auditoría de acciones

### 4. Controladores

#### 4.1. ControladorAutenticacion (`controllers/ControladorAutenticacion.js`)

**Funciones Principales:**

1. **register**: Registro de nuevos usuarios
   - Valida email @unab.cl
   - Verifica que email no esté en uso
   - Encripta contraseña con bcrypt (salt 12)
   - Crea usuario con rol 'student' por defecto
   - Genera token JWT
   - Retorna usuario y token

2. **login**: Inicio de sesión
   - Valida credenciales
   - Verifica contraseña con `verifyPassword()`
   - Genera token JWT
   - Actualiza `lastSeen` y `isOnline`
   - Retorna usuario y token

3. **verifyToken**: Verificación de token
   - Valida token JWT
   - Retorna información del usuario autenticado

4. **getProfile**: Obtener perfil
   - Retorna información completa del usuario autenticado

5. **updateProfile**: Actualizar perfil
   - Permite actualizar: name, career, profilePicture
   - Valida datos de entrada

6. **changePassword**: Cambiar contraseña
   - Valida contraseña actual
   - Encripta nueva contraseña
   - Actualiza en base de datos

7. **deleteAccount**: Eliminar cuenta
   - Elimina usuario y todos sus datos asociados
   - Limpia documentos, amigos, notificaciones

8. **logout**: Cerrar sesión
   - Actualiza `lastSeen` y marca `isOnline = false`

#### 4.2. DocumentController (`controllers/DocumentController.js`)

**Funciones Principales:**

1. **uploadDocument**: Subir documento
   - Valida archivo (Multer)
   - Mapea categoría del frontend al modelo
   - Requiere campo `course`
   - Crea documento con `isOfficial = false`
   - Registra en AuditLog
   - Retorna documento con autor poblado

2. **uploadOfficialDocument**: Subir documento oficial
   - Similar a uploadDocument pero con `isOfficial = true`
   - Solo profesores y admins pueden subir
   - No genera `shareToken` (no se comparten con token)

3. **getMyDocuments**: Obtener mis documentos
   - Filtra por `userId`
   - Popula información del autor
   - Ordena por fecha descendente

4. **getDocumentById**: Obtener documento específico
   - Valida que el usuario tenga acceso
   - Incrementa visualizaciones si aplica
   - Popula información del autor

5. **updateDocument**: Actualizar documento
   - Permite actualizar: title, description, category, course
   - Valida permisos (solo el dueño)
   - Registra en AuditLog

6. **deleteDocument**: Eliminar documento
   - Valida permisos
   - Elimina archivo físico del servidor
   - Elimina documento de BD
   - Limpia relaciones (favoritos, compartidos)
   - Registra en AuditLog

7. **downloadDocument**: Descargar documento
   - Valida permisos de acceso
   - Incrementa `downloadsCount`
   - Envía archivo con headers apropiados
   - Registra en AuditLog

8. **generateShareLink**: Generar enlace de compartir
   - Genera `shareToken` único
   - Retorna URL con token

9. **getDocumentByToken**: Obtener documento por token
   - Permite acceso sin autenticación
   - Busca por `shareToken`
   - Registra visualización si hay usuario autenticado

10. **shareWithFriends**: Compartir con amigos
    - Crea registros en SharedDocument
    - Envía notificaciones a los amigos
    - Valida que sean amigos

11. **getSharedDocuments**: Obtener documentos compartidos conmigo
    - Busca en SharedDocument donde soy receptor
    - Popula información del documento y remitente

12. **getOfficialDocuments**: Obtener documentos oficiales
    - Filtra por `isOfficial = true`
    - Acceso público (autenticación opcional)
    - Ordena por fecha descendente

13. **getFavoriteDocuments**: Obtener favoritos
    - Busca en Favorite del usuario
    - Popula información del documento

14. **addToFavorites**: Agregar a favoritos
    - Crea registro en Favorite
    - Valida que no esté ya en favoritos

15. **removeFromFavorites**: Remover de favoritos
    - Elimina registro de Favorite

#### 4.3. FriendsController (`controllers/FriendsController.js`)

**Funciones Principales:**
- `getFriends`: Lista de amigos del usuario
- `searchUsers`: Buscar usuarios para agregar
- `sendFriendRequest`: Enviar solicitud de amistad
- `getPendingRequests`: Obtener solicitudes pendientes
- `acceptFriendRequest`: Aceptar solicitud
- `rejectFriendRequest`: Rechazar solicitud
- `removeFriend`: Eliminar amigo
- `getOnlineFriends`: Amigos en línea
- `getFriendSuggestions`: Sugerencias de amigos

#### 4.4. AdminController (`controllers/AdminController.js`)

**Funciones Principales:**
- `getAllUsers`: Lista todos los usuarios (solo admin)
- `updateUserRole`: Cambiar rol de usuario (solo super_admin)
- `deleteUser`: Eliminar usuario (solo super_admin)
- `getSystemStats`: Estadísticas del sistema

#### 4.5. NotificationController (`controllers/NotificationController.js`)

**Funciones Principales:**
- `getNotifications`: Obtener notificaciones del usuario
- `markAsRead`: Marcar como leída
- `markAllAsRead`: Marcar todas como leídas
- `deleteNotification`: Eliminar notificación

#### 4.6. AuditController (`controllers/AuditController.js`)

**Funciones Principales:**
- `getAuditLogs`: Obtener registros de auditoría (solo admin)
- Filtros: por usuario, documento, acción, fecha

### 5. Middleware

#### 5.1. auth.js

**authenticateToken:**
- Extrae token del header `Authorization: Bearer <token>`
- Verifica y decodifica token JWT
- Valida que el usuario exista y esté activo
- Agrega `req.user` con `userId`, `email`, `role`
- Actualiza `lastSeen` del usuario

**optionalAuthenticateToken:**
- Similar a authenticateToken pero no requiere token
- Si no hay token, `req.user = null`
- Útil para rutas públicas con funcionalidades opcionales

**updateLastSeen:**
- Actualiza `lastSeen` y `isOnline = true` del usuario

**requireRole:**
- Valida que el usuario tenga un rol específico
- Usado para rutas de administradores o profesores

**authRateLimiter:**
- Limita solicitudes de autenticación (login/register)
- Previene ataques de fuerza bruta

#### 5.2. validations.js

**Validaciones Centralizadas:**
- `authValidations`: register, login, updateProfile, changePassword, deleteAccount
- `documentValidations`: upload, update, delete, getById, download
- `friendsValidations`: searchUsers, sendFriendRequest, acceptFriendRequest, etc.

**handleValidationErrors:**
- Middleware que procesa errores de validación
- Retorna errores en formato estándar

#### 5.3. upload.js

**documentUpload:**
- Configuración de Multer para subir documentos
- Límite de tamaño: 10MB
- Tipos permitidos: PDF, DOC, DOCX, PPT, PPTX
- Almacenamiento: `uploads/documents/`
- Nombres únicos: `document-{timestamp}-{random}.{ext}`

### 6. Rutas (API Endpoints)

#### 6.1. Autenticación (`/api/auth`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/register` | Registro de usuario | No |
| POST | `/login` | Inicio de sesión | No |
| GET | `/verify` | Verificar token | Sí |
| GET | `/profile` | Obtener perfil | Sí |
| PUT | `/profile` | Actualizar perfil | Sí |
| PUT | `/change-password` | Cambiar contraseña | Sí |
| POST | `/forgot-password` | Solicitar restablecimiento | No |
| POST | `/reset-password` | Restablecer contraseña | No |
| DELETE | `/account` | Eliminar cuenta | Sí |
| POST | `/logout` | Cerrar sesión | Sí |

#### 6.2. Documentos (`/api/documents`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/upload` | Subir documento | Sí |
| POST | `/official/upload` | Subir documento oficial | Sí (prof/admin) |
| GET | `/` | Obtener todos los documentos | Sí |
| GET | `/my-documents` | Mis documentos | Sí |
| GET | `/shared-with-me` | Documentos compartidos conmigo | Sí |
| GET | `/popular` | Documentos populares | Sí |
| GET | `/stats` | Estadísticas | Sí |
| GET | `/favorites` | Mis favoritos | Sí |
| GET | `/official` | Documentos oficiales | Opcional |
| GET | `/official/:id` | Documento oficial específico | Opcional |
| GET | `/official/:id/download` | Descargar oficial | Opcional |
| GET | `/shared/:token` | Obtener por token | Opcional |
| GET | `/shared/:token/download` | Descargar por token | Opcional |
| GET | `/:id` | Obtener documento | Sí |
| GET | `/:id/download` | Descargar documento | Sí |
| PUT | `/:id` | Actualizar documento | Sí |
| DELETE | `/:id` | Eliminar documento | Sí |
| POST | `/:id/share` | Generar enlace de compartir | Sí |
| POST | `/:id/share-friends` | Compartir con amigos | Sí |
| POST | `/:id/favorite` | Agregar a favoritos | Sí |
| DELETE | `/:id/favorite` | Remover de favoritos | Sí |
| GET | `/:id/is-favorite` | Verificar si es favorito | Sí |
| PATCH | `/shared/:id/read` | Marcar compartido como leído | Sí |

#### 6.3. Amigos (`/api/friends`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Lista de amigos | Sí |
| GET | `/search` | Buscar usuarios | Sí |
| POST | `/request` | Enviar solicitud | Sí |
| GET | `/requests/pending` | Solicitudes pendientes | Sí |
| POST | `/requests/accept` | Aceptar solicitud | Sí |
| POST | `/requests/reject` | Rechazar solicitud | Sí |
| DELETE | `/remove` | Eliminar amigo | Sí |
| GET | `/online` | Amigos en línea | Sí |
| GET | `/suggestions` | Sugerencias de amigos | Sí |

#### 6.4. Notificaciones (`/api/notifications`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Obtener notificaciones | Sí |
| PATCH | `/:id/read` | Marcar como leída | Sí |
| PATCH | `/read-all` | Marcar todas como leídas | Sí |
| DELETE | `/:id` | Eliminar notificación | Sí |

#### 6.5. Administración (`/api/admin`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/users` | Lista de usuarios | Sí (admin) |
| PUT | `/users/:id/role` | Cambiar rol | Sí (super_admin) |
| DELETE | `/users/:id` | Eliminar usuario | Sí (super_admin) |
| GET | `/stats` | Estadísticas del sistema | Sí (admin) |

#### 6.6. Auditoría (`/api/audit`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/logs` | Obtener registros | Sí (admin) |

---

## 🎨 Frontend - Detalles Técnicos

### 1. Estructura de Componentes

#### 1.1. Componentes Principales

**App.jsx:**
- Componente raíz que maneja el estado de vista
- Envuelve la app con providers: AuthProvider, ThemeProvider, DocumentProvider
- Renderiza diferentes vistas según el estado: 'inicio', 'login', 'registro', 'dashboard', etc.
- Maneja Toast y ConfirmDialog globales

**Dashboard.jsx:**
- Vista principal después del login
- Muestra resumen de documentos, estadísticas
- Navegación a diferentes secciones

**VistaUsuario.jsx:**
- Vista para estudiantes
- Lista de documentos propios
- Funcionalidades: subir, editar, eliminar, compartir

**VistaProfesor.jsx:**
- Vista para profesores
- Similar a VistaUsuario pero con permisos adicionales
- Puede subir documentos oficiales

**VistaAdministrador.jsx:**
- Vista para administradores
- Gestión de usuarios y documentos
- Estadísticas del sistema

**VistaAmigos.jsx:**
- Gestión de amigos
- Buscar usuarios, enviar solicitudes, aceptar/rechazar
- Lista de amigos

**VistaPerfil.jsx:**
- Perfil del usuario
- Editar información personal
- Cambiar contraseña
- Eliminar cuenta

**VistaFavoritos.jsx:**
- Lista de documentos favoritos
- Remover de favoritos
- Ver y descargar documentos

**VistaDocumentosCompartidos.jsx:**
- Documentos compartidos con el usuario
- Marcar como leído

**VistaDocumentosOficiales.jsx:**
- Lista de documentos oficiales
- Acceso público

**VistaVistos.jsx:**
- Historial de documentos vistos

**VistaAuditoria.jsx:**
- Registros de auditoría (solo admin)

**SubirDocumentoOficial.jsx:**
- Formulario para subir documentos oficiales (profesores/admins)

#### 1.2. Componentes de UI

- **Sidebar**: Navegación lateral
- **MenuHamburguesa**: Menú móvil
- **ModalDocumento**: Modal para ver documento
- **EditDocumentModal**: Modal para editar documento
- **ShareQRModal**: Modal para compartir con QR
- **AddFriendModal**: Modal para agregar amigo
- **FriendProfileModal**: Modal de perfil de amigo
- **DeleteAccountModal**: Modal para eliminar cuenta
- **ConfirmDialog**: Diálogo de confirmación
- **Toast**: Notificaciones toast
- **LoadingSpinner**: Spinner de carga
- **Notifications**: Componente de notificaciones

### 2. Contextos (Context API)

#### 2.1. AuthContext (`contexts/AuthContext.jsx`)

**Estado:**
- `user`: Usuario actual (null si no está autenticado)
- `loading`: Estado de carga
- `error`: Mensaje de error

**Funciones:**
- `login(email, password)`: Inicia sesión
- `register(userData)`: Registra nuevo usuario
- `logout()`: Cierra sesión
- `updateProfile(profileData)`: Actualiza perfil
- `deleteAccount(confirmation)`: Elimina cuenta
- `clearError()`: Limpia error

**Flujo de Autenticación:**
1. Al cargar la app, verifica token en localStorage
2. Si hay token, llama a `/api/auth/verify`
3. Si el token es válido, establece el usuario
4. Si no, limpia localStorage y muestra login

#### 2.2. DocumentContext (`contexts/DocumentContext.jsx`)

**Estado:**
- Documentos del usuario
- Documentos compartidos
- Documentos oficiales
- Favoritos

**Funciones:**
- Carga y actualiza documentos
- Sincroniza con el backend

#### 2.3. ThemeContext (`contexts/ThemeContext.jsx`)

**Estado:**
- `theme`: 'light' o 'dark'

**Funciones:**
- `toggleTheme()`: Cambia entre temas
- Persiste preferencia en localStorage

### 3. Utilidades

#### 3.1. api.js (`utils/api.js`)

**Función Principal: `apiFetch`**

```javascript
apiFetch(path, { method, body, headers })
```

**Características:**
- Base URL desde `VITE_API_URL` o `http://localhost:3000`
- Agrega automáticamente token JWT desde localStorage
- Maneja FormData para uploads
- Maneja errores HTTP (400, 401, 403, 404, 500)
- Extrae mensajes de error de diferentes formatos
- Maneja rate limiting (429)
- Retorna datos parseados como JSON

**Uso:**
```javascript
// GET
const data = await apiFetch('/api/documents/my-documents')

// POST
const result = await apiFetch('/api/auth/login', {
  method: 'POST',
  body: { email, password }
})

// POST con FormData (upload)
const formData = new FormData()
formData.append('file', file)
formData.append('title', title)
const result = await apiFetch('/api/documents/upload', {
  method: 'POST',
  body: formData
})
```

---

## 🔐 Seguridad

### Autenticación JWT

1. **Registro/Login**: Usuario recibe token JWT
2. **Almacenamiento**: Token en `localStorage` (frontend)
3. **Envío**: Header `Authorization: Bearer <token>`
4. **Validación**: Middleware `authenticateToken` verifica token
5. **Expiración**: Tokens tienen tiempo de expiración

### Roles y Permisos

- **student**: Usuario básico, puede subir documentos personales
- **professor**: Puede subir documentos oficiales
- **admin**: Gestión de usuarios y documentos
- **super_admin**: Control total, puede cambiar roles

### Validaciones

- Email debe ser @unab.cl
- Contraseña mínimo 6 caracteres
- Archivos máximo 10MB
- Tipos de archivo permitidos: PDF, DOC, DOCX, PPT, PPTX
- Rate limiting en autenticación

### CORS

- En desarrollo: Permite localhost (5173, 5174, 3000, 3001, 4173, 4174)
- En producción: Solo permite `FRONTEND_URL` del .env

---

## 📊 Flujos Importantes

### Flujo de Subida de Documento

1. Usuario selecciona archivo en frontend
2. Frontend crea FormData con archivo y metadatos
3. POST a `/api/documents/upload`
4. Middleware `upload.single('file')` procesa archivo
5. Validaciones en `documentValidations.upload`
6. `DocumentController.uploadDocument`:
   - Guarda archivo en `uploads/documents/`
   - Crea registro en BD
   - Registra en AuditLog
7. Retorna documento con autor poblado
8. Frontend actualiza lista de documentos

### Flujo de Compartir Documento

**Opción 1: Compartir con Token (Público)**
1. Usuario hace clic en "Compartir"
2. POST a `/api/documents/:id/share`
3. Backend genera `shareToken` único
4. Retorna URL: `/api/documents/shared/:token`
5. Cualquiera con el link puede acceder (sin auth)

**Opción 2: Compartir con Amigos**
1. Usuario selecciona amigos
2. POST a `/api/documents/:id/share-friends`
3. Backend crea registros en `SharedDocument`
4. Crea notificaciones para cada amigo
5. Amigos ven documento en "Documentos Compartidos"

### Flujo de Favoritos

1. Usuario hace clic en estrella
2. POST a `/api/documents/:id/favorite`
3. Backend crea registro en `Favorite`
4. Frontend actualiza UI
5. Para ver favoritos: GET `/api/documents/favorites`

### Flujo de Amistad

1. Usuario busca otro usuario
2. GET `/api/friends/search?q=nombre`
3. Usuario envía solicitud: POST `/api/friends/request`
4. Backend crea `FriendRequest`
5. Receptor recibe notificación
6. Receptor acepta: POST `/api/friends/requests/accept`
7. Backend crea `Friendship` y elimina `FriendRequest`
8. Ambos usuarios son amigos

---

## 🗄️ Base de Datos

### Esquema de Relaciones

```
User
├── Document (userId)
├── Favorite (userId, documentId)
├── Friendship (userId, friendId)
├── FriendRequest (fromUserId, toUserId)
├── SharedDocument (documentId, sharedWithUserId)
├── Notification (userId)
└── AuditLog (actorId)
```

### Índices Importantes

- `User.email` (único)
- `Document.shareToken` (único, sparse)
- `Document.userId`
- `Document.isOfficial`
- `Document.downloadsCount` (descendente)
- `Friendship.userId` y `friendId`
- `Favorite.userId` y `documentId`

---

## 🚀 Preguntas Frecuentes sobre el Código

### ¿Cómo funciona la autenticación?

1. Usuario se registra/login → recibe token JWT
2. Token se guarda en `localStorage`
3. Cada request incluye header `Authorization: Bearer <token>`
4. Middleware `authenticateToken` valida token
5. Si es válido, agrega `req.user` con información del usuario

### ¿Cómo se comparten los documentos?

Hay dos formas:
1. **Token público**: Genera `shareToken` único, cualquiera con el link puede acceder
2. **Con amigos**: Crea registros en `SharedDocument`, solo los amigos seleccionados pueden ver

### ¿Qué diferencia hay entre documento normal y oficial?

- **Normal**: `isOfficial = false`, puede tener `shareToken`, lo sube cualquier usuario
- **Oficial**: `isOfficial = true`, NO tiene `shareToken`, solo lo suben profesores/admins, acceso público pero sin compartir

### ¿Cómo funcionan los favoritos?

Se crea un registro en la colección `Favorite` con `userId` y `documentId`. Para obtener favoritos, se busca en `Favorite` donde `userId` coincide y se popula la información del documento.

### ¿Cómo se actualiza el estado de "en línea"?

El middleware `updateLastSeen` se ejecuta en cada request autenticado y actualiza `lastSeen` y `isOnline = true`. Para marcar como offline, se llama a `setOffline()` en logout.

### ¿Cómo funcionan las notificaciones?

Cuando ocurre un evento (solicitud de amistad, documento compartido, etc.), el backend crea un registro en `Notification`. El frontend consulta `/api/notifications` y muestra las notificaciones no leídas.

### ¿Qué es AuditLog?

Registro de todas las acciones importantes en el sistema (upload, delete, download, view, share). Solo los admins pueden ver los logs. Se usa para auditoría y seguridad.

### ¿Cómo se valida que un usuario puede hacer una acción?

1. **Autenticación**: Middleware `authenticateToken` verifica que esté autenticado
2. **Autorización**: Se verifica en el controlador:
   - Para documentos: verificar que `userId` del documento coincida con `req.user.userId`
   - Para admin: verificar que `req.user.role` sea 'admin' o 'super_admin'
   - Para documentos oficiales: verificar que el rol sea 'professor' o 'admin'

### ¿Cómo se manejan los errores?

**Backend:**
- Middleware de errores en `app.js` captura todos los errores
- Retorna formato estándar: `{ success: false, message: '...' }`
- Diferentes códigos HTTP según el tipo de error

**Frontend:**
- `apiFetch` captura errores HTTP
- Extrae mensaje de error de la respuesta
- Muestra Toast con el mensaje de error

### ¿Cómo se almacenan los archivos?

- Los archivos se guardan en `safedocs-backend/uploads/documents/`
- Nombres únicos: `document-{timestamp}-{random}.{ext}`
- La ruta se guarda en `Document.filePath`
- Para servir archivos: Express static en `/uploads`

---

## 📝 Notas Importantes

- El email debe ser @unab.cl para registrarse
- Los documentos oficiales no tienen `shareToken` (no se comparten con token)
- El campo `course` es obligatorio al subir documentos
- Las categorías se mapean del frontend al backend (Apuntes → academic, Guías → research, etc.)
- Los favoritos usan una colección separada `Favorite`, no un campo en Document
- Las notificaciones se crean automáticamente en ciertos eventos (solicitud de amistad, documento compartido)
- El sistema usa JWT sin refresh tokens (el token expira y el usuario debe hacer login nuevamente)

---

## 🔍 Archivos Clave para Revisar

**Backend:**
- `server.js` - Punto de entrada
- `app.js` - Configuración Express
- `middleware/auth.js` - Autenticación JWT
- `controllers/DocumentController.js` - Lógica de documentos
- `controllers/ControladorAutenticacion.js` - Lógica de autenticación
- `models/User.js` - Modelo de usuario
- `models/Document.js` - Modelo de documento

**Frontend:**
- `App.jsx` - Componente raíz
- `contexts/AuthContext.jsx` - Estado de autenticación
- `utils/api.js` - Cliente HTTP
- `components/Dashboard.jsx` - Vista principal
- `components/VistaUsuario.jsx` - Vista de usuario

---

*Documentación actualizada para SafeDocs UNAB - Sistema de gestión de documentos académicos*

