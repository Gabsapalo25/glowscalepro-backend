// routes/quizRoutes.js

import express from 'express';
// Importa os middlewares de validação e segurança
import {
    generateCsrfToken,
    csrfProtection,
    devAuthMiddleware,
    logRequest // Para logar todas as requisições
} from '../middleware/quizMiddleware.js';

// Importa o middleware de validação específico para o payload do quiz
import { validateQuizPayload } from '../middleware/validateQuizPayload.js';

// Importa as funções do controlador
import { sendResult, getCsrfToken as getCsrfTokenController } from '../controllers/quizController.js'; // Renomeia para evitar conflito

const router = express.Router();

// Middleware de log para todas as requisições que passam por este router
router.use(logRequest);

// Middleware de autenticação para ambiente de desenvolvimento (se ativo)
router.use(devAuthMiddleware);

// Rota para obter o token CSRF
// A geração do token deve ser feita pelo middleware generateCsrfToken
// O controlador getCsrfTokenController será responsável apenas por retornar o token gerado.
router.get(
    '/csrf-token',
    generateCsrfToken, // Este middleware gera o token e anexa a req.csrfToken
    getCsrfTokenController // Este controlador simplesmente retorna o token já gerado
);

// Rota para submeter o resultado do quiz
// Aplica os middlewares de segurança e validação
router.post(
    '/submit-quiz',
    csrfProtection,       // Verifica o token CSRF
    validateQuizPayload,  // Valida o payload da requisição com express-validator
    sendResult            // Processa o envio do resultado
);

export default router;