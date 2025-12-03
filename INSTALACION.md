# 📦 Guía de Instalación - SafeDocs UNAB

Esta guía te ayudará a configurar el proyecto SafeDocs en un nuevo computador después de clonarlo desde GitHub.

---

## 🔧 Requisitos Previos

### 1. **Node.js** (Versión 18 o superior)
- **Descarga:** https://nodejs.org/
- **Verificar instalación:**
  ```bash
  node --version
  npm --version
  ```
- Node.js incluye npm automáticamente

### 2. **MongoDB** 
Tienes dos opciones:

#### Opción A: MongoDB Local (Recomendado para desarrollo)
- **Descarga:** https://www.mongodb.com/try/download/community
- **Instalación:** Sigue el instalador de tu sistema operativo
- **Iniciar MongoDB:**
  - **Windows:** Se inicia automáticamente como servicio
  - **Mac/Linux:** `sudo systemctl start mongod` o `brew services start mongodb-community`

#### Opción B: MongoDB Atlas (Base de datos en la nube - Gratis)
- **Crear cuenta:** https://www.mongodb.com/cloud/atlas
- **Crear cluster gratuito**
- **Obtener URI de conexión** (la usarás en el archivo .env)

### 3. **Git** (Para clonar el repositorio)
- **Descarga:** https://git-scm.com/
- **Verificar:** `git --version`

---

## 📥 Pasos de Instalación

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/elmonokl/Safedocs.git
cd Safedocs
```

### Paso 2: Instalar Dependencias del Backend

```bash
cd safedocs-backend
npm install
```

Esto instalará todas las dependencias necesarias:
- Express.js
- Mongoose
- JWT
- Bcrypt
- Multer
- Y otras dependencias listadas en `package.json`

### Paso 3: Instalar Dependencias del Frontend

```bash
cd ../safedocs-frontend
npm install
```

Esto instalará:
- React
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Y otras dependencias

### Paso 4: Configurar Variables de Entorno

#### Backend (.env)

1. Ve a la carpeta `safedocs-backend`
2. Copia el archivo de ejemplo:
   ```bash
   cp env.example .env
   ```
3. Edita el archivo `.env` con tus configuraciones:

```env
# Configuración de Base de Datos MongoDB
# Si usas MongoDB local:
MONGODB_URI=mongodb://localhost:27017/safedocs_db

# Si usas MongoDB Atlas, usa esta línea (reemplaza con tu URI):
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/safedocs_db

# Configuración del Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT Secret (cambia esto por una cadena aleatoria segura)
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_esto
JWT_EXPIRES_IN=24h

# Configuración de Archivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,ppt,pptx

# Configuración de Seguridad
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173
```

**⚠️ IMPORTANTE:** 
- Cambia `JWT_SECRET` por una cadena aleatoria segura (puedes generar una con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Si usas MongoDB Atlas, reemplaza `MONGODB_URI` con tu URI de conexión

#### Frontend (opcional)

El frontend usa variables de entorno de Vite. Si necesitas cambiar la URL del backend, crea un archivo `.env` en `safedocs-frontend`:

```env
VITE_API_URL=http://localhost:3000
```

---

## 🚀 Ejecutar el Proyecto

### Opción 1: Ejecutar Backend y Frontend por Separado

#### Terminal 1 - Backend:
```bash
cd safedocs-backend
npm run dev
```
El backend estará disponible en: `http://localhost:3000`

#### Terminal 2 - Frontend:
```bash
cd safedocs-frontend
npm run dev
```
El frontend estará disponible en: `http://localhost:5173`

### Opción 2: Ejecutar desde la Raíz (Monorepo)

Desde la carpeta raíz del proyecto:

```bash
# Backend
npm run dev:backend

# Frontend (en otra terminal)
npm run dev:frontend
```

---

## 🗄️ Configurar la Base de Datos

### Si usas MongoDB Local:

