// middleware/quizMiddleware.js

import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import pino from 'pino';

const logger = pino();
const csrfTokens = new Set();

// Middleware para geração de token CSRF
export function generateCsrfToken(req, res, next) {
  const token = crypto.randomUUID();
  csrfTokens.add(token);

  setTimeout(() => {
    if (csrfTokens.has(token)) {
      csrfTokens.delete(token);
      logger.info(`🗑️ Token removido por expiração: ${token}`);
    }
  }, 3600 * 1000); // 1 hora

  req.csrfToken = token;
  res.json({ csrfToken: token });
}

// Middleware de proteção CSRF
export function csrfProtection(req, res, next) {
  const csrfToken = req.body.csrfToken || req.headers['x-csrf-token'];

  if (!csrfToken) {
    logger.warn('🚫 Missing CSRF token in request headers or body');
    return res.status(403).json({ error: 'Missing CSRF token' });
  }

  if (csrfTokens.has(csrfToken)) {
    csrfTokens.delete(csrfToken);
    logger.info(`🔓 Token válido usado: ${csrfToken}`);
    return next();
  } else {
    logger.warn(`❌ Token inválido ou expirado: ${csrfToken}`);
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
}

// Middleware de validação de payload do quiz
export function validateQuizPayload(req, res, next) {
  const { name, email, score, total, quizTitle, countryCode, whatsapp, q4, consent } = req.body;

  // Sanitização de campos
  req.body.sanitizedName = sanitizeHtml(name);
  req.body.sanitizedEmail = sanitizeHtml(email);
  req.body.sanitizedQ4 = sanitizeHtml(q4);

  // Validações
  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Invalid name. Must be at least 2 characters.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (typeof score !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ error: 'Score and total must be numbers.' });
  }

  if (!quizTitle) {
    return res.status(400).json({ error: 'Quiz title is required.' });
  }

  if (!q4) {
    return res.status(400).json({ error: 'Please select an option for interest level.' });
  }

  if (typeof consent !== 'boolean') {
    return res.status(400).json({ error: 'Consent must be a boolean.' });
  }

  if (whatsapp && !/^\d{8,15}$/.test(whatsapp)) {
    return res.status(400).json({ error: 'Invalid WhatsApp number.' });
  }

  if (countryCode && !/^\+\d{1,3}$/.test(countryCode)) {
    return res.status(400).json({ error: 'Invalid country code.' });
  }

  next();
}

// Middleware de CORS com credenciais
export function configureCors(app, env) {
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
  }));
}

// Middleware de rate-limiting
export function configureRateLimit(app) {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests. Please try again later.' }
  });
  app.use('/send-result', apiLimiter);
}

// Middleware de autenticação básica (dev)
export function devAuthMiddleware(req, res, next) {
  if (process.env.NODE_ENV === 'development' && process.env.DEV_API_KEY) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.DEV_API_KEY) {
      logger.warn('❌ Unauthorized access attempt: Invalid DEV_API_KEY');
      return res.status(401).json({ error: 'Unauthorized: Invalid DEV_API_KEY' });
    }
  }
  next();
}

// Middleware de log estruturado
export function logRequest(req, res, next) {
  logger.info(`📥 ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });
  next();
}