import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import axios from 'axios';
import pino from 'pino';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { cleanEnv, str, port, bool, url } from 'envalid';
import sanitizeHtml from 'sanitize-html';
import https from 'https';
import cookieParser from 'cookie-parser';
import { getById } from './config/quizzesConfig.js';

console.log('Iniciando o servidor...');
dotenv.config();

const env = cleanEnv(process.env, {
  PORT: port({ default: 10000 }),
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  FRONTEND_URL: url({ default: 'https://glowscalepro-2.funnels.mastertools.com' }),
  SMTP_HOST: str(),
  SMTP_PORT: port(),
  SMTP_SECURE: bool(),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  SMTP_TLS_REJECT_UNAUTHORIZED: bool({ default: false }),
  ACTIVE_CAMPAIGN_API_URL: url({ default: 'https://glowscalepro48745.api-us1.com' }),
  ACTIVE_CAMPAIGN_API_KEY: str(),
  ADMIN_EMAIL: str(),
  LOG_LEVEL: str({ default: 'info' }),
  SRC_SECRET: str({ default: 'm3Jvgl0pExEMKDfSk7PVuAdxzi8wvZ6X' })
});

const logger = pino({
  level: env.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization']
}));
app.disable('x-powered-by');

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} (IP: ${req.ip})`);
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  skip: req => req.ip === '::1'
});

const transporter = nodemailer.createTransport({
  pool: true,
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED
  }
});

transporter.verify((error) => {
  if (error) {
    logger.error(`❌ Falha na conexão SMTP: ${error.message}`);
  } else {
    logger.info('✅ Conexão SMTP verificada com sucesso');
  }
});

const generateCsrfToken = (req, res) => {
  const csrfToken = Buffer.from(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)).toString('base64');
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 600000
  });
  res.json({ csrfToken });
};

const csrfProtection = (req, res, next) => {
  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromCookie = req.cookies ? req.cookies['XSRF-TOKEN'] : null;

  if (env.NODE_ENV === 'development' && tokenFromHeader && tokenFromHeader === tokenFromCookie) {
    return next();
  }

  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    logger.warn('Token CSRF inválido ou ausente');
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

const validateQuizPayload = (req, res, next) => {
  const requiredFields = ['name', 'email', 'score', 'total', 'quizId', 'countryCode', 'q4', 'consent'];
  const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null);
  
  if (missingFields.length > 0) {
    logger.warn('Campos obrigatórios ausentes: %j', missingFields);
    return res.status(400).json({ 
      error: 'Campos obrigatórios ausentes',
      missingFields
    });
  }
  
  if (typeof req.body.score !== 'number' || typeof req.body.total !== 'number') {
    return res.status(400).json({ error: 'Score e total devem ser números' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.email)) {
    logger.warn('E-mail inválido: %s', req.body.email);
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  next();
};

app.post('/send-result', csrfProtection, validateQuizPayload, apiLimiter, async (req, res) => {
  try {
    const { name, email, score, total, quizId, countryCode, whatsapp, q4, consent } = req.body;
    const sanitizedName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });
    const sanitizedEmail = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} });
    const sanitizedQ4 = sanitizeHtml(q4, { allowedTags: [], allowedAttributes: {} });

    const quizConfig = getById(quizId);
    if (!quizConfig) {
      logger.warn(`Quiz não encontrado: ${quizId}`);
      return res.status(400).json({ error: 'Quiz inválido.' });
    }

    const leadHtml = quizConfig.generateEmailContent({
      name: sanitizedName,
      score,
      total,
      q4: sanitizedQ4,
      affiliateLink: quizConfig.affiliateLink,
      ctaColor: quizConfig.ctaColor,
      quizTitle: quizConfig.quizTitle,
      physicalAddress: quizConfig.physicalAddress,
      privacyUrl: quizConfig.privacyUrl,
      unsubscribeUrl: quizConfig.unsubscribeUrl
    });

    logger.info({
      to: sanitizedEmail,
      subject: quizConfig.subject,
      htmlPreview: leadHtml.substring(0, 500) + (leadHtml.length > 500 ? '...' : '')
    }, '📬 Lead Email Preview');

    const sanitizedHtml = sanitizeHtml(leadHtml, {
      allowedTags: ['a', 'p', 'h1', 'h2', 'h3', 'div', 'span', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'img'],
      allowedAttributes: {
        a: ['href', 'target', 'rel', 'style'],
        img: ['src', 'alt', 'width', 'height', 'style'],
        '*': ['style', 'class']
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel']
    });

    await transporter.sendMail({
      from: `"${quizConfig.quizTitle}" <${env.SMTP_USER}>`,
      to: sanitizedEmail,
      subject: quizConfig.subject,
      html: sanitizedHtml,
      text: sanitizedHtml.replace(/<[^>]*>/g, '')
    });
    logger.info(`✉️ E-mail enviado para: ${sanitizedEmail}`);

    if (env.ADMIN_EMAIL) {
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Novo resultado de quiz</h2>
          <p><strong>Quiz:</strong> ${quizId} (${quizConfig.quizTitle})</p>
          <p><strong>Nome:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${sanitizedEmail}</p>
          <p><strong>WhatsApp:</strong> ${countryCode}${whatsapp || 'Não informado'}</p>
          <p><strong>Pontuação:</strong> ${score} / ${total}</p>
          <p><strong>Resposta Q4:</strong> ${sanitizedQ4}</p>
          <p><strong>Consentimento:</strong> ${consent ? 'Sim' : 'Não'}</p>
          <p><strong>Link de Afiliado:</strong> ${quizConfig.affiliateLink}</p>
        </div>
      `;
      
      await transporter.sendMail({
        from: `"GlowscalePro System" <${env.SMTP_USER}>`,
        to: env.ADMIN_EMAIL,
        subject: `[${quizId}] Novo resultado recebido`,
        html: adminHtml
      });
      logger.info(`👤 Admin notificado: ${env.ADMIN_EMAIL}`);
    }

    if (consent && env.ACTIVE_CAMPAIGN_API_KEY && env.ACTIVE_CAMPAIGN_API_URL) {
      try {
        const [firstName, ...rest] = sanitizedName.split(' ');
        const lastName = rest.join(' ') || '';

        const contactPayload = {
          contact: {
            email: sanitizedEmail,
            firstName,
            lastName,
            phone: `${countryCode}${whatsapp || ''}`,
            fieldValues: [
              {
                field: quizConfig.activeCampaignFields.scoreFieldId,
                value: `${score}/${total}`
              },
              {
                field: quizConfig.activeCampaignFields.q4FieldId,
                value: sanitizedQ4
              }
            ]
          }
        };

        if (quizConfig.activeCampaignFields.whatsappFieldId) {
          contactPayload.contact.fieldValues.push({
            field: quizConfig.activeCampaignFields.whatsappFieldId,
            value: `${countryCode}${whatsapp || ''}`
          });
        }

        const httpsAgent = new https.Agent({ 
          rejectUnauthorized: env.NODE_ENV === 'production' 
        });

        const contactResponse = await axios.post(
          `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/contact/sync`,
          contactPayload,
          {
            headers: {
              'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
              'Content-Type': 'application/json'
            },
            httpsAgent
          }
        );

        const contactId = contactResponse.data.contact.id;
        logger.info(`🔄 Contato criado/atualizado no ActiveCampaign: ${contactId}`);

        await axios.post(
          `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/contactLists`,
          {
            contactList: {
              list: quizConfig.activeCampaignFields.listId,
              contact: contactId,
              status: 1
            }
          },
          {
            headers: {
              'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
              'Content-Type': 'application/json'
            },
            httpsAgent
          }
        );

        if (quizConfig.leadTagId) {
          try {
            logger.info(`🔍 Verificando tag ID: ${quizConfig.leadTagId}`);
            
            const tagResponse = await axios.get(
              `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/tags/${quizConfig.leadTagId}`,
              {
                headers: {
                  'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY
                },
                httpsAgent
              }
            );

            if (tagResponse.data.tag) {
              await axios.post(
                `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/contactTags`,
                {
                  contactTag: {
                    contact: contactId,
                    tag: quizConfig.leadTagId
                  }
                },
                {
                  headers: {
                    'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
                    'Content-Type': 'application/json'
                  },
                  httpsAgent
                }
              );
              logger.info(`🏷️ Tag "${tagResponse.data.tag.tag}" aplicada ao contato ${contactId}`);
            }
          } catch (tagError) {
            const errorMsg = tagError.response?.data?.message || tagError.message;
            logger.error(`❌ Falha ao aplicar tag: ${errorMsg}`);
            
            if (tagError.response?.status === 404) {
              logger.warn(`⚠️ Tentando criar tag ID ${quizConfig.leadTagId}`);
              try {
                await axios.post(
                  `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/tags`,
                  {
                    tag: {
                      tag: quizConfig.quizTitle + " Lead",
                      tagType: "contact",
                      description: `Leads do quiz ${quizConfig.quizTitle}`
                    }
                  },
                  {
                    headers: {
                      'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
                      'Content-Type': 'application/json'
                    },
                    httpsAgent
                  }
                );
                logger.info(`✅ Tag criada: ${quizConfig.quizTitle} Lead`);
              } catch (createError) {
                logger.error(`❌ Falha ao criar tag: ${createError.message}`);
              }
            }
          }
        }

        logger.info(`✅ Contato ${contactId} sincronizado com sucesso`);

      } catch (acError) {
        const errorDetails = acError.response?.data || acError.message;
        logger.error('❌ Falha na integração com ActiveCampaign: %j', errorDetails);
      }
    }

    res.status(200).json({ 
      success: true,
      message: 'Resultado processado com sucesso',
      quizTitle: quizConfig.quizTitle
    });
    
  } catch (error) {
    logger.error(`❌ Erro: ${error.message}`);
    logger.error(error.stack);
    
    res.status(500).json({ 
      error: 'Erro interno no servidor',
      message: error.message,
      ...(env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

app.get('/api/csrf-token', (req, res) => {
  generateCsrfToken(req, res);
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${env.PORT}`);
  logger.info(`🌎 Ambiente: ${env.NODE_ENV}`);
  logger.info(`🔗 Frontend: ${env.FRONTEND_URL}`);
  logger.info(`✉️ SMTP: ${env.SMTP_USER}@${env.SMTP_HOST}`);
  logger.info(`📊 ActiveCampaign: ${env.ACTIVE_CAMPAIGN_API_URL ? 'Ativo' : 'Inativo'}`);
});

const shutdown = () => {
  logger.info('🛑 Recebido sinal de desligamento...');
  server.close(() => {
    logger.info('✅ Servidor fechado com sucesso');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('❌ Forçando desligamento após timeout');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (err) => {
  logger.error(`💥 Exceção não capturada: ${err.message}`);
  logger.error(err.stack);
  shutdown();
});

process.on('unhandledRejection', (reason) => {
  logger.error(`⚠️ Rejeição não tratada: ${reason}`);
});