// index.js — Versão FINAL e consolidada
// -------------------------------------------------------------------------------------------------
// • SMTP robusto com fallback de segurança
// • CSRF (token por cookie) para rotas que precisam de proteção
// • ActiveCampaign sincroniza tags e força entrada na lista
// • Novo endpoint para Descadastro via ActiveCampaign
// • Logging profissional e CORS configurado para múltiplas origens
// -------------------------------------------------------------------------------------------------

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import { cleanEnv, str, url } from 'envalid'; // Importar cleanEnv, str, url

// Imports de módulos existentes
import { quizzesConfig } from './config/quizzesConfig.js';
import {
  generateTokmateEmailContent,
  generatePrimeBiomeEmailContent,
  generateProdentimEmailContent,
  generateNervoViveEmailContent,
  generateTotalControlEmailContent,
  generateGlucoShieldEmailContent,
  generateProstadineEmailContent
} from './services/templates/templates.js';

// Importar as funções do ActiveCampaignService (CERTIFIQUE-SE DE QUE ESTE ARQUIVO ESTEJA ATUALIZADO)
import { getContactByEmail, addTagToContact } from './services/activeCampaignService.js';


// ------------------------------------------------------
// Configuração Inicial e Variáveis de Ambiente
// ------------------------------------------------------
dotenv.config(); // Carrega as variáveis do .env

const app = express();
const PORT = process.env.PORT || 10000;
const ENV = process.env.NODE_ENV || 'development';

// Validação das variáveis de ambiente usando envalid
const env = cleanEnv(process.env, {
    PORT: str({ default: '10000' }),
    NODE_ENV: str({ default: 'development', choices: ['development', 'production', 'test'] }),
    FRONTEND_URL: url(),
    MASTERTOOLS_UNSUBSCRIBE_URL: url(), // Usado para CORS do endpoint de descadastro
    
    // SMTP
    SMTP_HOST: str(),
    SMTP_PORT: str(),
    SMTP_SECURE: str({ choices: ['true', 'false'] }),
    SMTP_USER: str(),
    SMTP_PASS: str(),
    SMTP_TLS_REJECT_UNAUTHORIZED: str({ choices: ['true', 'false'] }),

    // ActiveCampaign
    ACTIVE_CAMPAIGN_API_URL: url(),
    ACTIVE_CAMPAIGN_API_KEY: str(),
    AC_UNSUBSCRIBE_TAG_ID: str(), // ID da tag 'descadastro-solicitado'

    // Admin & Logging
    ADMIN_EMAIL: str(),
    LOG_LEVEL: str({ default: 'info', choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] }),
    MASTER_LIST_ID: str({ default: '' }), // ID da sua lista principal, se usada

    // Development Testing
    DEV_API_KEY: str({ default: '' }), // Para propósitos de desenvolvimento/teste

    // Redis (para CSRF e Rate Limiting)
    REDIS_URL: url({ default: 'redis://localhost:6379' }),
    SRC_SECRET: str(), // Chave secreta para sessions/cookies
});


// ------------------------------------------------------
// Logger
// ------------------------------------------------------
// Usando console.log/error/warn diretamente para simplicidade.
// Você pode integrar seu pino logger configurado aqui se preferir.
const logger = {
  info: (...args) => console.log('INFO:', ...args),
  error: (...args) => console.error('ERROR:', ...args),
  warn: (...args) => console.warn('WARN:', ...args)
};


// ------------------------------------------------------
// Middlewares Globais
// ------------------------------------------------------
app.use(helmet()); // Proteção de cabeçalhos HTTP
app.use(cookieParser()); // Parsing de cookies
app.use(bodyParser.json()); // Parsing de corpo de requisição JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parsing de corpo de requisição URL-encoded


