// src/index.js - VERSÃO CONJUGADA E ATUALIZADA

import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { cleanEnv, str, num, port, bool } from 'envalid'; // Importações atualizadas do 'envalid'
import nodemailer from 'nodemailer'; // Importado 'nodemailer' no topo

// Rotas e Middlewares da sua estrutura e nossas implementações
import quizzesRoutes from './routes/quizzesRoutes.js';
import mailRoutes from './routes/mailRoutes.js';
import unsubscribeRoutes from './routes/unsubscribeRoutes.js';
import errorHandler from './middleware/errorHandler.js'; // Middleware de tratamento de erros
import { configureRateLimit } from './middleware/quizMiddleware.js'; // Função para configurar rate limit
import { quizzesConfig } from './config/quizzesConfig.js'; // Sua configuração de quizzes

// O 'dotenv.config()' não é necessário; 'envalid' o integra automaticamente.

const app = express();

// 1. Validação de TODAS as Variáveis de Ambiente Necessárias com 'envalid'
const env = cleanEnv(process.env, {
    PORT: port({ devDefault: 10000 }), // Usando tipo 'port' para a porta
    NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
    FRONTEND_URL: str(), // Obrigatório
    ALLOWED_ORIGINS: str({ devDefault: 'http://localhost:3001' }), // Sua variável para CORS
    ADMIN_EMAIL: str(), // E-mail do administrador
    EMAIL_HOST: str(), // Renomeado de SMTP_HOST para clareza
    EMAIL_PORT: port(), // Usando tipo 'port' para a porta SMTP
    EMAIL_USER: str(), // Renomeado de SMTP_USER
    EMAIL_PASS: str(), // Renomeado de SMTP_PASS
    EMAIL_SECURE: bool({ default: true }), // Usando tipo 'bool'
    EMAIL_TLS_REJECT_UNAUTHORIZED: bool({ default: true }), // Usando tipo 'bool'
    ACTIVE_CAMPAIGN_API_URL: str(),
    ACTIVE_CAMPAIGN_API_KEY: str(),
    AC_LIST_ID_MASTERTOOLS_ALL: num(), // Mantido como 'num' conforme sua definição
    UNSUBSCRIBE_TAG_ID: num(), // Mantido como 'num' conforme sua definição
    DEV_API_KEY: str({ devDefault: '' }) // Chave de API para desenvolvimento
});

// Configuração do Logger (Pino)
const logger = pino({
    level: env.isProduction ? 'info' : 'debug', // Nível de log dinâmico
    ...(env.isDevelopment && { // Pino-pretty apenas em desenvolvimento
        transport: {
            target: 'pino-pretty',
            options: { colorize: true }
        }
    })
});

// Middlewares Globais (A ordem é crucial!)
// Substituindo 'body-parser' pelas funcionalidades nativas do Express
app.use(express.json()); // Para parsing de JSON
app.use(express.urlencoded({ extended: true })); // Para parsing de dados de formulário

// Lógica de CORS customizada (da sua versão do código)
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            logger.warn(msg);
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'], // Métodos HTTP permitidos
    credentials: true // Permite o envio de cookies de credenciais
}));

// Aplicando o middleware de Rate Limiting
configureRateLimit(app);

// Adicionando configurações globais à requisição via req.app.locals
app.use((req, res, next) => {
    req.app.locals.acApiUrl = env.ACTIVE_CAMPAIGN_API_URL;
    req.app.locals.acApiKey = env.ACTIVE_CAMPAIGN_API_KEY;
    req.app.locals.acListIdMastertoolsAll = env.AC_LIST_ID_MASTERTOOLS_ALL;
    req.app.locals.acTagIdUnsubscribe = env.UNSUBSCRIBE_TAG_ID;
    req.app.locals.adminEmail = env.ADMIN_EMAIL;
    req.app.locals.smtpConfig = {
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_SECURE,
        auth: {
            user: env.EMAIL_USER,
            pass: env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: env.EMAIL_TLS_REJECT_UNAUTHORIZED
        }
    };
    next();
});

// Rotas da Aplicação
app.use('/api', quizzesRoutes);
app.use('/api', mailRoutes);
app.use('/api', unsubscribeRoutes);

// Rota raiz simples para verificar se a API está funcionando
app.get('/', (req, res) => {
    res.send('API is running!');
});

// Middleware de Tratamento de Erros (MUITO IMPORTANTE: DEVE SER O ÚLTIMO MIDDLEWARE ADICIONADO)
app.use(errorHandler);

// Inicialização do Servidor
// ATENÇÃO: 'PORT' está declarado APENAS UMA VEZ aqui.
const PORT = env.PORT; // Usa a porta validada por 'envalid'

app.listen(PORT, async () => {
    logger.info('Iniciando o servidor...');
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`🌎 Ambiente: ${env.NODE_ENV}`);
    logger.info(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
    logger.info(`✉️ SMTP: ${env.EMAIL_USER}@${env.EMAIL_HOST}`);

    try {
        // Teste de conexão SMTP
        const testTransporter = nodemailer.createTransport(app.locals.smtpConfig);
        await testTransporter.verify();
        logger.info('✅ Conexão SMTP verificada com sucesso.');
    } catch (error) {
        logger.error(`❌ Erro ao verificar conexão SMTP: ${error.message}`);
        logger.error(`Detalhes da configuração SMTP: Host=${env.EMAIL_HOST}, Port=${env.EMAIL_PORT}, User=${env.EMAIL_USER}`);
    }

    logger.info(`📊 ActiveCampaign: ${env.ACTIVE_CAMPAIGN_API_KEY ? 'Ativo' : 'Inativo'}`);
    logger.info(`    - API URL: ${env.ACTIVE_CAMPAIGN_API_URL}`);
    logger.info(`    - MasterTools List ID: ${env.AC_LIST_ID_MASTERTOOLS_ALL}`);
    logger.info(`    - Unsubscribe Tag ID: ${env.UNSUBSCRIBE_TAG_ID}`);

    logger.info('✅ Quizzes carregados:');
    if (quizzesConfig && Array.isArray(quizzesConfig)) {
        quizzesConfig.forEach(quiz => {
            logger.info(`- ${quiz.quizId}: ${quiz.subject} (List ID: ${quiz.activeCampaignFields ? quiz.activeCampaignFields.scoreFieldId : 'Indefinido'})`);
        });
    } else {
        logger.warn('- Nenhuma configuração de quiz encontrada ou estrutura inválida.');
    }
});