1. Asegúrate de que MongoDB esté corriendo
2. La base de datos se creará automáticamente cuando el backend se conecte
3. Puedes crear un usuario administrador ejecutando:
   ```bash
   cd safedocs-backend
   npm run create-admin
   ```

### Si usas MongoDB Atlas:

1. Crea un cluster gratuito en https://www.mongodb.com/cloud/atlas
2. Crea un usuario de base de datos
3. Obtén la URI de conexión (formato: `mongodb+srv://usuario:password@cluster.mongodb.net/safedocs_db`)
4. Agrega tu IP a la whitelist (o usa `0.0.0.0/0` para permitir todas las IPs en desarrollo)
5. Pega la URI en el archivo `.env` como `MONGODB_URI`

---

## ✅ Verificar que Todo Funciona

1. **Backend corriendo:**
   - Abre `http://localhost:3000` en el navegador
   - Deberías ver un mensaje o error de API (eso significa que está funcionando)

2. **Frontend corriendo:**
   - Abre `http://localhost:5173`
   - Deberías ver la página de inicio de SafeDocs

3. **Base de datos conectada:**
   - Revisa la consola del backend
   - Deberías ver un mensaje como: "MongoDB conectado correctamente"

---

## 🛠️ Comandos Útiles

### Backend:
```bash
cd safedocs-backend

# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start

# Crear usuario administrador
npm run create-admin

# Crear usuarios de prueba
npm run create-test-users

# Setup completo
npm run setup
```

### Frontend:
```bash
cd safedocs-frontend

# Desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

---

## 📋 Checklist de Instalación

- [ ] Node.js instalado (versión 18+)
- [ ] MongoDB instalado o cuenta de MongoDB Atlas creada
- [ ] Repositorio clonado desde GitHub
- [ ] Dependencias del backend instaladas (`npm install` en `safedocs-backend`)
- [ ] Dependencias del frontend instaladas (`npm install` en `safedocs-frontend`)
- [ ] Archivo `.env` creado en `safedocs-backend` con las configuraciones correctas
- [ ] MongoDB corriendo (si es local) o URI de Atlas configurada
- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Frontend corriendo en `http://localhost:5173`

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module"
- **Solución:** Ejecuta `npm install` en la carpeta correspondiente

### Error: "MongoDB connection failed"
- **Solución:** 
  - Verifica que MongoDB esté corriendo (si es local)
  - Verifica la URI en el archivo `.env`
  - Si usas Atlas, verifica que tu IP esté en la whitelist

### Error: "Port 3000 already in use"
- **Solución:** Cambia el puerto en el archivo `.env` o cierra el proceso que está usando el puerto

### Error: "JWT_SECRET is required"
- **Solución:** Asegúrate de tener el archivo `.env` con `JWT_SECRET` configurado

### El frontend no se conecta al backend
- **Solución:** 
  - Verifica que el backend esté corriendo
  - Verifica que `VITE_API_URL` en el frontend apunte a la URL correcta del backend
  - Revisa la consola del navegador para ver errores de CORS

---

## 📚 Recursos Adicionales

- **Documentación de Node.js:** https://nodejs.org/docs/
- **Documentación de MongoDB:** https://docs.mongodb.com/
- **Documentación de React:** https://react.dev/
- **Documentación de Express:** https://expressjs.com/

---

## 💡 Notas Importantes

1. **Nunca subas el archivo `.env` a GitHub** - Contiene información sensible
2. **El archivo `.env` debe estar en `.gitignore`** (ya debería estarlo)
3. **Para producción**, usa variables de entorno del servidor en lugar de archivos `.env`
4. **MongoDB Atlas** es gratuito hasta 512MB, perfecto para desarrollo y proyectos pequeños

---

¡Listo! Ahora deberías poder ejecutar SafeDocs en tu nuevo computador. Si tienes problemas, revisa la sección de "Solución de Problemas Comunes" o consulta la documentación técnica en `README.md`.

