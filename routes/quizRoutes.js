// routes/quizRoutes.js

import express from 'express';

// Importa os middlewares de validação e segurança do quiz
import {
  generateCsrfToken,
  csrfProtection,
  devAuthMiddleware,
  logRequest
} from '../middleware/quizMiddleware.js';

// Importa o middleware de validação com express-validator
import { validateQuizPayload } from '../middleware/validateQuizPayload.js';

// Importa os controladores
import {
  sendResult,
  getCsrfToken as getCsrfTokenController
} from '../controllers/quizController.js';

const router = express.Router();

// Middleware de log (aplicado em todas as rotas)
router.use(logRequest);

// Middleware de autenticação para desenvolvimento (se ativado)
router.use(devAuthMiddleware);

// Rota para obter o token CSRF
router.get(
  '/csrf-token',
  generateCsrfToken,        // Gera o token e o anexa ao request
  getCsrfTokenController    // Retorna o token gerado
);

// Rota para submeter resultado do quiz
router.post(
  '/submit-quiz',
  csrfProtection,          // Proteção contra CSRF
  validateQuizPayload,     // Validação com express-validator
  sendResult               // Envio do resultado para ActiveCampaign + e-mail
);

export default router;
