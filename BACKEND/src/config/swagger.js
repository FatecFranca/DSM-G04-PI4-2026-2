/**
 * Configuração do Swagger/OpenAPI
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SafeBite API',
      version: '1.0.0',
      description: 'API RESTful para plataforma de receitas com foco em restrições alimentares',
      contact: {
        name: 'SafeBite Team',
        email: 'support@safebite.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001/api',
        description: 'Servidor de desenvolvimento'
      },
      {
        url: 'https://api.safebite.com/api',
        description: 'Servidor de produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint de login'
        }
      },
      schemas: {
        // Modelos de dados
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID do usuário',
              example: 1
            },
            nome_completo: {
              type: 'string',
              description: 'Nome completo do usuário',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
              example: 'joao@example.com'
            },
            telefone: {
              type: 'string',
              nullable: true,
              description: 'Telefone do usuário',
              example: '11999999999'
            },
            idade: {
              type: 'integer',
              nullable: true,
              description: 'Idade do usuário',
              example: 30
            },
            foto_perfil: {
              type: 'string',
              nullable: true,
              description: 'URL da foto de perfil',
              example: 'http://localhost:3001/uploads/foto.jpg'
            },
            email_verificado: {
              type: 'boolean',
              description: 'Indica se o email foi verificado',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização'
            }
          }
        },
        Recipe: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID da receita',
              example: 1
            },
            titulo: {
              type: 'string',
              description: 'Título da receita',
              example: 'Bolo de Chocolate'
            },
            descricao: {
              type: 'string',
              nullable: true,
              description: 'Descrição da receita',
              example: 'Delicioso bolo de chocolate caseiro'
            },
            ingredientes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Lista de ingredientes',
              example: ['farinha', 'açúcar', 'chocolate', 'ovos']
            },
            modo_preparo: {
              type: 'string',
              description: 'Modo de preparo da receita',
              example: 'Misture todos os ingredientes...'
            },
            tempo_preparo: {
              type: 'string',
              nullable: true,
              description: 'Tempo de preparo',
              example: '30 minutos'
            },
            rendimento: {
              type: 'string',
              nullable: true,
              description: 'Rendimento da receita',
              example: '4 porções'
            },
            imagem_url: {
              type: 'string',
              nullable: true,
              description: 'URL da imagem da receita',
              example: 'http://localhost:3001/uploads/recipe.jpg'
            },
            status: {
              type: 'string',
              enum: ['publicada', 'rascunho'],
              description: 'Status da receita',
              example: 'publicada'
            },
            user_id: {
              type: 'integer',
              description: 'ID do autor da receita',
              example: 1
            },
            visualizacoes: {
              type: 'integer',
              description: 'Número de visualizações',
              example: 100
            },
            average_rating: {
              type: 'number',
              nullable: true,
              description: 'Avaliação média',
              example: 4.5
            },
            rating_count: {
              type: 'integer',
              description: 'Número de avaliações',
              example: 20
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Restriction: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID da restrição',
              example: 1
            },
            nome: {
              type: 'string',
              description: 'Nome da restrição',
              example: 'Glúten'
            },
            palavras_chave: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Palavras-chave relacionadas',
              example: ['trigo', 'cevada', 'centeio']
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Mensagem de erro',
              example: 'Erro de validação'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Email inválido'
                  }
                }
              },
              description: 'Lista de erros de validação'
            },
            code: {
              type: 'string',
              description: 'Código do erro',
              example: 'VALIDATION_ERROR'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Mensagem de sucesso',
              example: 'Operação realizada com sucesso'
            },
            data: {
              type: 'object',
              description: 'Dados da resposta'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de autenticação inválido ou ausente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Não autorizado. Token inválido ou expirado.',
                code: 'UNAUTHORIZED'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erro de validação',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Erro de validação',
                errors: [
                  {
                    field: 'email',
                    message: 'Email inválido'
                  }
                ]
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Recurso não encontrado.',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Acesso negado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Acesso negado. Você não tem permissão para realizar esta ação.',
                code: 'FORBIDDEN'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Erro interno do servidor. Tente novamente mais tarde.',
                code: 'INTERNAL_ERROR'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints de autenticação e autorização'
      },
      {
        name: 'Usuários',
        description: 'Endpoints relacionados a usuários'
      },
      {
        name: 'Receitas',
        description: 'Endpoints relacionados a receitas'
      },
      {
        name: 'Restrições',
        description: 'Endpoints relacionados a restrições alimentares'
      },
      {
        name: 'Avaliações',
        description: 'Endpoints relacionados a avaliações de receitas'
      },
      {
        name: 'Favoritos',
        description: 'Endpoints relacionados a receitas favoritas'
      },
      {
        name: 'Health',
        description: 'Endpoints de saúde e status da API'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/routes/*.swagger.js',
    './src/controllers/*.js',
    './src/server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

