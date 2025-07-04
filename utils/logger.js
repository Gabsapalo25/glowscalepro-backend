// utils/logger.js
import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: isProd ? 'info' : 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: !isProd, // Em produção, evita caracteres ANSI coloridos
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  },
  base: {
    app: 'GlowscalePro',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  // Exibe erros detalhados com stack trace
  serializers: {
    err: (err) => {
      return {
        message: err.message,
        stack: err.stack
      };
    }
  }
});

export default logger;
