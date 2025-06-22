// index.js - VERSÃO FINAL E CORRIGIDA
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { cleanEnv, str, num, bool } from 'envalid'; // Adicionado 'bool' para SMTP_SECURE e SMTP_TLS_REJECT_UNAUTHORIZED
import dotenv from 'dotenv';
import pino from 'pino';

// Importações com caminhos corrigidos para a sua estrutura original (raiz do projeto)
import quizRoutes from './routes/quizRoutes.js'; 
// Se você tem mailRoutes e unsubscribeRoutes e eles não estão consolidados em quizRoutes:
// import mailRoutes from './routes/mailRoutes.js';
// import unsubscribeRoutes from './routes/unsubscribeRoutes.js';

import activeCampaignService from './services/activeCampaignService.js';
import sendEmail from './services/emailService.js'; // Importa a função default do seu emailService
import { quizzesConfig } from './config/quizzesConfig.js'; 

dotenv.config();

const logger = pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
});

const app = express();

// Validação de TODAS as Variáveis de Ambiente Necessárias
const env = cleanEnv(process.env, {
    PORT: num({ devDefault: 10000 }),
    NODE_ENV: str({ devDefault: 'development' }),
    FRONTEND_URL: str({ devDefault: 'http://localhost:3001' }),
    ALLOWED_ORIGINS: str({ devDefault: 'http://localhost:3001' }),

    ADMIN_EMAIL: str(),
    SMTP_HOST: str(),
    SMTP_PORT: num(),
    SMTP_USER: str(),
    SMTP_PASS: str(),
    SMTP_SECURE: bool(), // Usando bool para 'secure'
    SMTP_TLS_REJECT_UNAUTHORIZED: bool(), // Usando bool para 'rejectUnauthorized'

    ACTIVE_CAMPAIGN_API_URL: str(),
    ACTIVE_CAMPAIGN_API_KEY: str(),
    AC_LIST_ID_MASTERTOOLS_ALL: num(), 
    UNSUBSCRIBE_TAG_ID: num(), 
});

// Configuração do Express e Middlewares
app.use(bodyParser.json());

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
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));

app.use((req, res, next) => {
    // Passa variáveis de ambiente para `req.app.locals` para fácil acesso nas rotas/serviços
    req.app.locals.acApiUrl = env.ACTIVE_CAMPAIGN_API_URL;
    req.app.locals.acApiKey = env.ACTIVE_CAMPAIGN_API_KEY;
    req.app.locals.acListIdMastertoolsAll = env.AC_LIST_ID_MASTERTOOLS_ALL;
    req.app.locals.acTagIdUnsubscribe = env.UNSUBSCRIBE_TAG_ID;
    req.app.locals.adminEmail = env.ADMIN_EMAIL;
    // req.app.locals.smtpConfig não é mais necessário aqui, pois emailService gerencia internamente
    next();
});

// Definição de Rotas
app.use('/api', quizRoutes); 
// Se você tiver mailRoutes e unsubscribeRoutes separadas e ativas:
// app.use('/api', mailRoutes);
// app.use('/api', unsubscribeRoutes);

app.get('/', (req, res) => {
    res.send('API is running!');
});

// Tratamento de Erros Global (se você tiver um middleware de errorHandler.js, você o usaria aqui)
// app.use(errorHandler); // Exemplo de uso se você tiver o middleware

// Inicialização do Servidor
const PORT = env.PORT;

app.listen(PORT, async () => {
    logger.info('Iniciando o servidor...');
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`🌎 Ambiente: ${env.NODE_ENV}`);
    logger.info(`🔗 Frontend: ${env.FRONTEND_URL}`);
    logger.info(`✉️ Email Admin: ${env.ADMIN_EMAIL}`);
    // A verificação SMTP é feita dentro do emailService.js, então não precisamos de um bloco aqui.
    
    // Logs da Configuração do ActiveCampaign
    logger.info(`📊 ActiveCampaign: ${env.ACTIVE_CAMPAIGN_API_KEY ? 'Ativo' : 'Inativo'}`);
    logger.info(`   - API URL: ${env.ACTIVE_CAMPAIGN_API_URL}`);
    logger.info(`   - MasterTools List ID: ${env.AC_LIST_ID_MASTERTOOLS_ALL}`);
    logger.info(`   - Unsubscribe Tag ID: ${env.UNSUBSCRIBE_TAG_ID}`);

    // Carregamento e Log dos Quizzes
    logger.info(`✅ Quizzes carregados:`);
    if (quizzesConfig && Array.isArray(quizzesConfig) && quizzesConfig.length > 0) {
        quizzesConfig.forEach(quiz => {
            logger.info(`- ${quiz.quizId || 'ID Indefinido'}: ${quiz.subject || 'Assunto Indefinido'}`);
        });
    } else {
        logger.warn(`- Nenhuma configuração de quiz encontrada em config/quizzesConfig.js ou estrutura inválida.`);
        logger.warn(`- Por favor, verifique se 'quizzesConfig' é um array de objetos válidos.`);
    }
});