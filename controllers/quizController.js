import crypto from 'crypto';
import axios from 'axios';
import https from 'https';
import { logger } from '../config/logger.js';
import { getQuizConfig } from '../config/quizzesConfig.js';
import { sendEmail } from '../services/emailService.js';
import sanitizeHtml from 'sanitize-html';

export const sendResult = async (req, res) => {
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
      logger.warn('Missing or invalid required fields', { quizId, email: sanitizedEmail });
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    // Obter configuração do quiz
    const quizConfig = getQuizConfig(quizId);
    if (!quizConfig) {
      logger.warn('Quiz configuration not found', { quizId });
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Gerar ID único para o resultado
    const resultId = crypto.randomBytes(16).toString('hex');
    logger.info('New quiz result received', { resultId, quizId, email: sanitizedEmail, score });

    // Enviar e-mail para o lead
    logger.info(`Sending email to ${sanitizedEmail} with subject: ${quizConfig.subject}`);
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
    logger.info(`Email sent to ${sanitizedEmail}`, { resultId });

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
        logger.warn('Failed to notify admin', { error: adminEmailError.message });
      });
    }

    // Integração com ActiveCampaign
    if (consent && process.env.ACTIVE_CAMPAIGN_API_KEY && process.env.ACTIVE_CAMPAIGN_API_URL) {
      const [firstName, ...rest] = sanitizedName.split(' ');
      const lastName = rest.join(' ') || '';
      
      try {
        // Criar payload para API v3
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

        // Adicionar campo WhatsApp se configurado
        if (quizConfig.activeCampaignFields.whatsappFieldId && whatsapp) {
          contactPayload.contact.fieldValues.push({
            field: quizConfig.activeCampaignFields.whatsappFieldId,
            value: `${countryCode}${whatsapp}`
          });
        }

        // Configuração SSL adaptativa
        const httpsAgent = new https.Agent({
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        });

        // Sincronizar contato
        logger.info(`Syncing contact for ${sanitizedEmail} with list ${quizConfig.activeCampaignFields.listId || process.env.AC_LIST_ID_MASTERTOOLS_ALL}`);
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
        logger.info(`Contact synced: ${contactId}`, { email: sanitizedEmail });

        // Adicionar à lista
        const listId = quizConfig.activeCampaignFields.listId || process.env.AC_LIST_ID_MASTERTOOLS_ALL;
        await axios.post(
          `${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3/contactLists`,
          {
            contactList: {
              list: listId,
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
        logger.info(`Contact ${contactId} added to list ${listId}`);

        // Adicionar tag (se configurado)
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
          logger.info(`Tag ${quizConfig.leadTag} added to contact ${contactId}`);
        }

      } catch (acError) {
        logger.error({
          error: acError.message,
          status: acError.response?.status,
          data: acError.response?.data,
          endpoint: acError.config?.url,
          email: sanitizedEmail
        }, 'ActiveCampaign integration failed');
        // Continuar para não interromper a resposta ao usuário
      }
    }

    logger.info(`Quiz result processed successfully for ${sanitizedEmail}`, { resultId });
    res.status(200).json({ 
      message: 'Result sent successfully.',
      resultId
    });
    
  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      body: req.body
    }, 'Unexpected error in quiz controller');
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getCsrfToken = (req, res) => {
  const csrfToken = crypto.randomBytes(64).toString('hex');
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 600000 // 10 minutos
  });
  res.json({ csrfToken });
};