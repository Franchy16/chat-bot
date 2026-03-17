export function buildOpenApiSpec({ title = 'Chatbot API', version = '1.0.0' } = {}) {
  return {
    openapi: '3.0.3',
    info: {
      title,
      version
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'admin123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Đăng nhập thành công' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                username: { type: 'string' },
                role: { type: 'string', example: 'admin' }
              }
            }
          }
        },
        VerifyResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Token hợp lệ' },
            user: { type: 'object' }
          }
        },
        Settings: {
          type: 'object',
          properties: {
            ai: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean', example: true },
                model: { type: 'string', example: 'gemini-3-pro-preview' },
                systemInstruction: { type: 'string' }
              }
            },
            fuzzy: {
              type: 'object',
              properties: {
                threshold: { type: 'number', minimum: 0, maximum: 1, example: 0.4 }
              }
            },
            importExport: {
              type: 'object',
              properties: {
                maxFileSizeMB: { type: 'integer', minimum: 1, maximum: 20, example: 5 },
                skipDuplicates: { type: 'boolean', example: true }
              }
            }
          }
        },
        SettingsResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/Settings' }
          }
        },
        KnowledgeEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1710000000000' },
            keyword: { type: 'string' },
            answer: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        KnowledgeListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/KnowledgeEntry' } },
            total: { type: 'integer', example: 10 }
          }
        },
        KnowledgeCreateRequest: {
          type: 'object',
          required: ['keyword', 'answer'],
          properties: {
            keyword: { type: 'string' },
            answer: { type: 'string' }
          }
        },
        KnowledgeMutationResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { $ref: '#/components/schemas/KnowledgeEntry' }
          }
        },
        ChatRequest: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', example: 'Học phí học kỳ này là bao nhiêu?' }
          }
        },
        ChatResponse: {
          type: 'object',
          properties: {
            reply: { type: 'string' },
            source: { type: 'string', example: 'database' }
          }
        },
        StatsResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                totals: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    withCreatedAt: { type: 'integer' },
                    withUpdatedAt: { type: 'integer' }
                  }
                },
                chart: {
                  type: 'object',
                  properties: {
                    days: { type: 'array', items: { type: 'string' } },
                    created: { type: 'array', items: { type: 'integer' } },
                    updated: { type: 'array', items: { type: 'integer' } }
                  }
                },
                latest: { type: 'array', items: { type: 'object' } },
                topLongestAnswers: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Auth' },
      { name: 'Chat' },
      { name: 'Settings' },
      { name: 'Knowledge' },
      { name: 'Stats' },
      { name: 'Admins' }
    ],
    paths: {
      '/api/login': {
        post: {
          tags: ['Auth'],
          summary: 'Admin login (JWT)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
          },
          responses: {
            200: {
              description: 'OK',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } }
            },
            400: { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      },
      '/api/verify': {
        post: {
          tags: ['Auth'],
          summary: 'Verify JWT token',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyResponse' } } } },
            401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      },
      '/api/admins': {
        get: {
          tags: ['Admins'],
          summary: 'List admin users',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'OK' }
          }
        },
        post: {
          tags: ['Admins'],
          summary: 'Create admin user',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'OK' },
            400: { description: 'Bad Request' }
          }
        }
      },
      '/api/admins/{id}': {
        put: {
          tags: ['Admins'],
          summary: 'Update admin user (username/password)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'OK' },
            400: { description: 'Bad Request' },
            404: { description: 'Not Found' }
          }
        },
        delete: {
          tags: ['Admins'],
          summary: 'Delete admin user',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'OK' },
            400: { description: 'Bad Request' },
            404: { description: 'Not Found' }
          }
        }
      },
      '/api/settings': {
        get: {
          tags: ['Settings'],
          summary: 'Get app settings',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/SettingsResponse' } } } }
          }
        },
        put: {
          tags: ['Settings'],
          summary: 'Update app settings',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Settings' } } }
          },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/SettingsResponse' } } } },
            400: { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      },
      '/api/knowledge': {
        get: {
          tags: ['Knowledge'],
          summary: 'List knowledge base entries',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/KnowledgeListResponse' } } } }
          }
        },
        post: {
          tags: ['Knowledge'],
          summary: 'Create a knowledge entry',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/KnowledgeCreateRequest' } } }
          },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/KnowledgeMutationResponse' } } } },
            400: { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      },
      '/api/knowledge/{id}': {
        put: {
          tags: ['Knowledge'],
          summary: 'Update a knowledge entry',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/KnowledgeCreateRequest' } } }
          },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/KnowledgeMutationResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        },
        delete: {
          tags: ['Knowledge'],
          summary: 'Delete a knowledge entry',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/KnowledgeMutationResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      },
      '/api/knowledge/export': {
        get: {
          tags: ['Knowledge'],
          summary: 'Export knowledge base to Excel',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Excel file',
              content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } }
              }
            }
          }
        }
      },
      '/api/knowledge/import': {
        post: {
          tags: ['Knowledge'],
          summary: 'Import knowledge base from Excel',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'OK' },
            400: { description: 'Bad Request' }
          }
        }
      },
      '/api/knowledge/template': {
        get: {
          tags: ['Knowledge'],
          summary: 'Download Excel import template',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Excel file',
              content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } }
              }
            }
          }
        }
      },
      '/api/stats': {
        get: {
          tags: ['Stats'],
          summary: 'Get knowledge base stats',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/StatsResponse' } } } }
          }
        }
      },
      '/api/chat': {
        post: {
          tags: ['Chat'],
          summary: 'Chat endpoint (Fuse + Gemini)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatRequest' } } }
          },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatResponse' } } } },
            400: { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      }
    }
  };
}

