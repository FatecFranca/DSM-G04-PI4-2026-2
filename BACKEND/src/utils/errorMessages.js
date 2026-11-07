/**
 * Mensagens de erro padronizadas
 */

const errorMessages = {
  // Erros de autenticação
  UNAUTHORIZED: 'Não autorizado. Token inválido ou expirado.',
  FORBIDDEN: 'Acesso negado. Você não tem permissão para realizar esta ação.',
  INVALID_CREDENTIALS: 'Email ou senha inválidos.',
  TOKEN_EXPIRED: 'Token expirado. Faça login novamente.',
  TOKEN_INVALID: 'Token inválido.',
  EMAIL_NOT_VERIFIED: 'Email não verificado. Verifique seu email antes de continuar.',

  // Erros de validação
  VALIDATION_ERROR: 'Erro de validação. Verifique os dados enviados.',
  MISSING_FIELDS: 'Campos obrigatórios não fornecidos.',
  INVALID_EMAIL: 'Email inválido.',
  INVALID_PASSWORD: 'Senha inválida. Deve ter pelo menos 6 caracteres.',
  INVALID_DATA: 'Dados inválidos.',

  // Erros de recursos
  NOT_FOUND: 'Recurso não encontrado.',
  RECIPE_NOT_FOUND: 'Receita não encontrada.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  RESTRICTION_NOT_FOUND: 'Restrição não encontrada.',
  RATING_NOT_FOUND: 'Avaliação não encontrada.',

  // Erros de conflito
  ALREADY_EXISTS: 'Recurso já existe.',
  EMAIL_ALREADY_EXISTS: 'Email já cadastrado.',
  RECIPE_ALREADY_RATED: 'Você já avaliou esta receita.',
  RESTRICTION_ALREADY_ADDED: 'Restrição já adicionada.',

  // Erros de servidor
  INTERNAL_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  DATABASE_ERROR: 'Erro ao acessar o banco de dados.',
  FILE_UPLOAD_ERROR: 'Erro ao fazer upload do arquivo.',
  EMAIL_SEND_ERROR: 'Erro ao enviar email.',

  // Erros de permissão
  NOT_OWNER: 'Você não é o proprietário deste recurso.',
  CANNOT_DELETE: 'Não é possível deletar este recurso.',
  CANNOT_UPDATE: 'Não é possível atualizar este recurso.',

  // Erros de rate limiting
  TOO_MANY_REQUESTS: 'Muitas requisições. Tente novamente mais tarde.',

  // Erros de upload
  FILE_TOO_LARGE: 'Arquivo muito grande.',
  INVALID_FILE_TYPE: 'Tipo de arquivo não permitido.',
  FILE_REQUIRED: 'Arquivo é obrigatório.'
};

/**
 * Obter mensagem de erro padronizada
 */
const getErrorMessage = (key, defaultMessage = 'Erro desconhecido') => {
  return errorMessages[key] || defaultMessage;
};

/**
 * Criar objeto de erro padronizado
 */
const createError = (statusCode, messageKey, details = null) => {
  const error = new Error(getErrorMessage(messageKey, messageKey));
  error.status = statusCode;
  error.code = messageKey;
  if (details) {
    error.details = details;
  }
  return error;
};

module.exports = {
  errorMessages,
  getErrorMessage,
  createError
};

