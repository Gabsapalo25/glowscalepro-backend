import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: isProd ? 'info' : 'debug',
  ...(isProd
    ? {
        transport: {
          target: 'pino/file',
          options: {
            destination: 1, // stdout para Render capturar em tempo real
            sync: false, // Assíncrono para evitar bloqueios
          },
        },
      }
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
  base: {
    app: 'GlowscalePro',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  serializers: {
    err: (err) => ({
      message: err.message,
      stack: err.stack, // Mantido, mas pode ser otimizado se necessário
    }),
  },
});

export default logger;