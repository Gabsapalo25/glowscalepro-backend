import axios from 'axios';
import pino from 'pino';
import { cleanEnv, str, url } from 'envalid';

// Validar variáveis de ambiente
const env = cleanEnv(process.env, {
  ACTIVE_CAMPAIGN_API_URL: url({ default: '' }),
  ACTIVE_CAMPAIGN_API_KEY: str({ default: '' })
});

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export const createContact = async ({ email, firstName, lastName, score, total, q4, whatsapp, quizConfig }) => {
  if (!env.ACTIVE_CAMPAIGN_API_KEY || !env.ACTIVE_CAMPAIGN_API_URL) {
    logger.warn('ActiveCampaign não configurado');
    return;
  }

  try {
    await axios.post(
      `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/contacts`,
      {
        contact: {
          email,
          first_name: firstName,
          last_name: lastName,
          fieldValues: [
            { field: quizConfig.activeCampaignFields.scoreFieldId, value: `${score}/${total}` },
            { field: quizConfig.activeCampaignFields.q4FieldId, value: q4 },
            { field: quizConfig.activeCampaignFields.whatsappFieldId, value: whatsapp }
          ],
          lists: [{ list: quizConfig.activeCampaignFields.listId, status: 1 }],
          tags: [quizConfig.leadTag]
        }
      },
      {
        headers: {
          'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    logger.info(`Contacto criado no ActiveCampaign para ${email}`);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Falha na integração com ActiveCampaign');
    throw error;
  }
};