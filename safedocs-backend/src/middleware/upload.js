const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegura que un directorio exista
function ensureDirExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
}

// Crea un uploader con destino y validaciones configurables
function createUpload({ destination, maxFileSizeBytes, allowedExtensions, allowedMimeTypes, filenamePrefix }) {
  ensureDirExists(destination);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${filenamePrefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: maxFileSizeBytes },
    fileFilter: (req, file, cb) => {
      if (allowedMimeTypes && allowedMimeTypes.length > 0) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new Error('Tipo de archivo no permitido'));
        }
      }

      if (allowedExtensions && allowedExtensions.length > 0) {
        const ext = path.extname(file.originalname).toLowerCase().substring(1);
        if (!allowedExtensions.includes(ext)) {
          return cb(new Error(`Solo se permiten archivos: ${allowedExtensions.join(', ')}`));
        }
      }
      cb(null, true);
    }
  });

  return upload;
}

// Uploader para documentos
const documentUpload = createUpload({
  destination: path.join(__dirname, '../../uploads/documents'),
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024, // 50MB por defecto
  allowedExtensions: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,ppt,pptx').split(','),
  allowedMimeTypes: [],
  filenamePrefix: 'document'
});

// Uploader para perfiles (imágenes)
const profileUpload = createUpload({
  destination: path.join(__dirname, '../../uploads/profiles'),
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
  filenamePrefix: 'profile'
});

module.exports = {
  documentUpload,
  profileUpload
};



