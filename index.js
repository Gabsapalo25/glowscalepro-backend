// index.js

import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { cleanEnv, str, port, bool } from 'envalid'; // Importa envalid para validação de variáveis de ambiente

import quizRoutes from './routes/quizRoutes.js';
import { corsOptions } from './config/corsConfig.js'; // Importa as opções de CORS
import errorHandler from './middleware/errorHandler.js'; // Importa o middleware de tratamento de erros
import { getQuizConfig } from './config/quizzesConfig.js'; // Importa a configuração dos quizzes
import { configureRateLimit } from './middleware/quizMiddleware.js'; // Importa a função de configuração de rate limiting

// 1. Validação e Carregamento das Variáveis de Ambiente com envalid
// Isso garante que todas as variáveis de ambiente necessárias estejam presentes e corretas no início da aplicação.
const env = cleanEnv(process.env, {
    PORT: port({ default: 10000 }), // Porta da aplicação, com default
    NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }), // Ambiente, com opções limitadas
    FRONTEND_URL: str(), // URL do frontend para CORS, obrigatória
    ADMIN_EMAIL: str({ devDefault: 'admin@example.com' }), // E-mail do administrador, com default para dev
    EMAIL_HOST: str(), // Host SMTP do e-mail
    EMAIL_PORT: port(), // Porta SMTP do e-mail
    EMAIL_SECURE: bool({ default: true }), // Se a conexão SMTP é segura (TLS/SSL)
    EMAIL_USER: str(), // Usuário do e-mail SMTP
    EMAIL_PASS: str(), // Senha do e-mail SMTP
    ACTIVE_CAMPAIGN_API_URL: str(), // URL da API do ActiveCampaign
    ACTIVE_CAMPAIGN_API_KEY: str(), // Chave da API do ActiveCampaign
    AC_LIST_ID_MASTERTOOLS_ALL: str(), // ID da lista principal do ActiveCampaign
    UNSUBSCRIBE_TAG_ID: str(), // ID da tag de "unsubscribe" no ActiveCampaign
    DEV_API_KEY: str({ devDefault: '' }) // Chave de API para autenticação em desenvolvimento, opcional
});

// Configuração do Logger (Pino)
const logger = pino({
    level: env.isProduction ? 'info' : 'debug', // Nível de log 'info' em produção, 'debug' em desenvolvimento
    ...(env.isDevelopment && { // Configuração de transporte (pino-pretty) apenas em desenvolvimento
        transport: {
            target: 'pino-pretty',
            options: { colorize: true }
        }
    })
});

// Inicialização do Aplicativo Express
const app = express();
const port = env.PORT; // Usa a porta validada por envalid

// Middlewares Globais (ordem importa!)
app.use(cors(corsOptions)); // Aplica a política de CORS configurada
app.use(express.json()); // Habilita o parsing de corpos de requisição no formato JSON
app.use(express.urlencoded({ extended: true })); // Habilita o parsing de corpos de requisição no formato URL-encoded

// Configura e aplica o Rate Limiting para proteger suas rotas de API
// Deve ser aplicado ANTES das rotas que ele protege.
configureRateLimit(app);

// Montagem das Rotas da Aplicação
// Todas as rotas definidas em quizRoutes.js serão prefixadas com '/api'
app.use('/api', quizRoutes);

// Middleware de Tratamento de Erros Global
// ESTE DEVE SER SEMPRE O ÚLTIMO MIDDLEWARE A SER ADICIONADO para capturar erros de toda a aplicação.
app.use(errorHandler);

// Inicialização do Servidor
app.listen(port, () => {
    logger.info(`Starting server...`);
    logger.info(`🚀 Server running on port ${port}`);
    logger.info(`🌎 Environment: ${env.NODE_ENV}`); // Loga o ambiente atual
    logger.info(`🔗 Frontend URL: ${env.FRONTEND_URL}`); // Loga a URL do frontend
    logger.info(`🔒 CORS Origin: ${typeof corsOptions.origin === 'function' ? 'dynamic' : corsOptions.origin}`); // Loga a origem CORS
    logger.info(`✉️ Admin Email: ${env.ADMIN_EMAIL}`); // Loga o e-mail do admin
    logger.info(`📊 ActiveCampaign: ${env.ACTIVE_CAMPAIGN_API_KEY ? 'Active' : 'Inactive'}`); // Status do ActiveCampaign
    if (env.ACTIVE_CAMPAIGN_API_KEY) { // Detalhes do ActiveCampaign se ativo
        logger.info(`    - API URL: ${env.ACTIVE_CAMPAIGN_API_URL}`);
        logger.info(`    - MasterTools List ID: ${env.AC_LIST_ID_MASTERTOOLS_ALL}`);
        logger.info(`    - Unsubscribe Tag ID: ${env.UNSUBSCRIBE_TAG_ID}`);
    }
    logger.info(`✅ Quizzes loaded:`); // Confirma o carregamento das configurações dos quizzes
    const quizzes = ['tokmate', 'primebiome', 'prodentim', 'nervovive', 'totalcontrol24', 'glucoshield', 'prostadine'];
    quizzes.forEach(quizId => {
        const config = getQuizConfig(quizId);
        if (config) {
            logger.info(`- ${quizId}: ${config.subject}`);
        } else {
            logger.warn(`- ${quizId}: Configuração não encontrada!`); // Alerta se uma config de quiz não for encontrada
        }
    });
});