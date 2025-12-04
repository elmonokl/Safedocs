# 🎯 Guía Completa para Presentación - SafeDocs UNAB

Esta guía te ayudará a preparar y ejecutar SafeDocs en otro computador para tu presentación, asegurándote de que todo funcione al 100%.

---

## 📋 ÍNDICE

1. [Preparación en tu Computador Actual](#1-preparación-en-tu-computador-actual)
2. [Instalación en el Computador de Presentación](#2-instalación-en-el-computador-de-presentación)
3. [Configuración de Base de Datos](#3-configuración-de-base-de-datos)
4. [Configuración del Proyecto](#4-configuración-del-proyecto)
5. [Ejecutar y Verificar](#5-ejecutar-y-verificar)
6. [Preparar Datos de Prueba](#6-preparar-datos-de-prueba)
7. [Checklist Final](#7-checklist-final)

---

## 1. PREPARACIÓN EN TU COMPUTADOR ACTUAL

### Paso 1.1: Asegúrate de que todo esté en GitHub

```bash
# Verifica que todos los cambios estén guardados
git status

# Si hay cambios sin guardar, haz commit y push
git add .
git commit -m "Preparación para presentación"
git push origin main
```

### Paso 1.2: Verifica que el código funcione localmente

1. Asegúrate de que el backend y frontend funcionen en tu computador
2. Prueba las funcionalidades principales:
   - Login/Registro
   - Subir documentos
   - Editar documentos
   - Compartir documentos
   - Ver documentos compartidos

---

## 2. INSTALACIÓN EN EL COMPUTADOR DE PRESENTACIÓN

### Paso 2.1: Instalar Node.js

1. **Descargar Node.js:**
   - Ve a: https://nodejs.org/
   - Descarga la versión **LTS** (Long Term Support)
   - Versión recomendada: **18.x o superior**

2. **Instalar Node.js:**
   - Ejecuta el instalador
   - Sigue las instrucciones (acepta todo por defecto)
   - **IMPORTANTE:** Asegúrate de marcar la opción "Add to PATH"

3. **Verificar instalación:**
   Abre una terminal (PowerShell en Windows, Terminal en Mac/Linux) y ejecuta:
   ```bash
   node --version
   npm --version
   ```
   Deberías ver las versiones instaladas. Si no funciona, reinicia la terminal.

### Paso 2.2: Instalar Git (si no está instalado)

1. **Windows/Mac:** https://git-scm.com/downloads
2. **Verificar:**
   ```bash
   git --version
   ```

### Paso 2.3: Clonar el Repositorio

```bash
# Clonar desde GitHub
git clone https://github.com/elmonokl/Safedocs.git

# Entrar a la carpeta
cd Safedocs
```

---

## 3. CONFIGURACIÓN DE BASE DE DATOS

**Para una presentación, recomiendo usar MongoDB Atlas (gratis y en la nube)** porque:
- ✅ No necesitas instalar MongoDB localmente
- ✅ Funciona desde cualquier computador
- ✅ Más rápido de configurar
- ✅ Gratis hasta 512MB

### Opción A: MongoDB Atlas (RECOMENDADO para presentación)

#### Paso 3.1: Crear cuenta en MongoDB Atlas

1. Ve a: https://www.mongodb.com/cloud/atlas
2. Haz clic en **"Try Free"** o **"Sign Up"**
3. Completa el registro (puedes usar tu email de Google)

#### Paso 3.2: Crear un Cluster Gratuito

1. Una vez dentro, haz clic en **"Build a Database"**
2. Selecciona el plan **FREE (M0)**
3. Elige una región cercana (ej: `us-east-1` para Estados Unidos)
4. Haz clic en **"Create"**
5. Espera 3-5 minutos mientras se crea el cluster

#### Paso 3.3: Configurar Acceso a la Base de Datos

1. **Crear Usuario de Base de Datos:**
   - Ve a **"Database Access"** (menú lateral izquierdo)
   - Haz clic en **"Add New Database User"**
   - Selecciona **"Password"** como método de autenticación
   - Usuario: `safedocs_user` (o el que prefieras)
   - Contraseña: Genera una segura o usa una que recuerdes
   - **IMPORTANTE:** Guarda esta contraseña, la necesitarás
   - Rol: `Atlas admin` (o `Read and write to any database`)
   - Haz clic en **"Add User"**

2. **Configurar Acceso de Red (Whitelist):**
   - Ve a **"Network Access"** (menú lateral izquierdo)
   - Haz clic en **"Add IP Address"**
   - Para desarrollo/presentación, haz clic en **"Allow Access from Anywhere"**
   - Esto agregará `0.0.0.0/0` a la whitelist
   - Haz clic en **"Confirm"**

#### Paso 3.4: Obtener la URI de Conexión

1. Ve a **"Database"** (menú lateral izquierdo)
2. Haz clic en **"Connect"** en tu cluster
3. Selecciona **"Connect your application"**
4. Copia la URI que aparece (se ve así):
   ```
   mongodb+srv://safedocs_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Reemplaza `<password>`** con la contraseña que creaste
6. **Agrega el nombre de la base de datos** al final:
   ```
   mongodb+srv://safedocs_user:TU_PASSWORD@cluster0.xxxxx.mongodb.net/safedocs_db?retryWrites=true&w=majority
   ```
7. **Guarda esta URI completa**, la usarás en el siguiente paso

### Opción B: MongoDB Local (Alternativa)

Si prefieres usar MongoDB local:

1. **Descargar MongoDB:**
   - Windows: https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb` o `sudo yum install mongodb`

2. **Iniciar MongoDB:**
   - Windows: Se inicia automáticamente como servicio
   - Mac/Linux: `sudo systemctl start mongod` o `brew services start mongodb-community`

3. **URI de conexión:** `mongodb://localhost:27017/safedocs_db`

---

## 4. CONFIGURACIÓN DEL PROYECTO

### Paso 4.1: Instalar Dependencias del Backend

```bash
# Ir a la carpeta del backend
cd safedocs-backend

# Instalar todas las dependencias (esto puede tardar 2-5 minutos)
npm install
```

Espera a que termine. Deberías ver algo como:
```
added 234 packages in 2m
```

### Paso 4.2: Instalar Dependencias del Frontend

```bash
# Volver a la raíz y entrar al frontend
cd ..
cd safedocs-frontend

# Instalar todas las dependencias (esto puede tardar 2-5 minutos)
npm install
```

### Paso 4.3: Configurar Variables de Entorno del Backend

```bash
# Volver a la carpeta del backend
cd ../safedocs-backend

# Copiar el archivo de ejemplo
# En Windows PowerShell:
Copy-Item env.example .env

# En Mac/Linux:
# cp env.example .env
```

Ahora edita el archivo `.env` con un editor de texto (Notepad en Windows, TextEdit en Mac, o cualquier editor):

```env
# Configuración de Base de Datos MongoDB
# Si usas MongoDB Atlas, pega aquí la URI completa que copiaste:
MONGODB_URI=mongodb+srv://safedocs_user:TU_PASSWORD@cluster0.xxxxx.mongodb.net/safedocs_db?retryWrites=true&w=majority

# Si usas MongoDB local, usa esta línea:
# MONGODB_URI=mongodb://localhost:27017/safedocs_db

# Configuración del Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT Secret (IMPORTANTE: Cambia esto por una cadena aleatoria)
# Puedes generar una ejecutando: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=cambiar_esto_por_una_cadena_aleatoria_segura_123456789
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
- Reemplaza `TU_PASSWORD` con la contraseña real de MongoDB Atlas
- Cambia `JWT_SECRET` por una cadena aleatoria (puedes usar cualquier texto largo, ej: `mi_secreto_super_seguro_para_presentacion_2024`)

### Paso 4.4: Crear Carpetas Necesarias

```bash
# Asegúrate de estar en safedocs-backend
cd safedocs-backend

# Crear carpeta de uploads si no existe
# En Windows PowerShell:
New-Item -ItemType Directory -Force -Path uploads\documents
New-Item -ItemType Directory -Force -Path uploads\profiles

# En Mac/Linux:
# mkdir -p uploads/documents uploads/profiles
```

---

## 5. EJECUTAR Y VERIFICAR

### Paso 5.1: Iniciar el Backend

Abre una **primera terminal** y ejecuta:

```bash
cd Safedocs/safedocs-backend
npm run dev
```

Deberías ver mensajes como:
```
✅ Conexión a MongoDB establecida correctamente
🚀 Servidor SafeDocs ejecutándose en puerto 3000
📱 Frontend URL: http://localhost:5173
🔗 API URL: http://localhost:3000
```

**Si ves un error de conexión a MongoDB:**
- Verifica que la URI en el `.env` sea correcta
- Si usas Atlas, verifica que tu IP esté en la whitelist
- Verifica que el usuario y contraseña sean correctos

### Paso 5.2: Iniciar el Frontend

Abre una **segunda terminal** (deja la primera corriendo) y ejecuta:

```bash
cd Safedocs/safedocs-frontend
npm run dev
```

Deberías ver algo como:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Paso 5.3: Verificar que Todo Funciona

1. **Abre tu navegador** y ve a: `http://localhost:5173`
2. Deberías ver la página de inicio de SafeDocs
3. Prueba crear una cuenta nueva (usa un email que termine en `@unab.cl`)

---

## 6. PREPARAR DATOS DE PRUEBA

### Paso 6.1: Crear Usuario Administrador

En la terminal del backend (primera terminal), presiona `Ctrl+C` para detenerlo, luego ejecuta:

```bash
npm run create-admin
```

Sigue las instrucciones para crear un usuario administrador. **Guarda las credenciales.**

### Paso 6.2: Crear Usuarios de Prueba (Opcional)

```bash
npm run create-test-users
```

Esto creará varios usuarios de prueba que puedes usar en la presentación.

### Paso 6.3: Reiniciar el Backend

```bash
npm run dev
```

### Paso 6.4: Preparar Datos de Demostración

1. Inicia sesión con el usuario administrador
2. Sube algunos documentos de ejemplo
3. Crea algunos usuarios adicionales si es necesario
4. Comparte documentos entre usuarios para demostrar la funcionalidad

---

## 7. CHECKLIST FINAL

Antes de la presentación, verifica:

- [ ] ✅ Node.js instalado y funcionando (`node --version`)
- [ ] ✅ MongoDB Atlas configurado o MongoDB local corriendo
- [ ] ✅ Repositorio clonado desde GitHub
- [ ] ✅ Dependencias del backend instaladas (`npm install` en `safedocs-backend`)
- [ ] ✅ Dependencias del frontend instaladas (`npm install` en `safedocs-frontend`)
- [ ] ✅ Archivo `.env` creado y configurado correctamente
- [ ] ✅ Carpeta `uploads` creada
- [ ] ✅ Backend corriendo sin errores (`npm run dev` en `safedocs-backend`)
- [ ] ✅ Frontend corriendo sin errores (`npm run dev` en `safedocs-frontend`)
- [ ] ✅ Puedes acceder a `http://localhost:5173` en el navegador
- [ ] ✅ Puedes registrarte y hacer login
- [ ] ✅ Puedes subir documentos
- [ ] ✅ Puedes editar documentos
- [ ] ✅ Puedes compartir documentos
- [ ] ✅ Usuario administrador creado
- [ ] ✅ Datos de prueba preparados

---

## 🚨 SOLUCIÓN RÁPIDA DE PROBLEMAS

### Error: "Cannot find module"
```bash
# Elimina node_modules y reinstala
cd safedocs-backend  # o safedocs-frontend
rm -rf node_modules  # En Windows: Remove-Item -Recurse -Force node_modules
npm install
```

### Error: "MongoDB connection failed"
1. Verifica que la URI en `.env` sea correcta
2. Si usas Atlas, verifica que tu IP esté en la whitelist (`0.0.0.0/0`)
3. Verifica usuario y contraseña
4. Prueba la conexión desde MongoDB Compass (opcional)

### Error: "Port 3000 already in use"
```bash
# En Windows PowerShell:
netstat -ano | findstr :3000
# Luego mata el proceso con el PID que aparezca:
taskkill /PID <PID> /F

# En Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### El frontend no se conecta al backend
1. Verifica que el backend esté corriendo
2. Verifica que `CORS_ORIGIN` en `.env` sea `http://localhost:5173`
3. Abre la consola del navegador (F12) y revisa errores

### Error: "JWT_SECRET is required"
- Asegúrate de que el archivo `.env` exista en `safedocs-backend`
- Verifica que `JWT_SECRET` esté configurado en el `.env`

---

## 📝 NOTAS PARA LA PRESENTACIÓN

1. **Prepara un backup:** Si es posible, ten el código también en un USB por si hay problemas de internet
2. **Prueba antes:** Ejecuta todo al menos 1 hora antes de la presentación
3. **Ten las credenciales a mano:** Usuario admin, contraseñas, etc.
4. **Prepara datos de ejemplo:** Sube documentos antes de la presentación
5. **Ten un plan B:** Si algo falla, puedes mostrar screenshots o un video de la aplicación funcionando

---

## 🎯 COMANDOS RÁPIDOS DE REFERENCIA

```bash
# Iniciar Backend
cd safedocs-backend
npm run dev

# Iniciar Frontend (en otra terminal)
cd safedocs-frontend
npm run dev

# Crear Admin
cd safedocs-backend
npm run create-admin

# Crear Usuarios de Prueba
cd safedocs-backend
npm run create-test-users
```

---

## 📞 ¿NECESITAS AYUDA?

Si algo no funciona durante la preparación:
1. Revisa los mensajes de error en las terminales
2. Verifica el checklist anterior
3. Revisa la sección "Solución Rápida de Problemas"
4. Consulta `INSTALACION.md` para más detalles

---

**¡Éxito en tu presentación! 🎉**

