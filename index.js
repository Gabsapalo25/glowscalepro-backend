// index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import quizRoutes from './routes/quizRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import logger, { addRequestId } from './utils/logger.js';

const app = express();

// Middleware para gerar ID de requisição e logger com contexto
app.use(addRequestId);

// Middlewares para leitura do corpo das requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configurado com whitelist de origens confiáveis
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.MASTERTOOLS_UNSUBSCRIBE_URL,
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const msg = `🚫 CORS: Origin not allowed - ${origin}`;
    logger.warn({ origin }, msg);
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Segurança com Helmet
app.use(helmet());

// Rate limiting para evitar abusos
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.log.warn('🚨 Rate limit exceeded');
    res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }
}));

// Cookie parser e CSRF protection
app.use(cookieParser());

app.use(csurf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600 // 1 hora
  }
}));

// Rota de teste (ping)
app.get('/', (req, res) => {
  req.log.info('📥 Root endpoint accessed');
  res.status(200).send('✨ GlowScalePro Backend API is running!');
});

// Rotas principais
app.use('/api', quizRoutes);

// 404 handler
app.use(notFound);

// Error handler global
app.use(errorHandler);

// Inicialização do servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
