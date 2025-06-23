// middleware/quizMiddleware.js

import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import pino from 'pino';
import cors from 'cors'; // Importar cors
import rateLimit from 'express-rate-limit'; // Importar express-rate-limit

const logger = pino();
const csrfTokens = new Set();

/**
 * Middleware para geração de token CSRF.
 * Gera um token único e o armazena em memória por 1 hora.
 * @param {import('express').Request} req - O objeto de requisição.
 * @param {import('express').Response} res - O objeto de resposta.
 * @param {import('express').NextFunction} next - A função next do Express.
 */
export function generateCsrfToken(req, res, next) {
  const token = crypto.randomUUID();
  csrfTokens.add(token);

  setTimeout(() => {
    if (csrfTokens.has(token)) {
      csrfTokens.delete(token);
      logger.info(`🗑️ Token removido por expiração: ${token}`);
    }
  }, 3600 * 1000); // 1 hora de expiração

  // Não envie a resposta JSON aqui se este middleware for parte de uma cadeia
  // Em vez disso, adicione o token à requisição para ser usado posteriormente
  req.csrfToken = token; // Adiciona o token à requisição
  next(); // Continua para o próximo middleware/rota
}

/**
 * Middleware de proteção CSRF.
 * Verifica se o token CSRF fornecido na requisição é válido.
 * @param {import('express').Request} req - O objeto de requisição.
 * @param {import('express').Response} res - O objeto de resposta.
 * @param {import('express').NextFunction} next - A função next do Express.
 */
export function csrfProtection(req, res, next) {
  const csrfToken = req.body.csrfToken || req.headers['x-csrf-token'];

  if (!csrfToken) {
    logger.warn('🚫 Missing CSRF token in request headers or body');
    return res.status(403).json({ error: 'Missing CSRF token' });
  }

  if (csrfTokens.has(csrfToken)) {
    csrfTokens.delete(csrfToken); // Remove o token após o uso (single-use token)
    logger.info(`🔓 Token válido usado: ${csrfToken}`);
    return next();
  } else {
    logger.warn(`❌ Token inválido ou expirado: ${csrfToken}`);
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
}

// NOTE: A função validateQuizPayload duplicada foi removida daqui.
// Utilize o validateQuizPayload do arquivo 'middleware/validateQuizPayload.js'
// que usa express-validator para validações mais robustas.

/**
 * Configura o middleware CORS para a aplicação.
 * @param {import('express').Application} app - A instância do aplicativo Express.
 * @param {object} env - Objeto contendo variáveis de ambiente (especialmente FRONTEND_URL).
 */
export function configureCors(app, env) {
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
  }));
}

/**
 * Configura o middleware de rate-limiting para a aplicação.
 * Aplica um limite de requisições a uma rota específica.
 * @param {import('express').Application} app - A instância do aplicativo Express.
 */
export function configureRateLimit(app) {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP por janela
    message: { error: 'Too many requests. Please try again later.' }
  });
  // NOTE: Ajuste a rota se 'send-result' não for mais o endpoint principal do quiz.
  // Se o endpoint principal for '/api/submit-quiz', você deve aplicar o rate limit lá.
  app.use('/api/submit-quiz', apiLimiter); // Exemplo: aplicando ao seu endpoint de submissão de quiz
}

/**
 * Middleware de autenticação básica para ambiente de desenvolvimento.
 * Verifica a presença de uma chave de API para acesso em dev.
 * @param {import('express').Request} req - O objeto de requisição.
 * @param {import('express').Response} res - O objeto de resposta.
 * @param {import('express').NextFunction} next - A função next do Express.
 */
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

/**
 * Middleware de log estruturado para requisições recebidas.
 * @param {import('express').Request} req - O objeto de requisição.
 * @param {import('express').Response} res - O objeto de resposta.
 * @param {import('express').NextFunction} next - A função next do Express.
 */
export function logRequest(req, res, next) {
  logger.info(`📥 ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body // Cuidado com dados sensíveis em logs de produção
  });
  next();
}