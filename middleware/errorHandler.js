// middleware/errorHandler.js

import logger from '../utils/logger.js'; // Importa o logger centralizado

export const notFound = (req, res, next) => {
    // Tenta usar o logger da requisição (com requestId) se disponível, senão o global
    const requestLogger = req.log || logger;
    const error = new Error(`Not Found - ${req.originalUrl}`);
    requestLogger.warn(`⚠️ 404 Not Found: ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    // Tenta usar o logger da requisição (com requestId) se disponível, senão o global
    const requestLogger = req.log || logger;

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Se for um erro de validação (ex: Joi) ou erro de CSRF
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.details ? err.details.map(i => i.message).join(', ') : err.message;
        requestLogger.error({ error: err, statusCode, message }, '🚫 Validation Error');
    } else if (err.code === 'EBADCSRFTOKEN') {
        statusCode = 403; // Forbidden
        message = 'Invalid CSRF token.';
        requestLogger.error({ error: err, statusCode, message }, '🚫 CSRF Token Error');
    } else if (err.isJoi) { // Se você estiver usando Joi para validação
        statusCode = 400;
        message = err.details.map(el => el.message).join('; ');
        requestLogger.error({ error: err, statusCode, message }, '🚫 Joi Validation Error');
    }
    
    // Log do erro com detalhes completos
    requestLogger.error({
        error_name: err.name,
        error_message: message,
        stack: process.env.NODE_ENV === 'production' ? '🥞 Stack trace in production suppressed.' : err.stack,
        request_url: req.originalUrl,
        request_method: req.method,
        // Incluir outros dados relevantes se existirem (ex: req.body, req.params)
    }, `❌ Global Error Handler: ${message}`);


    res.status(statusCode).json({
        message: message,
        // Apenas inclua o stack trace em ambiente de desenvolvimento
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};