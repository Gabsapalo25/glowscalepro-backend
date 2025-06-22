import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import winston from 'winston';
import activeCampaignService from './services/activeCampaignService.js';
import quizConfigs from './config/quizzesConfig.js';
import dataConfig from './config/data.json' assert { type: 'json' };

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://glowscalepro-2.funnels.mastertools.com';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.zoho.com';
const SMTP_USER = process.env.SMTP_USER || 'sac@glowscalepro.com';
const SMTP_PASS = process.env.SMTP_PASS;

// Configuração do Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app.log' }) // Para logs em arquivo
    ]
});

// Middlewares
app.use(cors({
    origin: '*', // Permitir todas as origens (ajustar para algo mais restritivo em produção)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Configuração do Nodemailer (mantido para testes de conexão)
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: 587,
    secure: false, // Use 'true' se for porta 465 com SSL/TLS
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

// Função para carregar e logar quizzes
function loadQuizzes() {
    console.log('✅ Quizzes carregados:');
    quizConfigs.forEach(quiz => {
        console.log(`- ${quiz.name}: ${quiz.title} (List ID: ${quiz.listId})`);
    });
}

// Rota inicial (Health Check)
app.get('/', (req, res) => {
    logger.info(`HEAD / (IP: ${req.ip})`);
    res.status(200).send('Servidor GlowScalePro está online!');
});

// Rota para o processo de descadastro (NÃO protegida por CSRF)
// Esta rota é acessada pela página da MasterTools, que não pode fornecer um token CSRF.
app.post('/api/unsubscribe', async (req, res) => {
    logger.info(`POST /api/unsubscribe (IP: ${req.ip})`);
    const { email } = req.body;
    const LIST_ID_MASTERTOOLS_ALL = process.env.AC_LIST_ID_MASTERTOOLS_ALL;
    const TAG_ID_UNSUBSCRIBE = process.env.AC_TAG_ID_UNSUBSCRIBE;

    if (!email) {
        logger.warn('Unsubscribe: Email not provided.');
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    if (!LIST_ID_MASTERTOOLS_ALL || !TAG_ID_UNSUBSCRIBE) {
        logger.error('Unsubscribe: ActiveCampaign List ID or Unsubscribe Tag ID not configured.');
        return res.status(500).json({ success: false, message: 'Server configuration error for unsubscribe.' });
    }

    try {
        const contactId = await activeCampaignService.findContactByEmail(email);

        if (!contactId) {
            logger.info(`Unsubscribe: Contact with email ${email} not found. Sending success response.`);
            return res.status(200).json({ success: true, message: 'If the email exists, it has been successfully unsubscribed.' });
        }

        logger.info(`Unsubscribe: Contact found with ID ${contactId}. Attempting to add unsubscribe tag.`);

        // Adiciona a tag de descadastro
        const tagAdded = await activeCampaignService.addTagToContact(contactId, TAG_ID_UNSUBSCRIBE);
        if (tagAdded) {
            logger.info(`Unsubscribe: Tag ${TAG_ID_UNSUBSCRIBE} added to contact ${contactId}.`);
        } else {
            logger.warn(`Unsubscribe: Could not add tag ${TAG_ID_UNSUBSCRIBE} to contact ${contactId}.`);
        }

        // Remove o contato da lista principal (MasterTools - All)
        const removedFromList = await activeCampaignService.removeContactFromList(contactId, LIST_ID_MASTERTOOLS_ALL);
        if (removedFromList) {
            logger.info(`Unsubscribe: Contact ${contactId} removed from list ${LIST_ID_MASTERTOOLS_ALL}.`);
        } else {
            logger.warn(`Unsubscribe: Could not remove contact ${contactId} from list ${LIST_ID_MASTERTOOLS_ALL}.`);
        }

        logger.info(`Unsubscribe: Process completed for ${email}.`);
        return res.status(200).json({ success: true, message: 'Email successfully unsubscribed.' });

    } catch (error) {
        logger.error(`Unsubscribe: Error processing unsubscribe for ${email}: ${error.message}`, error);
        return res.status(500).json({ success: false, message: 'Error processing unsubscribe request.' });
    }
});


// Rota para processar o quiz e salvar os dados
app.post('/api/quiz', async (req, res) => {
    logger.info(`POST /api/quiz (IP: ${req.ip})`);
    const { email, listName, answers, quizId } = req.body; // Adicione quizId
    const { acApiUrl, acApiKey } = dataConfig.activeCampaign;

    if (!email || !listName || !answers || !quizId) { // Inclua quizId na validação
        logger.warn('Quiz: Missing required fields.');
        return res.status(400).json({ success: false, message: 'Missing required fields: email, listName, answers, quizId.' });
    }

    const quizConfig = quizConfigs.find(q => q.name === listName || q.id === quizId); // Buscar por name ou id
    if (!quizConfig) {
        logger.warn(`Quiz: Quiz configuration not found for listName: ${listName} or quizId: ${quizId}`);
        return res.status(404).json({ success: false, message: 'Quiz configuration not found.' });
    }

    try {
        const contactId = await activeCampaignService.createOrUpdateContact(email, quizConfig.listId);
        logger.info(`Quiz: Contact ID ${contactId} (email: ${email}) created or updated for list ${quizConfig.listId}.`);

        const hasTag = await activeCampaignService.hasTag(contactId, quizConfig.tagId);
        if (!hasTag) {
            const tagAdded = await activeCampaignService.addTagToContact(contactId, quizConfig.tagId);
            if (tagAdded) {
                logger.info(`Quiz: Tag ${quizConfig.tagId} added to contact ${contactId}.`);
            } else {
                logger.warn(`Quiz: Could not add tag ${quizConfig.tagId} to contact ${contactId}.`);
            }
        } else {
            logger.info(`Quiz: Contact ${contactId} already has tag ${quizConfig.tagId}.`);
        }

        // Atualizar campos personalizados com as respostas do quiz
        const customFieldData = quizConfig.questions.map((q, index) => {
            return {
                id: q.customFieldId,
                value: answers[index] || ''
            };
        });

        const customFieldsUpdated = await activeCampaignService.updateCustomFields(contactId, customFieldData);
        if (customFieldsUpdated) {
            logger.info(`Quiz: Custom fields updated for contact ${contactId}.`);
        } else {
            logger.warn(`Quiz: Could not update custom fields for contact ${contactId}.`);
        }

        res.status(200).json({ success: true, message: 'Dados do quiz salvos com sucesso!' });
    } catch (error) {
        logger.error(`Quiz: Error processing quiz for ${email}: ${error.message}`, error);
        res.status(500).json({ success: false, message: 'Erro ao salvar os dados do quiz.' });
    }
});

// Testar conexão SMTP ao iniciar
transporter.verify(function (error, success) {
    if (error) {
        logger.error(`Failed to verify SMTP connection: ${error.message}`);
    } else {
        logger.info('✅ Conexão SMTP verificada com sucesso');
    }
});

// Inicialização do servidor
app.listen(port, () => {
    loadQuizzes();
    logger.info('Iniciando o servidor...');
    logger.info(`🚀 Servidor rodando na porta ${port}`);
    logger.info(`🌎 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Frontend: ${FRONTEND_URL}`);
    logger.info(`✉️ SMTP: ${SMTP_USER}@${SMTP_HOST}`);
    logger.info(`📊 ActiveCampaign: ${dataConfig.activeCampaign.acApiKey ? 'Ativo' : 'Inativo'}`);
});