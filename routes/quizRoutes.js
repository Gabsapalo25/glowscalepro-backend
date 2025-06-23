import express from 'express';

// Importa os middlewares
import { generateCsrfToken } from '../middleware/csrfMiddleware.js'; // Supondo que isso está separado
import { validateQuizPayload } from '../middleware/validateQuizPayload.js';
import { devAuthMiddleware, logRequest } from '../middleware/devMiddleware.js'; // Supondo middleware separado
import csrfProtection from '../middleware/csrfProtection.js'; // Se o CSRF estiver isolado

// Controladores
import {
  sendResult,
  getCsrfToken as getCsrfTokenController
} from '../controllers/quizController.js';

const router = express.Router();

// Aplica middleware de log para todas as requisições neste router
router.use(logRequest);

// Aplica autenticação somente no ambiente de desenvolvimento
router.use(devAuthMiddleware);

// Endpoint para obtenção de token CSRF
router.get(
  '/csrf-token',
  generateCsrfToken,
  getCsrfTokenController
);

// Endpoint de submissão de quiz
router.post(
  '/submit-quiz',
  csrfProtection,       // Middleware para verificar o token CSRF
  validateQuizPayload,  // Validação de payload usando express-validator
  sendResult            // Controlador responsável pelo envio de resultado
);

export default router;
