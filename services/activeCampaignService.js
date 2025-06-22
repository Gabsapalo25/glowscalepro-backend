// services/activeCampaignService.js (Seu emailService.js atualizado)
import axios from 'axios';
import pino from 'pino';
import { cleanEnv, str, url } from 'envalid';

// Validar variáveis de ambiente
const env = cleanEnv(process.env, {
  ACTIVE_CAMPAIGN_API_URL: url({ default: '' }),
  ACTIVE_CAMPAIGN_API_KEY: str({ default: '' }),
  // Certifique-se de que esta variável esteja no seu .env
  AC_UNSUBSCRIBE_TAG_ID: str({ default: '' }), 
  // Opcional: Se você precisar do ID da lista principal para descadastro direto
  // AC_MAIN_LIST_ID: str({ default: '' }), 
});

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// ======================================================================
// FUNÇÃO EXISTENTE: createContact
// ======================================================================
export const createContact = async ({ email, firstName, lastName, score, total, q4, whatsapp, quizConfig }) => {
  if (!env.ACTIVE_CAMPAIGN_API_KEY || !env.ACTIVE_CAMPAIGN_API_URL) {
    logger.warn('ActiveCampaign not configured for contact creation.');
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
    logger.info(`Contact created/updated in ActiveCampaign for ${email}`);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to integrate with ActiveCampaign (createContact)');
    throw error;
  }
};

// ======================================================================
// NOVA FUNÇÃO: getContactByEmail
// ======================================================================
export const getContactByEmail = async (email) => {
  if (!env.ACTIVE_CAMPAIGN_API_KEY || !env.ACTIVE_CAMPAIGN_API_URL) {
    logger.warn('ActiveCampaign not configured for contact lookup.');
    return null;
  }

  try {
    const response = await axios.get(
      `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/contacts?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.contacts && response.data.contacts.length > 0) {
      logger.info(`Found contact ${email} with ID: ${response.data.contacts[0].id}`);
      return response.data.contacts[0]; // Retorna o primeiro contato encontrado
    } else {
      logger.info(`No contact found for email: ${email}`);
      return null;
    }
  } catch (error) {
    // Se o erro for 404, significa que o contato não existe, podemos retornar null
    if (error.response && error.response.status === 404) {
      logger.info(`Contact ${email} not found in ActiveCampaign (404).`);
      return null;
    }
    logger.error({ error: error.message, stack: error.stack }, `Failed to get contact by email from ActiveCampaign: ${email}`);
    throw error;
  }
};

// ======================================================================
// NOVA FUNÇÃO: addTagToContact
// ======================================================================
export const addTagToContact = async (contactId, tagId) => {
  if (!env.ACTIVE_CAMPAIGN_API_KEY || !env.ACTIVE_CAMPAIGN_API_URL) {
    logger.warn('ActiveCampaign not configured for adding tags.');
    return;
  }
  if (!contactId || !tagId) {
    logger.warn('Contact ID or Tag ID missing for addTagToContact.');
    return;
  }

  try {
    await axios.post(
      `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/contactTags`,
      {
        contactTag: {
          contact: contactId,
          tag: tagId
        }
      },
      {
        headers: {
          'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    logger.info(`Tag ${tagId} added to contact ${contactId} in ActiveCampaign.`);
  } catch (error) {
    // Se a tag já existe no contato, a API do AC pode retornar um erro 422 (Unprocessable Entity)
    if (error.response && error.response.status === 422 && error.response.data.errors && error.response.data.errors[0].code === 'duplicate_contact_tag') {
        logger.info(`Tag ${tagId} already exists for contact ${contactId}. No action needed.`);
        return; // Retorna sem erro, pois o estado desejado já foi alcançado
    }
    logger.error({ error: error.message, stack: error.stack }, `Failed to add tag ${tagId} to contact ${contactId} in ActiveCampaign.`);
    throw error;
  }
};

// ======================================================================
// FUNÇÃO OPCIONAL: unsubscribeContactFromList (se você quiser descadastrar diretamente da lista)
// ======================================================================
export const unsubscribeContactFromList = async (contactId, listId) => {
    if (!env.ACTIVE_CAMPAIGN_API_KEY || !env.ACTIVE_CAMPAIGN_API_URL) {
        logger.warn('ActiveCampaign not configured for list unsubscription.');
        return;
    }
    if (!contactId || !listId) {
        logger.warn('Contact ID or List ID missing for unsubscribeContactFromList.');
        return;
    }

    try {
        await axios.put(
            `${env.ACTIVE_CAMPAIGN_API_URL}/api/3/contactLists/${contactId}/${listId}`, // PUT para atualizar status
            {
                contactList: {
                    contact: contactId,
                    list: listId,
                    status: 2 // Status 2 = Unsubscribed
                }
            },
            {
                headers: {
                    'Api-Token': env.ACTIVE_CAMPAIGN_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        logger.info(`Contact ${contactId} unsubscribed from list ${listId} in ActiveCampaign.`);
    } catch (error) {
        logger.error({ error: error.message, stack: error.stack }, `Failed to unsubscribe contact ${contactId} from list ${listId} in ActiveCampaign.`);
        throw error;
    }
};