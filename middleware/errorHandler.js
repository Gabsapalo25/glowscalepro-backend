// middleware/errorHandler.js

import pino from 'pino';

// Configuração do logger para o errorHandler
const logger = pino({
    level: process.env.PINO_LOG_LEVEL || 'error', // Nível padrão para erros
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
        },
    },
});

/**
 * Middleware de tratamento de erros global.
 * Captura erros de todas as rotas e middlewares.
 *
 * @param {Error} err O objeto de erro capturado.
 * @param {import('express').Request} req O objeto de requisição Express.
 * @param {import('express').Response} res O objeto de resposta Express.
 * @param {import('express').NextFunction} next A função next do Express.
 */
const errorHandler = (err, req, res, next) => {
    // Registra o erro detalhadamente no console/logs da aplicação
    logger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        body: req.body, // Pode ser útil para depurar erros de validação
        headers: req.headers // Headers da requisição podem conter contexto importante
    }, `Erro capturado no middleware de erro: ${err.message}`);

    // Se os cabeçalhos já foram enviados, delegue para o tratador de erros padrão do Express
    // Isso evita "Cannot set headers after they are sent to the client"
    if (res.headersSent) {
        return next(err);
    }

    // Determina o status HTTP do erro
    // Prioriza statusCode definido no erro (ex: erros de validação personalizados)
    // Caso contrário, usa 500 (Internal Server Error)
    const statusCode = err.statusCode || 500;

    // Constrói a resposta de erro para o cliente
    const errorResponse = {
        status: 'error',
        message: err.message || 'Um erro inesperado ocorreu. Por favor, tente novamente mais tarde.',
    };

    // Em ambiente de desenvolvimento, inclui o stack trace para depuração
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    // Envia a resposta de erro ao cliente
    res.status(statusCode).json(errorResponse);
};

export default errorHandler;