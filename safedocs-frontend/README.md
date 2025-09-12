# SafeDocs UNAB - Frontend

Este es un prototipo de interfaz de usuario para el proyecto **SafeDocs UNAB**, desarrollado con React, Vite y Tailwind CSS.

## 🚀 Cómo ejecutar el proyecto

### 1. Requisitos
- Node.js (v16 o superior)
- npm

### 2. Instalación

```bash
npm install
```

### 3. Configurar Tailwind CSS

Ya está preconfigurado en este proyecto:

- `tailwind.config.js`
- `postcss.config.js`
- `src/index.css`

### 4. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre en tu navegador: `http://localhost:5173`

### 5. Comandos adicionales

```bash
# Linting del código
npm run lint

# Linting con auto-fix
npm run lint:fix

# Build para producción
npm run build
```

---

## 🆕 Nuevas Funcionalidades Implementadas

### ✅ **Gestión de Estado Global**
- **AuthContext**: Manejo centralizado de autenticación
- **DocumentContext**: Gestión de documentos con búsqueda y filtros
- **Persistencia**: Datos guardados en localStorage

### ✅ **Sistema de Notificaciones**
- **Toast notifications**: Mensajes de éxito y error
- **Confirm dialogs**: Confirmaciones para acciones críticas
- **Loading states**: Indicadores de carga mejorados

### ✅ **Funcionalidades Avanzadas**
- **Búsqueda en tiempo real**: Filtrado por título y descripción
- **Filtros por categoría**: Filtrado por tipo de documento
- **Ordenamiento**: Por fecha, título y descargas
- **Validaciones robustas**: Formularios con validación completa

### ✅ **Mejoras de UX/UI**
- **Accesibilidad**: Atributos ARIA y navegación por teclado
- **Responsive design**: Optimizado para móviles y desktop
- **Animaciones fluidas**: Transiciones con Framer Motion
- **Iconografía moderna**: Iconos de Lucide React

### ✅ **Seguridad y Validaciones**
- **Validación de correos**: Solo correos @unab.cl
- **Validación de contraseñas**: Mínimo 6 caracteres
- **Sanitización de inputs**: Prevención de XSS
- **Confirmaciones**: Para acciones destructivas

---

## 📁 Estructura de Carpetas

```
safedocs-frontend/
├── index.html
├── README.md
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── vite.config.js
├── .eslintrc.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── DocumentContext.jsx
│   ├── components/
│   │   ├── Toast.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── SearchBar.jsx
│   │   └── LoadingSpinner.jsx
│   └── componentes/
│       ├── Header.jsx
│       ├── Hero.jsx
│       ├── BotonesInicio.jsx
│       ├── Login.jsx
│       ├── Registro.jsx
│       ├── Dashboard.jsx
│       ├── VistaAmigos.jsx
│       ├── VistaPerfil.jsx
│       ├── MenuHamburguesa.jsx
│       ├── ModalDocumento.jsx
│       └── VistaDocumento.jsx
```

---

## 🎯 Funcionalidades Principales

### **🔐 Autenticación**
- Login con validación de correos institucionales
- Registro con validaciones completas
- Persistencia de sesión
- Logout con confirmación

### **📄 Gestión de Documentos**
- Subida de archivos con drag & drop
- Categorización automática
- Búsqueda y filtros avanzados
- Vista previa de documentos
- Descarga y eliminación segura

### **👤 Perfil de Usuario**
- Edición de datos personales
- Cambio de carrera
- Avatar personalizado
- Estado de cuenta

### **🔍 Búsqueda y Filtros**
- Búsqueda en tiempo real
- Filtros por categoría
- Ordenamiento múltiple
- Resultados paginados

---

## 🛠️ Tecnologías Utilizadas

### **Frontend Stack:**
- **React 18.2.0**: Framework principal
- **Vite**: Build tool y servidor de desarrollo
- **Tailwind CSS**: Framework de estilos
- **Framer Motion**: Animaciones y transiciones
- **Lucide React**: Iconografía moderna

### **Herramientas de Desarrollo:**
- **ESLint**: Linting del código
- **jsx-a11y**: Accesibilidad
- **React Hooks**: Gestión de estado

---

## 🎨 Características de Diseño

### **Paleta de Colores:**
- **Primario**: Indigo (#6366f1)
- **Secundario**: Gris (#6b7280)
- **Éxito**: Verde (#10b981)
- **Error**: Rojo (#ef4444)
- **Advertencia**: Amarillo (#f59e0b)

### **Efectos Visuales:**
- **Glassmorphism**: Efectos de cristal
- **Gradientes**: Fondos modernos
- **Sombras**: Profundidad visual
- **Animaciones**: Transiciones fluidas

---

## 🔮 Próximos Pasos

### **Funcionalidades Futuras:**
1. **Backend API** para persistencia real
2. **Sistema de archivos** para documentos
3. **Autenticación JWT** completa
4. **Base de datos** PostgreSQL/MongoDB
5. **Notificaciones** en tiempo real
6. **Compartir documentos** entre usuarios
7. **Versiones** de documentos
8. **Comentarios** y calificaciones

### **Mejoras Técnicas:**
1. **TypeScript** para type safety
2. **Tests unitarios** con Jest
3. **PWA** capabilities
4. **Internacionalización** (i18n)
5. **Optimización** de performance
6. **SEO** mejorado

---

## 📝 Notas de Desarrollo

- El proyecto usa **Context API** para gestión de estado
- **LocalStorage** para persistencia temporal
- **Simulación de API** para demostración
- **Responsive design** mobile-first
- **Accesibilidad** WCAG 2.1 compliant

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
