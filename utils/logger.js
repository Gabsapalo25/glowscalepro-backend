// utils/logger.js
import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  base: {
    app: 'GlowscalePro',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development'
  }
});

export default logger;
