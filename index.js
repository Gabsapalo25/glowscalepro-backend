// index.js (CONTEÚDO FINAL E DEFINITIVO)

import express from 'express';
import dotenv from 'dotenv';
import pino from 'pino';
import helmet from 'helmet';
import cors from 'cors'; // Já está no projeto
import rateLimit from 'express-rate-limit'; // Já está no projeto

// Importe os middlewares e rotas do seu projeto - CAMINHOS ABSOLUTOS (A PARTIR DA RAIZ)
// Assumindo:
// - index.js está na raiz
// - pastas 'middleware', 'routes', 'controllers', 'services', 'config' estão na raiz
import { configureCors, configureRateLimit, devAuthMiddleware, logRequest } from './middleware/quizMiddleware.js';
import errorHandler from './middleware/errorHandler.js';
import { validateQuizPayload } from './middleware/validateQuizPayload.js'; // Middleware de validação do payload do quiz
// Importe as rotas do seu projeto
import quizzesRoutes from './routes/quizzesRoutes.js';
import mailRoutes from './routes/mailRoutes.js';
import unsubscribeRoutes from './routes/unsubscribeRoutes.js';

dotenv.config();

const app = express();
const logger = pino();

// Configurações e Middlewares Globais
app.use(express.json()); // Body parser para JSON
app.use(express.urlencoded({ extended: true })); // Body parser para URL-encoded
app.use(helmet()); // Segurança HTTP headers

// Configurações de ambiente para e-mail (necessário para mailService)
app.locals.adminEmail = process.env.ADMIN_EMAIL || 'defaultadmin@example.com';
app.locals.smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // Garante que é booleano
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};

// Aplica CORS e Rate Limiting usando as funções importadas do quizMiddleware
// Estas funções configuram os middlewares no 'app' globalmente
configureCors(app, process.env);
configureRateLimit(app);

// Middlewares aplicados globalmente a todas as requisições
app.use(logRequest); // Para logar todas as requisições
app.use(devAuthMiddleware); // Autenticação para ambiente de desenvolvimento (se NODE_ENV='development')

// Rotas da API
// As rotas são montadas sob o prefixo '/api'
// Note que 'validateQuizPayload' será aplicado dentro de 'quizzesRoutes.js'
app.use('/api', quizzesRoutes);
app.use('/api', mailRoutes);
app.use('/api', unsubscribeRoutes);

// Rota de Teste Simples para verificar se a API está no ar
app.get('/', (req, res) => {
    res.status(200).send('API is running!');
});

// Middleware de tratamento de erros global (DEVE SER O ÚLTIMO MIDDLEWARE ADICIONADO)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});