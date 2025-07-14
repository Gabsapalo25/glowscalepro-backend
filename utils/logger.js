import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: isProd ? 'info' : 'debug',
  ...(isProd
    ? {} // Sem transport em produção (deixa o Render capturar via stdout)
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname'
          }
        }
      }
  ),
  base: {
    app: 'GlowscalePro',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  serializers: {
    err: (err) => ({
      message: err.message,
      stack: err.stack
    })
  }
});

export default logger;
