import crypto from 'crypto';
import axios from 'axios';
import https from 'https';
import { logger } from '../config/logger.js';
import { getQuizConfig } from '../config/quizzesConfig.js';
import { sendEmail } from '../services/emailService.js';
import sanitizeHtml from 'sanitize-html';

export const sendQuizResult = async (req, res) => {
  try {
    const {
      name,
      email,
      score,
      total,
      quizId,
      countryCode,
      whatsapp,
      q4,
      consent
    } = req.body;

    // Sanitização de entrada
    const sanitizedName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });
    const sanitizedEmail = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} });
    const sanitizedQ4 = sanitizeHtml(q4, { allowedTags: [], allowedAttributes: {} });

    // Validação de campos obrigatórios
    if (!sanitizedName || !sanitizedEmail || typeof score === 'undefined' || typeof total === 'undefined' || !quizId) {
      logger.warn('Campos obrigatórios ausentes ou inválidos');
      return res.status(400).json({ error: 'Campos obrigatórios ausentes ou inválidos' });
    }

    // Obter configuração do quiz
    const quizConfig = getQuizConfig(quizId);
    if (!quizConfig) {
      logger.warn({ quizId }, 'Configuração do quiz não encontrada');
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    // Gerar ID único para o resultado
    const resultId = crypto.randomBytes(16).toString('hex');
    logger.info({ resultId, quizId }, 'Novo resultado de quiz recebido');

    // Enviar e-mail para o lead
    const emailResult = await sendEmail({
      to: sanitizedEmail,
      subject: quizConfig.subject,
      template: quizConfig.emailTemplate,
      context: {
        name: sanitizedName,
        score,
        total,
        q4: sanitizedQ4,
        affiliateLink: quizConfig.affiliateLink
      }
    });
    logger.info({ email: sanitizedEmail, resultId }, '✅ E-mail enviado para o lead');

    // Notificar admin (se configurado)
    if (process.env.ADMIN_EMAIL) {
      const adminHtml = `
        <div>
          <h2>New quiz result received</h2>
          <p><strong>Quiz:</strong> ${quizId}</p>
          <p><strong>Name:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${sanitizedEmail}</p>
          <p><strong>WhatsApp:</strong> ${countryCode || ''}${whatsapp || 'Not provided'}</p>
          <p><strong>Score:</strong> ${score} / ${total}</p>
          <p><strong>Key insight (Q4):</strong> ${sanitizedQ4}</p>
          <p><strong>Consent:</strong> ${consent ? 'Yes' : 'No'}</p>
          <p><strong>Affiliate Link:</strong> ${quizConfig.affiliateLink}</p>
        </div>
      `;
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New ${quizId} submission`,
        html: adminHtml
      }).catch(adminEmailError => {
        logger.warn({ error: adminEmailError.message }, 'Erro ao notificar admin');
      });
    }

    // Integração com ActiveCampaign
    if (consent && process.env.ACTIVE_CAMPAIGN_API_KEY && process.env.ACTIVE_CAMPAIGN_API_URL) {
      const [firstName, ...rest] = sanitizedName.split(' ');
      const lastName = rest.join(' ') || '';
      
      try {
        // 1. Criar payload com estrutura correta para API v3
        const contactPayload = {
          contact: {
            email: sanitizedEmail,
            firstName: firstName,
            lastName: lastName,
            phone: `${countryCode}${whatsapp || ''}`, // Campo padrão
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

        // Adicionar campo personalizado de WhatsApp se existir
        if (quizConfig.activeCampaignFields.whatsappFieldId) {
          contactPayload.contact.fieldValues.push({
            field: quizConfig.activeCampaignFields.whatsappFieldId,
            value: `${countryCode}${whatsapp || ''}`
          });
        }

        // 2. Configuração SSL adaptativa
        const httpsAgent = new https.Agent({
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        });

        // 3. Sincronizar contato (POST para /contact/sync)
        const contactResponse = await axios.post(
          `${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3/contact/sync`,
          contactPayload,
          {
            headers: {
              'Api-Token': process.env.ACTIVE_CAMPAIGN_API_KEY,
              'Content-Type': 'application/json'
            },
            httpsAgent
          }
        );

        const contactId = contactResponse.data.contact.id;
        logger.info(`Contato criado no AC: ${contactId}`);

        // 4. Adicionar à lista
        await axios.post(
          `${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3/contactLists`,
          {
            contactList: {
              list: quizConfig.activeCampaignFields.listId,
              contact: contactId,
              status: 1
            }
          },
          {
            headers: {
              'Api-Token': process.env.ACTIVE_CAMPAIGN_API_KEY,
              'Content-Type': 'application/json'
            },
            httpsAgent
          }
        );

        // 5. Adicionar tag (se existir)
        if (quizConfig.leadTag) {
          await axios.post(
            `${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3/contactTags`,
            {
              contactTag: {
                contact: contactId,
                tag: quizConfig.leadTag
              }
            },
            {
              headers: {
                'Api-Token': process.env.ACTIVE_CAMPAIGN_API_KEY,
                'Content-Type': 'application/json'
              },
              httpsAgent
            }
          );
        }

        logger.info({ email: sanitizedEmail }, '✅ Contato sincronizado com ActiveCampaign');

      } catch (acError) {
        // LOG DETALHADO COM RESPOSTA DA API
        logger.error({
          status: acError.response?.status,
          data: acError.response?.data,
          endpoint: acError.config?.url,
          payload: contactPayload
        }, 'Erro detalhado no ActiveCampaign');
        
        throw new Error('Erro na integração com ActiveCampaign');
      }
    }

    logger.info(`✅ Resultado processado para ${sanitizedEmail}`);
    res.status(200).json({ 
      message: 'Resultado enviado com sucesso.',
      resultId
    });
    
  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      body: req.body
    }, '❌ Erro inesperado no controlador de quiz');
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

// Middleware para gerar token CSRF
export const generateCsrfToken = (req, res) => {
  const csrfToken = crypto.randomBytes(64).toString('hex');
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 600000 // 10 minutos
  });
  res.json({ csrfToken });
};