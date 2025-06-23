import Joi from 'joi';
import csurf from 'csurf';
import logger from '../utils/logger.js';

// Middleware de proteção CSRF (baseado em cookie)
export const csrfProtection = csurf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600 // 1 hora
  }
});

// Middleware para gerar e expor o token CSRF antes de enviar ao frontend
export const generateCsrfToken = (req, res, next) => {
  try {
    const token = req.csrfToken();
    req.csrfTokenGenerated = token;
    next();
  } catch (err) {
    next(err);
  }
};

// Middleware para autenticação básica no ambiente de desenvolvimento
export const devAuthMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (token !== process.env.DEV_AUTH_TOKEN) {
      const requestLogger = req.log || logger;
      requestLogger.warn({ ip: req.ip }, '🔒 Acesso negado: token de desenvolvimento inválido.');
      return res.status(401).json({ error: 'Acesso não autorizado (dev).' });
    }
  }
  next();
};

// Middleware para logar todas as requisições (com requestId, se houver)
export const logRequest = (req, res, next) => {
  const requestLogger = req.log || logger;
  requestLogger.info({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    body: req.body
  }, '📨 Requisição recebida');
  next();
};

// Esquema Joi para validar submissão de quiz
const quizSubmissionSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Nome não pode ser vazio.',
    'string.min': 'Nome deve ter no mínimo {#limit} caracteres.',
    'string.max': 'Nome deve ter no máximo {#limit} caracteres.',
    'any.required': 'Nome é obrigatório.'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido.',
    'any.required': 'Email é obrigatório.'
  }),
  score: Joi.number().integer().min(0).required().messages({
    'number.base': 'Pontuação deve ser um número.',
    'any.required': 'Pontuação é obrigatória.'
  }),
  total: Joi.number().integer().min(1).required().messages({
    'any.required': 'Total de perguntas é obrigatório.'
  }),
  quizId: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.alphanum': 'ID do quiz deve conter apenas letras e números.',
    'any.required': 'ID do quiz é obrigatório.'
  }),
  countryCode: Joi.string().pattern(/^\+\d{1,3}$/).optional().allow('').messages({
    'string.pattern.base': 'Código do país inválido (ex: +244).'
  }),
  whatsapp: Joi.string().pattern(/^\d{8,15}$/).optional().allow('').messages({
    'string.pattern.base': 'Número de WhatsApp inválido.'
  }),
  q4: Joi.string().min(1).max(500).required().messages({
    'any.required': 'Resposta da Q4 é obrigatória.'
  }),
  consent: Joi.boolean().required().valid(true).messages({
    'any.only': 'Você deve consentir para continuar.'
  })
});

// Middleware de validação usando Joi
export const validateQuizSubmission = (req, res, next) => {
  const requestLogger = req.log || logger;

  const { error } = quizSubmissionSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    requestLogger.error({ errors, body: req.body }, '❌ Falha na validação do quiz');
    return res.status(400).json({ errors });
  }

  requestLogger.info('✅ Submissão do quiz validada com sucesso.');
  next();
};
