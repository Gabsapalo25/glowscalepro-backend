// middleware/quizMiddleware.js (CONTEÚDO FINAL E DEFINITIVO)

import crypto from 'crypto';
import pino from 'pino';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const logger = pino();
const csrfTokens = new Set();

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

export function csrfProtection(req, res, next) {
  const csrfToken = req.body.csrfToken || req.headers['x-csrf-token'];
  if (!csrfToken) {
    logger.warn('🚫 Missing CSRF token in request headers or body');
    return res.status(403).json({ error: 'Missing CSRF token' });
  }
  if (csrfTokens.has(csrfToken)) {
    csrfTokens.delete(csrfToken); // Token válido é usado e removido para evitar reuso
    logger.info(`🔓 Token válido usado: ${csrfToken}`);
    return next();
  } else {
    logger.warn(`❌ Token inválido ou expirado: ${csrfToken}`);
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
}

// **IMPORTANTE: A função 'validateQuizPayload' FOI REMOVIDA DESTE ARQUIVO!**
// Ela deve existir APENAS no arquivo 'middleware/validateQuizPayload.js'.

export function configureCors(app, env) {
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
  }));
}

export function configureRateLimit(app) {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP em 15 minutos
    message: { error: 'Too many requests. Please try again later.' }
  });
  // Aplica o rate limit a rotas específicas ou a um prefixo de rota
  // Se '/api' é o prefixo global e a rota do quiz é '/submit-quiz', o caminho completo é '/api/submit-quiz'
  app.use('/api/submit-quiz', apiLimiter);
}

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

export function logRequest(req, res, next) {
  logger.info(`📥 ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });
  next();
}