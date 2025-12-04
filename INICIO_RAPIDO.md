# ⚡ Inicio Rápido - SafeDocs para Presentación

## 🎯 Pasos Esenciales (15-20 minutos)

### 1. Instalar Node.js
- Descarga: https://nodejs.org/ (versión LTS)
- Verifica: `node --version` y `npm --version`

### 2. Clonar Repositorio
```bash
git clone https://github.com/elmonokl/Safedocs.git
cd Safedocs
```

### 3. Configurar MongoDB Atlas (Recomendado)
1. Crea cuenta en: https://www.mongodb.com/cloud/atlas
2. Crea cluster FREE
3. Crea usuario de BD (guarda contraseña)
4. Whitelist: `0.0.0.0/0` (permitir todas las IPs)
5. Copia la URI de conexión

### 4. Instalar Dependencias
```bash
# Backend
cd safedocs-backend
npm install

# Frontend
cd ../safedocs-frontend
npm install
```

### 5. Configurar .env
```bash
cd ../safedocs-backend
# Copiar archivo de ejemplo
Copy-Item env.example .env  # Windows
# cp env.example .env        # Mac/Linux
```

Edita `.env` y configura:
- `MONGODB_URI` = URI de MongoDB Atlas que copiaste
- `JWT_SECRET` = cualquier texto largo (ej: `mi_secreto_123456`)

### 6. Crear Carpetas
```bash
# En safedocs-backend
mkdir uploads\documents uploads\profiles  # Windows
# mkdir -p uploads/documents uploads/profiles  # Mac/Linux
```

### 7. Ejecutar

**Terminal 1 - Backend:**
```bash
cd safedocs-backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd safedocs-frontend
npm run dev
```

### 8. Crear Usuario Admin
En la terminal del backend (detén con Ctrl+C):
```bash
npm run create-admin
```

Luego reinicia: `npm run dev`

### 9. Abrir en Navegador
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

---

## ✅ Verificación Rápida

- [ ] Backend muestra: "✅ Conexión a MongoDB establecida correctamente"
- [ ] Frontend abre en http://localhost:5173
- [ ] Puedes registrarte con email @unab.cl
- [ ] Puedes hacer login

---

## 🚨 Problemas Comunes

**"Cannot find module"** → `npm install` en la carpeta correspondiente

**"MongoDB connection failed"** → Verifica URI en `.env` y whitelist en Atlas

**"Port 3000 in use"** → Cierra otros programas o cambia puerto en `.env`

---

📖 **Para más detalles, consulta:** `GUIA_PRESENTACION.md`

