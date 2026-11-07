const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateImage, processImage, createThumbnail } = require('../services/imageProcessor');

// Criar diretório de uploads se não existir
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Extensões permitidas
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/**
 * Valida tipo de arquivo por MIME type
 */
const validateMimeType = mimetype => {
  return ALLOWED_MIME_TYPES.includes(mimetype);
};

/**
 * Valida extensão do arquivo
 */
const validateExtension = filename => {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
};

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único: timestamp + número aleatório + extensão
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// Filtro de tipos de arquivo permitidos (melhorado)
const fileFilter = (req, file, cb) => {
  // Validar MIME type
  if (!validateMimeType(file.mimetype)) {
    return cb(
      new Error(
        `Tipo de arquivo não permitido. Tipos permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`
      ),
      false
    );
  }

  // Validar extensão
  if (!validateExtension(file.originalname)) {
    return cb(
      new Error(
        `Extensão não permitida. Extensões permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`
      ),
      false
    );
  }

  cb(null, true);
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB padrão
  }
});

/**
 * Storage específico para imagens de receitas
 */
const recipeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `recipe-${uniqueSuffix}${ext}`);
  }
});

const recipeUpload = multer({
  storage: recipeStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB padrão
  }
});

/**
 * Middleware para upload de foto de perfil
 * Aceita apenas um arquivo com o campo 'photo'
 */
const uploadProfilePhoto = upload.single('photo');

/**
 * Middleware para upload de imagem de receita
 * Aceita apenas um arquivo com o campo 'image'
 */
const uploadRecipeImage = recipeUpload.single('image');

/**
 * Middleware para validar upload (obrigatório)
 */
const validateUpload = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum arquivo enviado. Use o campo "photo" para enviar a imagem.'
    });
  }

  try {
    // Verificar tamanho do arquivo
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB padrão
    if (req.file.size > maxSize) {
      // Deletar arquivo se exceder o tamanho
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`
      });
    }

    // Validar se é uma imagem válida
    const isValid = await validateImage(req.file.path);
    if (!isValid) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Arquivo não é uma imagem válida ou está corrompido.'
      });
    }

    next();
  } catch (error) {
    console.error('Erro na validação de upload:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: 'Erro ao validar arquivo'
    });
  }
};

/**
 * Middleware para validar upload opcional (para atualizações)
 */
const validateUploadOptional = async (req, res, next) => {
  if (req.file) {
    try {
      // Verificar tamanho do arquivo
      const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        // Deletar arquivo se exceder o tamanho
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`
        });
      }

      // Validar se é uma imagem válida
      const isValid = await validateImage(req.file.path);
      if (!isValid) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Arquivo não é uma imagem válida ou está corrompido.'
        });
      }
    } catch (error) {
      console.error('Erro na validação de upload:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao validar arquivo'
      });
    }
  }
  next();
};


/**
 * Middleware para processar imagem após upload
 * Redimensiona e otimiza a imagem
 */
const processUploadedImage = async (req, res, next) => {
  if (req.file) {
    try {
      const shouldProcess = process.env.PROCESS_IMAGES !== 'false'; // Processar por padrão

      if (shouldProcess) {
        const processedPath = await processImage(req.file.path, {
          width: parseInt(process.env.IMAGE_MAX_WIDTH) || 1200,
          height: parseInt(process.env.IMAGE_MAX_HEIGHT) || 1200,
          quality: parseInt(process.env.IMAGE_QUALITY) || 85,
          format: process.env.IMAGE_FORMAT || 'jpeg'
        });

        // Salvar caminho do arquivo processado e original
        req.file.processedPath = processedPath;
        req.file.originalPath = req.file.path;
        req.file.path = processedPath; // Atualizar path para usar o processado

        // Criar thumbnail se configurado
        if (process.env.CREATE_THUMBNAILS === 'true') {
          const thumbnailPath = await createThumbnail(processedPath, {
            size: parseInt(process.env.THUMBNAIL_SIZE) || 300
          });
          req.file.thumbnailPath = thumbnailPath;
        }
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      // Não falhar a requisição se o processamento falhar
      // A imagem original ainda está disponível
    }
  }
  next();
};

module.exports = {
  uploadProfilePhoto,
  uploadRecipeImage,
  validateUpload,
  validateUploadOptional,
  processUploadedImage
};
