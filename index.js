import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';
import quizRoutes from './routes/quizRoutes.js';
import { corsOptions } from './config/corsConfig.js';
import errorHandler from './middleware/errorHandler.js';
import { getQuizConfig } from './config/quizzesConfig.js';

dotenv.config();

const logger = pino({
  level: process.env.PINO_LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  })
});

const app = express();
const port = process.env.PORT || 10000;

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api', quizRoutes);

// Tratamento de erros
app.use(errorHandler);

// Inicialização do servidor
app.listen(port, () => {
  logger.info(`Starting server...`);
  logger.info(`🚀 Server running on port ${port}`);
  logger.info(`🌎 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Frontend: ${process.env.FRONTEND_URL || 'not configured'}`);
  logger.info(`✉️ Admin Email: ${process.env.ADMIN_EMAIL || 'not configured'}`);
  logger.info(`📊 ActiveCampaign: ${process.env.ACTIVE_CAMPAIGN_API_KEY ? 'Active' : 'Inactive'}`);
  if (process.env.ACTIVE_CAMPAIGN_API_KEY) {
    logger.info(`   - API URL: ${process.env.ACTIVE_CAMPAIGN_API_URL}`);
    logger.info(`   - MasterTools List ID: ${process.env.AC_LIST_ID_MASTERTOOLS_ALL}`);
    logger.info(`   - Unsubscribe Tag ID: ${process.env.UNSUBSCRIBE_TAG_ID}`);
  }
  logger.info(`✅ Quizzes loaded:`);
  const quizzes = ['tokmate', 'primebiome', 'prodentim', 'nervovive', 'totalcontrol24', 'glucoshield', 'prostadine'];
  quizzes.forEach(quizId => {
    const config = getQuizConfig(quizId);
    if (config) {
      logger.info(`- ${quizId}: ${config.subject}`);
    }
  });
});