// Configuração CORS (Permite múltiplas origens de acordo com o .env)
const allowedOrigins = [env.FRONTEND_URL];
// Adiciona o URL da MasterTools à lista de origens permitidas se for diferente
if (env.MASTERTOOLS_UNSUBSCRIBE_URL && !allowedOrigins.includes(env.MASTERTOOLS_UNSUBSCRIBE_URL)) {
    allowedOrigins.push(env.MASTERTOOLS_UNSUBSCRIBE_URL);
}
// Se FRONTEND_URL e MASTERTOOLS_UNSUBSCRIBE_URL forem o mesmo, não há duplicação na lista.

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origem (como de clientes REST ou mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `CORS Error: Origin '${origin}' is not allowed by the application's CORS policy.`;
            logger.error(msg); // Logar o erro de CORS para depuração
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // Necessário para enviar/receber cookies (ex: CSRF token)
}));

// Proteção CSRF - Usar apenas onde for necessário (rotas de formulário)
// A rota de descadastro da MasterTools NÃO usará isso.
const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'lax' } });


// ------------------------------------------------------
// Nodemailer — Configuração SMTP
// ------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: env.SMTP_SECURE === 'true', // true para porta 465 (TLS), false para 587 (STARTTLS)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  },
  tls: {
    // Definir como true em produção para segurança rigorosa
    rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true'
  }
});

transporter.verify(err =>
  err
    ? logger.error('❌ SMTP connection failed:', err.message)
    : logger.info('✅ SMTP connection verified successfully')
);


// ------------------------------------------------------
// Rotas da API
// ------------------------------------------------------

