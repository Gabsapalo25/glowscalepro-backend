// middleware/errorHandler.js

import pino from 'pino';

// Configuração do logger
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  // NOVO: Apenas adicione transport se NÃO for ambiente de produção
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        // levelFirst: true, // Removido: esta opção é menos comum em transports e pode ser redundante
        // translateTime: 'SYS:HH:MM:ss', // Removido: pino-pretty já faz isso por padrão ou pode ser configurado no pino principal
        ignore: 'pid,hostname', // Pode manter se desejar
      },
    },
  }),
});

export default (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body, // Inclua o corpo da requisição para depuração (cuidado com dados sensíveis em produção)
    ip: req.ip,
  }, 'Unhandled Error'); // Adiciona contexto ao erro

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV !== 'production' ? err.message : undefined, // Mostra a mensagem do erro apenas em dev
  });
};