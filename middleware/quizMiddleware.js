import Joi from 'joi';
import csurf from 'csurf';
import logger from '../utils/logger.js';

// CSRF protection middleware (uses cookies)
export const csrfProtection = csurf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600, // 1 hour
  },
});

// Sends CSRF token in JSON response
export const generateCsrfToken = (req, res) => {
  const token = req.csrfToken();
  logger.info('✅ CSRF token generated and sent.');
  res.status(200).json({ csrfToken: token });
};

// Request logger middleware
export const logRequest = (req, res, next) => {
  const requestLogger = req.log || logger;
  requestLogger.info({
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    body: req.body,
  }, '📨 Incoming request');
  next();
};

// Dev-only authentication middleware
export const devAuthMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${process.env.DEV_AUTH_TOKEN}`) {
      return res.status(401).json({ message: 'Unauthorized (dev mode)' });
    }
  }
  next();
};

// Joi schema for validating quiz submission
const quizSubmissionSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.base': 'Name must be a string.',
    'string.empty': 'Name is required.',
    'string.min': 'Name must be at least {#limit} characters.',
    'string.max': 'Name must be at most {#limit} characters.',
    'any.required': 'Name is required.',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
  }),
  score: Joi.number().integer().min(0).required().messages({
    'number.base': 'Score must be a number.',
    'number.integer': 'Score must be an integer.',
    'number.min': 'Score cannot be negative.',
    'any.required': 'Score is required.',
  }),
  total: Joi.number().integer().min(1).required().messages({
    'number.base': 'Total must be a number.',
    'number.integer': 'Total must be an integer.',
    'number.min': 'Total must be at least {#limit}.',
    'any.required': 'Total is required.',
  }),
  quizId: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.base': 'Quiz ID must be a string.',
    'string.empty': 'Quiz ID is required.',
    'string.alphanum': 'Quiz ID must contain only letters and numbers.',
    'any.required': 'Quiz ID is required.',
  }),
  countryCode: Joi.string().pattern(/^\+\d{1,3}$/).optional().allow('').messages({
    'string.pattern.base': 'Invalid country code format (e.g., +1).',
  }),
  whatsapp: Joi.string().pattern(/^\d{8,15}$/).optional().allow('').messages({
    'string.pattern.base': 'Invalid WhatsApp number (digits only, 8 to 15 characters).',
  }),
  q4: Joi.string().min(1).max(500).required().messages({
    'string.base': 'Answer to Q4 must be text.',
    'string.empty': 'Q4 answer is required.',
    'any.required': 'Q4 answer is required.',
  }),
  consent: Joi.boolean().valid(true).required().messages({
    'boolean.base': 'Consent must be a boolean.',
    'any.required': 'Consent is required.',
    'any.only': 'You must give consent to proceed.',
  }),
});

// Middleware to validate quiz submission payload
export const validateQuizSubmission = (req, res, next) => {
  const requestLogger = req.log || logger;
  const { error } = quizSubmissionSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(err => err.message);
    requestLogger.error({ validationErrors: errors, body: req.body }, '🚫 Quiz validation failed');
    return res.status(400).json({ errors });
  }

  requestLogger.info('✅ Quiz submission validated successfully.');
  next();
};
