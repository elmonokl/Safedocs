# SafeDocs UNAB

Plataforma para intercambio seguro de documentos académicos. Monorepo con backend (Node/Express + MongoDB) y frontend (React + Vite + Tailwind).

### Requisitos
- Node.js 18+
- MongoDB 6+

### Estructura
```
Safedocs_codigo/
├─ safedocs-backend/     # API REST (Express)
│  ├─ src/
│  └─ uploads/           # Archivos subidos (ignorado por git)
└─ safedocs-frontend/    # App React (Vite + Tailwind)
   └─ src/
```

### Configuración rápida
1) Clonar/Descargar el repositorio.
2) Backend: copiar el `.env` desde `safedocs-backend/env.example` y completar valores.
3) Frontend: crear `.env` en `safedocs-frontend/` si necesitas URL distinta:
```
VITE_API_URL=http://localhost:3000
```

### Backend (API)
```
cd safedocs-backend
npm install
npm run dev   # inicia en http://localhost:3000
```
- Base de datos: configurar `MONGODB_URI` en `.env`.
- Scripts útiles (en `safedocs-backend/scripts/`): crear super admin, usuarios de prueba, etc.

### Frontend (Web)
```
cd safedocs-frontend
npm install
npm run dev   # inicia en http://localhost:5173
```
- Variables en tiempo de compilación: `VITE_API_URL`.

### Funcionalidades destacadas (actual)
- Subida de documentos con arrastrar/soltar y listado de "Tus Documentos".
- Descarga con conteo local de descargas.
- Sidebar fijo con acceso a: Mis Documentos, Subir Documento y Modo nocturno.
- Menú de usuario con opciones adicionales (perfil, amigos, admin si aplica).

### Desarrollo
- Código del frontend organizado en `src/components`, `src/contexts` y `src/utils`.
- Estilos con Tailwind (`safedocs-frontend/tailwind.config.js`).
- API helper en `safedocs-frontend/src/utils/api.js`.

### Notas
- La carpeta `uploads/` del backend está en `.gitignore`.
- Si cambias puertos/URLs, sincroniza `VITE_API_URL` con el puerto del backend.

### Licencia
Uso académico/educativo.
