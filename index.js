import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { cleanEnv, str, port, bool } from 'envalid'; // Importa envalid
import quizRoutes from './routes/quizRoutes.js';
import { corsOptions } from './config/corsConfig.js'; // Assumindo que este arquivo existe e define corsOptions
import errorHandler from './middleware/errorHandler.js'; // Importa o errorHandler.js
import { getQuizConfig } from './config/quizzesConfig.js';
import { configureRateLimit } from './middleware/quizMiddleware.js'; // Importa o configureRateLimit

// 1. Validação das Variáveis de Ambiente com envalid
// Isso deve ser feito o mais cedo possível para garantir que as variáveis necessárias existam.
const env = cleanEnv(process.env, {
    PORT: port({ default: 10000 }), // Porta da aplicação
    NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }), // Ambiente
    FRONTEND_URL: str(), // URL do frontend para CORS
    ADMIN_EMAIL: str({ devDefault: 'admin@example.com' }), // E-mail do administrador
    EMAIL_HOST: str(),
    EMAIL_PORT: port(),
    EMAIL_SECURE: bool({ default: true }),
    EMAIL_USER: str(),
    EMAIL_PASS: str(),
    ACTIVE_CAMPAIGN_API_URL: str(),
    ACTIVE_CAMPAIGN_API_KEY: str(),
    AC_LIST_ID_MASTERTOOLS_ALL: str(),
    UNSUBSCRIBE_TAG_ID: str(),
    DEV_API_KEY: str({ devDefault: '' }) // Chave de API para desenvolvimento
});

// Configuração do logger (usando env.NODE_ENV)
const logger = pino({
    level: env.isProduction ? 'info' : 'debug', // Nível de log baseado no ambiente
    ...(env.isDevelopment && {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true }
        }
    })
});

const app = express();
const port = env.PORT; // Usa a porta validada por envalid

// Middlewares Globais
// A ordem importa!
app.use(cors(corsOptions)); // Aplica CORS configurado
app.use(express.json()); // Permite que o Express leia JSON no corpo da requisição
app.use(express.urlencoded({ extended: true })); // Permite que o Express leia dados de formulário codificados na URL

// Configura o Rate Limiting para rotas específicas (como /api/submit-quiz)
// Este middleware DEVE ser aplicado antes das rotas que ele deve proteger.
configureRateLimit(app);

// Rotas da API
app.use('/api', quizRoutes);

// Middleware de Tratamento de Erros (DEVE ser o último middleware adicionado)
app.use(errorHandler);

// Inicialização do servidor
app.listen(port, () => {
    logger.info(`Starting server...`);
    logger.info(`🚀 Server running on port ${port}`);
    logger.info(`🌎 Environment: ${env.NODE_ENV}`); // Usa env.NODE_ENV
    logger.info(`🔗 Frontend: ${env.FRONTEND_URL}`); // Usa env.FRONTEND_URL
    logger.info(`🔒 CORS origin: ${typeof corsOptions.origin === 'function' ? 'dynamic' : corsOptions.origin}`);
    logger.info(`✉️ Admin Email: ${env.ADMIN_EMAIL}`); // Usa env.ADMIN_EMAIL
    logger.info(`📊 ActiveCampaign: ${env.ACTIVE_CAMPAIGN_API_KEY ? 'Active' : 'Inactive'}`);
    if (env.ACTIVE_CAMPAIGN_API_KEY) {
        logger.info(`    - API URL: ${env.ACTIVE_CAMPAIGN_API_URL}`);
        logger.info(`    - MasterTools List ID: ${env.AC_LIST_ID_MASTERTOOLS_ALL}`);
        logger.info(`    - Unsubscribe Tag ID: ${env.UNSUBSCRIBE_TAG_ID}`);
    }
    logger.info(`✅ Quizzes loaded:`);
    const quizzes = ['tokmate', 'primebiome', 'prodentim', 'nervovive', 'totalcontrol24', 'glucoshield', 'prostadine'];
    quizzes.forEach(quizId => {
        const config = getQuizConfig(quizId);
        if (config) {
            logger.info(`- ${quizId}: ${config.subject}`);
        } else {
            logger.warn(`- ${quizId}: Configuração não encontrada!`);
        }
    });
});