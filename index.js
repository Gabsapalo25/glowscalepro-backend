// index.js

import 'dotenv/config'; // Garante que as variáveis de ambiente sejam carregadas primeiro
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import quizRoutes from './routes/quizRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import logger, { addRequestId } from './utils/logger.js'; // Importa o logger e o middleware addRequestId
import csurf from 'csurf';
import cookieParser from 'cookie-parser';

const app = express();

// Configurações de segurança e middlewares
app.use(express.json()); // Permite que o Express leia JSON no corpo das requisições
app.use(express.urlencoded({ extended: true })); // Permite ler dados de formulário codificados em URL

// Configuração do CORS
// Apenas allow origin para a sua URL de frontend ou para localhost em desenvolvimento
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.MASTERTOOLS_UNSUBSCRIBE_URL, // Adicionar esta URL, se for diferente
    'http://localhost:3000', // Para desenvolvimento local do frontend
    'http://localhost:5173'  // Para Vue/Vite em desenvolvimento local
];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requisições sem 'origin' (ex: de ferramentas como Postman, ou requisições same-origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        logger.warn(msg); // Usando o logger centralizado
        return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
}));

// Configuração do Helmet para segurança de HTTP headers
app.use(helmet());

// Configuração de Rate Limiting para evitar ataques de força bruta ou DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP a cada 15 minutos
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Retorna as informações de limite nas headers RateLimit-*
    legacyHeaders: false, // Desabilita as headers X-RateLimit-*
});
app.use(limiter);

// Middleware para cookies (necessário para csurf)
app.use(cookieParser());

// Middleware para CSRF protection (deve vir DEPOIS de cookieParser e express.json/urlencoded)
const csrfProtection = csurf({
    cookie: {
        key: '_csrf',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies em produção
        maxAge: 3600 // 1 hora
    },
});
app.use(csrfProtection); // Aplicar proteção CSRF a todas as rotas ou rotas específicas

// Middleware para adicionar um ID de requisição ao logger de cada requisição
app.use(addRequestId);

// Rotas da API
app.use('/api', quizRoutes);

// Rota de teste simples para verificar se o servidor está online
app.get('/', (req, res) => {
    logger.info('📥 GET / - Root endpoint accessed.'); // Usando o logger centralizado
    res.status(200).send('GlowScalePro Backend API is running!');
});

// Middleware para lidar com rotas não encontradas (404)
app.use(notFound);

// Middleware de tratamento de erros global (deve ser o último app.use)
app.use(errorHandler);

// Inicialização do servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`); // Usando o logger centralizado
});