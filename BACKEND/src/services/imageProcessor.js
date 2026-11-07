let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp não está instalado. Processamento de imagens desabilitado.');
  sharp = null;
}

const fs = require('fs');
const path = require('path');

/**
 * Processa e redimensiona imagem
 * @param {string} inputPath - Caminho da imagem original
 * @param {Object} options - Opções de processamento
 * @param {number} options.width - Largura máxima (padrão: 1200)
 * @param {number} options.height - Altura máxima (padrão: 1200)
 * @param {number} options.quality - Qualidade JPEG (1-100, padrão: 85)
 * @param {string} options.format - Formato de saída ('jpeg', 'png', 'webp', padrão: 'jpeg')
 * @returns {Promise<string>} - Caminho da imagem processada
 */
const processImage = async (inputPath, options = {}) => {
  if (!sharp) {
    throw new Error('Sharp não está instalado. Execute: npm install sharp');
  }

  const { width = 1200, height = 1200, quality = 85, format = 'jpeg' } = options;

  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(inputPath)) {
      throw new Error('Arquivo de imagem não encontrado');
    }

    // Gerar nome do arquivo processado
    const ext = path.extname(inputPath);
    const baseName = path.basename(inputPath, ext);
    const outputPath = path.join(path.dirname(inputPath), `${baseName}_processed.${format}`);

    // Processar imagem com Sharp
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(format, {
        quality: format === 'png' ? undefined : quality,
        mozjpeg: format === 'jpeg' // Otimização para JPEG
      })
      .toFile(outputPath);

    // Aguardar um pouco antes de deletar o arquivo original para evitar EBUSY
    // O arquivo original será deletado pelo storageService após upload
    // Não deletamos aqui para evitar conflitos

    return outputPath;
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    throw error;
  }
};

/**
 * Cria thumbnail da imagem
 * @param {string} inputPath - Caminho da imagem original
 * @param {Object} options - Opções do thumbnail
 * @param {number} options.size - Tamanho do thumbnail (padrão: 300)
 * @returns {Promise<string>} - Caminho do thumbnail
 */
const createThumbnail = async (inputPath, options = {}) => {
  if (!sharp) {
    throw new Error('Sharp não está instalado. Execute: npm install sharp');
  }

  const { size = 300 } = options;

  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error('Arquivo de imagem não encontrado');
    }

    const ext = path.extname(inputPath);
    const baseName = path.basename(inputPath, ext);
    const dir = path.dirname(inputPath);
    const thumbnailPath = path.join(dir, `${baseName}_thumb${ext}`);

    await sharp(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('Erro ao criar thumbnail:', error);
    throw error;
  }
};

/**
 * Valida se o arquivo é uma imagem válida
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<boolean>} - True se for imagem válida
 */
const validateImage = async filePath => {
  if (!sharp) {
    // Se Sharp não estiver instalado, validar apenas se arquivo existe
    return fs.existsSync(filePath);
  }

  try {
    const metadata = await sharp(filePath).metadata();
    return metadata && metadata.width && metadata.height;
  } catch (error) {
    return false;
  }
};

/**
 * Obtém metadados da imagem
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<Object>} - Metadados da imagem
 */
const getImageMetadata = async filePath => {
  if (!sharp) {
    // Se Sharp não estiver instalado, retornar apenas tamanho do arquivo
    try {
      return {
        width: null,
        height: null,
        format: null,
        size: fs.statSync(filePath).size
      };
    } catch (error) {
      return null;
    }
  }

  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: fs.statSync(filePath).size
    };
  } catch (error) {
    console.error('Erro ao obter metadados:', error);
    return null;
  }
};

module.exports = {
  processImage,
  createThumbnail,
  validateImage,
  getImageMetadata
};