// Rota para obter token CSRF (Protegida por CSRF)
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Rota para envio de resultados de quiz e sincronização com ActiveCampaign (Protegida por CSRF)
app.post('/send-result', csrfProtection, async (req, res) => {
  try {
    const { name, email, score, total, quizId, q4 = '', whatsapp = '' } = req.body;
    const quiz = quizzesConfig.find(q => q.quizId === quizId);
    
    if (!quiz) {
        logger.warn(`Quiz configuration not found for quizId: ${quizId}`);
        return res.status(400).json({ success: false, message: 'Quiz configuration not found.' });
    }

    // 1. Envio de Email
    const html = quiz.emailTemplateFunction({
      name,
      score,
      total,
      q4,
      affiliateLink: quiz.affiliateLink,
      ctaColor: quiz.ctaColor,
      ctaText: quiz.ctaText
    });

    await transporter.sendMail({
      from: env.SMTP_USER,
      to: email,
      cc: env.ADMIN_EMAIL,
      subject: quiz.subject,
      html
    });
    logger.info(`📨 Email sent to ${email} (quiz: ${quizId})`);

    // 2. Sincronização com ActiveCampaign (usando API Contact Sync)
    // O endpoint contact/sync já cria ou atualiza o contato e adiciona tags.
    logger.info(`📌 Applying tag: ${quiz.leadTag} for quizId: ${quizId}`);

    const syncRes = await axios.post(
      `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/contact/sync`,
      {
        contact: {
          email,
          firstName: name,
          // Você pode querer passar lastName aqui se tiver
          fieldValues: [
            { field: quiz.activeCampaignFields.scoreFieldId, value: `${score}/${total}` }, // Corrigido para incluir /total
            { field: quiz.activeCampaignFields.q4FieldId, value: q4 },
            { field: quiz.activeCampaignFields.whatsappFieldId, value: whatsapp }
          ]
        },
        tags: [quiz.leadTag] // Adiciona a tag de lead
      },
      {
        headers: {
          'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const contactId = syncRes.data?.contact?.id;
    if (contactId) {
      // 3. Adiciona o contato à lista principal (se ainda não estiver)
      // Substitua `list: 5` pelo seu `env.MASTER_LIST_ID` se for usá-lo.
      // O status 1 (Active) garante que ele esteja na lista.
      await axios.post(
        `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/contactLists`,
        {
          contactList: {
            list: 5, // <--- VERIFIQUE E ATUALIZE ESTE ID DE LISTA SE NECESSÁRIO!
            contact: contactId,
            status: 1 
          }
        },
        {
          headers: {
            'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      logger.info(`✅ Contact ${email} added to list ID 5`); // Log com o ID da lista
    } else {
      logger.warn(`⚠️ Contact ID not found in sync response for ${email}. Could not add to list.`);
    }

    res.json({ success: true, message: 'Email sent and ActiveCampaign updated.' });
  } catch (err) {
    logger.error('❌ Failed to process quiz result:', err.message, err.stack);
    // Erros específicos de axios podem ser mais detalhados
    if (err.response) {
        logger.error('ActiveCampaign API Error Response:', err.response.data);
    }
    res.status(500).json({ success: false, message: 'Failed to send email or update contact.' });
  }
});


// ======================================================================
// NOVA ROTA: /api/unsubscribe (para o processo de descadastro)
// Esta rota NÃO usa csrfProtection porque a requisição virá de um domínio externo (MasterTools)
// e não terá o token CSRF.
// ======================================================================
app.post('/api/unsubscribe', async (req, res) => {
    const { email } = req.body; // O e-mail virá no corpo da requisição POST

    if (!email) {
        logger.warn('Unsubscribe request: Email is missing from request body.');
        return res.status(400).json({ message: 'Email is required for unsubscribe.' });
    }

    try {
        // 1. Encontrar o contato pelo email usando o activeCampaignService
        const contact = await getContactByEmail(email); 

        if (!contact) {
            logger.info(`Unsubscribe: Contact not found for email: ${email}. No action needed as contact already non-existent/unsubscribed.`);
            // Se o contato não for encontrado, ele já não está ativo ou não existe.
            // Retorna sucesso para o front-end, pois o objetivo de não receber emails foi atingido.
            return res.status(200).json({ message: 'Unsubscribe processed or contact not found.' });
        }
        
        const contactId = contact.id;
        logger.info(`Unsubscribe: Contact found: ${email}, ID: ${contactId}. Attempting to add unsubscribe tag.`);

        // 2. Adicionar a tag 'descadastro-solicitado' usando o activeCampaignService
        const tagId = env.AC_UNSUBSCRIBE_TAG_ID; // Pega o ID da tag do .env
        if (!tagId) {
            logger.error("Unsubscribe: AC_UNSUBSCRIBE_TAG_ID is not defined in .env. Cannot process request.");
            return res.status(500).json({ message: 'Server configuration error: Unsubscribe Tag ID missing.' });
        }
        
        await addTagToContact(contactId, tagId); // Chama a função do serviço
        logger.info(`Unsubscribe: Tag 'descadastro-solicitado' (${tagId}) successfully added to contact ${contactId}. Automation will handle list removal.`);

        // A automação no ActiveCampaign (gatilho: tag 'descadastro-solicitado' adicionada)
        // já irá cuidar do processo de descadastro da lista e outras ações.
        
        res.status(200).json({ message: 'Unsubscribe request processed successfully.' });

    } catch (error) {
        logger.error('Unsubscribe: Error during process:', error.message, error.stack);
        // Logar mais detalhes se for um erro de resposta da API (ex: ActiveCampaign)
        if (error.response) {
            logger.error('ActiveCampaign API Error Response for Unsubscribe:', error.response.data);
        }
        res.status(500).json({ message: 'Internal server error during unsubscribe process.', error: error.message });
    }
});


// ------------------------------------------------------
// Iniciar Servidor
// ------------------------------------------------------
app.listen(PORT, () => {
  logger.info(`🟢 Server running at http://localhost:${PORT}`);
  logger.info(`🌍 Environment: \x1b[34m${env.NODE_ENV}\x1b[0m`);
  logger.info(`🌐 Frontend URL: \x1b[35m${env.FRONTEND_URL}\x1b[0m`);
  if (env.MASTERTOOLS_UNSUBSCRIBE_URL) {
    logger.info(`🌐 MasterTools Unsubscribe URL allowed: \x1b[35m${env.MASTERTOOLS_UNSUBSCRIBE_URL}\x1b[0m`);
  }
  logger.info(`📧 SMTP User: \x1b[36m${env.SMTP_USER}\x1b[0m`);
  logger.info(`🔗 ActiveCampaign Base URL: \x1b[32m${env.ACTIVE_CAMPAIGN_API_URL}\x1b[0m`);
});