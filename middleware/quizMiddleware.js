// middleware/quizMiddleware.js

import Joi from 'joi';
import csurf from 'csurf';
import logger from '../utils/logger.js';

/** Proteção CSRF com cookie seguro */
export const csrfProtection = csurf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600 // 1 hora
  }
});

/** Middleware para geração de token CSRF */
export const generateCsrfToken = (req, res, next) => {
  try {
    const token = req.csrfToken();
    req.csrfTokenValue = token; // Armazena para o controller retornar
    next();
  } catch (err) {
    const requestLogger = req.log || logger;
    requestLogger.error({ err }, '❌ Falha ao gerar token CSRF');
    res.status(500).json({ message: 'Erro ao gerar token CSRF.' });
  }
};

/** Middleware para autenticação em ambiente de desenvolvimento */
export const devAuthMiddleware = (req, res, next) => {
  const devKey = process.env.DEV_API_KEY;
  if (process.env.NODE_ENV === 'development' && devKey) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${devKey}`) {
      logger.warn('🔒 Acesso negado - chave de desenvolvimento ausente ou inválida');
      return res.status(401).json({ message: 'Acesso não autorizado' });
    }
  }
  next();
};

/** Middleware para logar as requisições */
export const logRequest = (req, res, next) => {
  const requestLogger = req.log || logger;
  requestLogger.info({
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query
  }, '📥 Nova requisição recebida');
  next();
};

/** Esquema de validação para submissão de quiz */
const quizSubmissionSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.base': 'Nome deve ser texto.',
    'string.empty': 'Nome não pode ser vazio.',
    'string.min': 'Nome deve ter no mínimo {#limit} caracteres.',
    'string.max': 'Nome deve ter no máximo {#limit} caracteres.',
    'any.required': 'Nome é obrigatório.'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido.',
    'string.empty': 'Email não pode ser vazio.',
    'any.required': 'Email é obrigatório.'
  }),
  score: Joi.number().integer().min(0).required().messages({
    'number.base': 'Pontuação deve ser um número.',
    'number.integer': 'Pontuação deve ser um número inteiro.',
    'number.min': 'Pontuação mínima é {#limit}.',
    'any.required': 'Pontuação é obrigatória.'
  }),
  total: Joi.number().integer().min(1).required().messages({
    'number.base': 'Total deve ser um número.',
    'number.integer': 'Total deve ser um número inteiro.',
    'number.min': 'Total mínimo é {#limit}.',
    'any.required': 'Total é obrigatório.'
  }),
  quizId: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.base': 'ID do quiz deve ser texto.',
    'string.empty': 'ID do quiz não pode ser vazio.',
    'string.alphanum': 'ID do quiz deve conter apenas letras e números.',
    'any.required': 'ID do quiz é obrigatório.'
  }),
  countryCode: Joi.string().pattern(/^\+\d{1,3}$/).optional().allow('').messages({
    'string.pattern.base': 'Código do país inválido (ex: +55).'
  }),
  whatsapp: Joi.string().pattern(/^\d{8,15}$/).optional().allow('').messages({
    'string.pattern.base': 'Número de WhatsApp inválido (apenas dígitos, 8 a 15 caracteres).'
  }),
  q4: Joi.string().min(1).max(500).required().messages({
    'string.base': 'Resposta Q4 deve ser texto.',
    'string.empty': 'Resposta Q4 não pode ser vazia.',
    'any.required': 'Resposta Q4 é obrigatória.'
  }),
  consent: Joi.boolean().required().valid(true).messages({
    'boolean.base': 'Consentimento deve ser booleano.',
    'any.required': 'Consentimento é obrigatório.',
    'any.only': 'Você deve consentir para continuar.'
  })
});

/** Middleware de validação com Joi */
export const validateQuizSubmission = (req, res, next) => {
  const requestLogger = req.log || logger;
  const { error } = quizSubmissionSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(err => err.message);
    requestLogger.error({ validationErrors: errors, body: req.body }, '🚫 Falha na validação do quiz');
    return res.status(400).json({ errors });
  }

  requestLogger.info('✅ Dados do quiz validados com sucesso.');
  next();
};
