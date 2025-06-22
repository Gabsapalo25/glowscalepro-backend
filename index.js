// src/index.js - VERSÃO COMPLETA E FINAL (ADAPTADA AO SEU quizzesConfig.js)
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { cleanEnv, str, num } from 'envalid';
import dotenv from 'dotenv';
import pino from 'pino';
import quizzesRoutes from './routes/quizzesRoutes.js';
import mailRoutes from './routes/mailRoutes.js';
import unsubscribeRoutes from './routes/unsubscribeRoutes.js';
import activeCampaignService from './services/activeCampaignService.js';
// ATENÇÃO AQUI: Importa 'quizzesConfig' diretamente como um array, não um objeto 'dataConfig'
import { quizzesConfig } from './config/quizzesConfig.js'; 

dotenv.config();

const logger = pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
});

const app = express();

---

### **Validação de TODAS as Variáveis de Ambiente Necessárias**

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
    SMTP_SECURE: str({ devDefault: 'false' }),
    SMTP_TLS_REJECT_UNAUTHORIZED: str({ devDefault: 'true' }),

    ACTIVE_CAMPAIGN_API_URL: str(),
    ACTIVE_CAMPAIGN_API_KEY: str(),
    AC_LIST_ID_MASTERTOOLS_ALL: num(), 
    UNSUBSCRIBE_TAG_ID: num(), 
});

---

### **Configuração do Express e Middlewares**

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
    req.app.locals.acApiUrl = env.ACTIVE_CAMPAIGN_API_URL;
    req.app.locals.acApiKey = env.ACTIVE_CAMPAIGN_API_KEY;
    req.app.locals.acListIdMastertoolsAll = env.AC_LIST_ID_MASTERTOOLS_ALL;
    req.app.locals.acTagIdUnsubscribe = env.UNSUBSCRIBE_TAG_ID;
    req.app.locals.adminEmail = env.ADMIN_EMAIL;
    req.app.locals.smtpConfig = {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE === 'true',
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true'
        }
    };
    next();
});

---

### **Definição de Rotas**

app.use('/api', quizzesRoutes);
app.use('/api', mailRoutes);
app.use('/api', unsubscribeRoutes);

app.get('/', (req, res) => {
    res.send('API is running!');
});

---

### **Inicialização do Servidor**

const PORT = env.PORT;

app.listen(PORT, async () => {
    logger.info('Iniciando o servidor...');
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`🌎 Ambiente: ${env.NODE_ENV}`);
    logger.info(`🔗 Frontend: ${env.FRONTEND_URL}`);
    logger.info(`✉️ SMTP: ${env.SMTP_USER}@${env.SMTP_HOST}`);

    try {
        const nodemailer = await import('nodemailer');
        const testTransporter = nodemailer.createTransport(app.locals.smtpConfig);
        await testTransporter.verify();
        logger.info('✅ Conexão SMTP verificada com sucesso.');
    } catch (error) {
        logger.error(`❌ Erro ao verificar conexão SMTP: ${error.message}`);
        logger.error(`Detalhes da configuração SMTP: Host=${env.SMTP_HOST}, Port=${env.SMTP_PORT}, User=${env.SMTP_USER}`);
    }

    ---

    ### **Logs da Configuração do ActiveCampaign**

    logger.info(`📊 ActiveCampaign: ${env.ACTIVE_CAMPAIGN_API_KEY ? 'Ativo' : 'Inativo'}`);
    logger.info(`   - API URL: ${env.ACTIVE_CAMPAIGN_API_URL}`);
    logger.info(`   - MasterTools List ID: ${env.AC_LIST_ID_MASTERTOOLS_ALL}`);
    logger.info(`   - Unsubscribe Tag ID: ${env.UNSUBSCRIBE_TAG_ID}`);

    ---

    ### **Carregamento e Log dos Quizzes (ADAPTADO À SUA ESTRUTURA)**

    logger.info(`✅ Quizzes carregados:`);
    // Agora 'quizzesConfig' é o array diretamente
    if (quizzesConfig && Array.isArray(quizzesConfig) && quizzesConfig.length > 0) {
        quizzesConfig.forEach(quiz => {
            // Usa 'quizId' e 'subject' ou outras propriedades que você tem no seu quizConfig
            logger.info(`- ${quiz.quizId || 'ID Indefinido'}: ${quiz.subject || 'Assunto Indefinido'}`);
        });
    } else {
        logger.warn(`- Nenhuma configuração de quiz encontrada em src/config/quizzesConfig.js ou estrutura inválida.`);
        logger.warn(`- Por favor, verifique se 'quizzesConfig' é um array de objetos válidos.`);
    }
});