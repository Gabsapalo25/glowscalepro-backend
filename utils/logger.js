import pino from 'pino';
import { randomUUID } from 'crypto';

// Detecta ambiente
const isProd = process.env.NODE_ENV === 'production';

// Configuração bonita em dev, minimalista em prod
const transport = isProd
  ? undefined
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    };

// Logger principal
const logger = pino(
  {
    name: 'GlowscalePro Backend',
    level: process.env.LOG_LEVEL || 'info',
    base: {
      env: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  },
  transport
);

export default logger;

// Middleware: adiciona um requestId único e logger contextual à req
export const addRequestId = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.id = requestId;

  // Cria um logger com contexto do request
  req.log = logger.child({ requestId, url: req.originalUrl, method: req.method });

  req.log.info('📥 Incoming request');
  next();
};
