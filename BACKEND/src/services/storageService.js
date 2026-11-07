const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Serviço de armazenamento de arquivos
 * Suporta armazenamento local, ImgBB e Imgur (gratuitos)
 */

/**
 * Função auxiliar para deletar arquivo com retry (evita erros EBUSY)
 */
const safeUnlink = async filePath => {
  if (!filePath || !fs.existsSync(filePath)) return;

  const maxRetries = 5;
  const delay = 200; // ms

  for (let i = 0; i < maxRetries; i++) {
    try {
      fs.unlinkSync(filePath);
      return;
    } catch (err) {
      if (err.code === 'EBUSY' && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      // Se não for EBUSY ou última tentativa, logar e continuar
      logger.warn('Erro ao deletar arquivo temporário', { filePath, error: err.message });
      return;
    }
  }
};

/**
 * Salva arquivo localmente
 * @param {string} filePath - Caminho do arquivo
 * @param {string} destination - Diretório de destino
 * @returns {Promise<string>} - URL do arquivo salvo
 */
const saveLocal = async (filePath, destination) => {
  try {
    const fileName = path.basename(filePath);
    const destPath = path.join(destination, fileName);

    // Criar diretório se não existir
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    // Copiar arquivo para destino
    fs.copyFileSync(filePath, destPath);

    // Retornar URL relativa (será servida via Express static em /uploads)
    return `/uploads/${fileName}`;
  } catch (error) {
    logger.error('Erro ao salvar arquivo localmente', error);
    throw error;
  }
};

/**
 * Salva arquivo no ImgBB (gratuito)
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<string>} - URL do arquivo no ImgBB
 */
const saveToImgBB = async filePath => {
  try {
    let FormData;
    try {
      FormData = require('form-data');
    } catch (error) {
      throw new Error('form-data não está instalado. Execute: npm install form-data');
    }

    const https = require('https');

    // ImgBB requer API key (gratuita em https://api.imgbb.com/)
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error(
        'IMGBB_API_KEY não configurado. Obtenha uma chave gratuita em https://api.imgbb.com/'
      );
    }

    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('key', apiKey);
      form.append('image', fs.createReadStream(filePath));

      form.submit('https://api.imgbb.com/1/upload', (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', async () => {
          try {
            const result = JSON.parse(data);
            if (result.success && result.data && result.data.url) {
              // Deletar arquivo local após upload (com retry para evitar EBUSY)
              await safeUnlink(filePath);
              resolve(result.data.url);
            } else {
              reject(
                new Error(
                  result.error?.message || result.status_txt || 'Erro ao fazer upload no ImgBB'
                )
              );
            }
          } catch (parseErr) {
            reject(new Error('Erro ao processar resposta do ImgBB: ' + parseErr.message));
          }
        });

        res.on('error', error => {
          reject(error);
        });
      });
    });
  } catch (error) {
    logger.error('Erro ao salvar no ImgBB', error);
    throw error;
  }
};

/**
 * Salva arquivo no Imgur (gratuito)
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<string>} - URL do arquivo no Imgur
 */
const saveToImgur = async filePath => {
  try {
    let FormData;
    try {
      FormData = require('form-data');
    } catch (error) {
      throw new Error('form-data não está instalado. Execute: npm install form-data');
    }

    const https = require('https');

    // Imgur requer Client ID (gratuito)
    const clientId = process.env.IMGUR_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        'IMGUR_CLIENT_ID não configurado. Obtenha em https://api.imgur.com/oauth2/addclient'
      );
    }

    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('image', fs.createReadStream(filePath));

      const options = {
        hostname: 'api.imgur.com',
        path: '/3/image',
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${clientId}`,
          ...form.getHeaders()
        }
      };

      const req = https.request(options, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', async () => {
          try {
            const result = JSON.parse(data);
            if (result.success && result.data && result.data.link) {
              // Deletar arquivo local após upload (com retry para evitar EBUSY)
              await safeUnlink(filePath);
              resolve(result.data.link);
            } else {
              reject(new Error(result.data?.error || 'Erro ao fazer upload no Imgur'));
            }
          } catch (parseErr) {
            reject(new Error('Erro ao processar resposta do Imgur: ' + parseErr.message));
          }
        });

        res.on('error', error => {
          reject(error);
        });
      });

      req.on('error', error => {
        reject(error);
      });

      form.pipe(req);
    });
  } catch (error) {
    logger.error('Erro ao salvar no Imgur', error);
    throw error;
  }
};

/**
 * Salva arquivo usando o método configurado
 * @param {string} filePath - Caminho do arquivo
 * @param {string} fileName - Nome do arquivo
 * @param {string} type - Tipo de upload ('profile', 'recipe')
 * @returns {Promise<string>} - URL do arquivo salvo
 */
const saveFile = async (filePath, fileName, type = 'recipe') => {
  const storageType = process.env.STORAGE_TYPE || 'local';

  switch (storageType) {
    case 'imgbb':
      return await saveToImgBB(filePath);

    case 'imgur':
      return await saveToImgur(filePath);

    case 'local':
    default:
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      return await saveLocal(filePath, uploadDir);
  }
};

/**
 * Deleta arquivo do storage
 * @param {string} fileUrl - URL do arquivo
 * @returns {Promise<boolean>} - True se deletado com sucesso
 */
const deleteFile = async fileUrl => {
  try {
    const storageType = process.env.STORAGE_TYPE || 'local';

    if (storageType === 'local') {
      // Remover barra inicial se houver
      const filePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
      const fullPath = path.join(process.cwd(), filePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    }

    // Para ImgBB e Imgur, não é possível deletar via API gratuita
    // Os arquivos permanecerão no servidor deles
    // Retornamos true para não quebrar o fluxo
    return true;
  } catch (error) {
    logger.error('Erro ao deletar arquivo', error, { fileUrl });
    return false;
  }
};

module.exports = {
  saveFile,
  deleteFile,
  saveLocal,
  saveToImgBB,
  saveToImgur
};
