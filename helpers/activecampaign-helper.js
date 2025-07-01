// helpers/activecampaign-helper.js
import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const AC_URL = process.env.ACTIVE_CAMPAIGN_API_URL;
const AC_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
const AC_LIST_ID = parseInt(process.env.AC_LIST_ID_MASTERTOOLS_ALL) || 5;

const headers = {
  'Api-Token': AC_KEY,
  'Content-Type': 'application/json'
};

/**
 * Cria ou atualiza um contato e aplica uma TAG na ActiveCampaign
 * @param {Object} params
 * @param {string} params.email - Email do contato
 * @param {string} params.name - Nome do contato
 * @param {number|string} params.tagId - ID da tag a ser aplicada
 */
export async function addOrUpdateContactWithTag({ email, name, tagId }) {
  try {
    // Etapa 1: Criação/sincronização do contato
    const syncPayload = {
      contact: {
        email,
        firstName: name
      }
    };

    const syncResponse = await axios.post(`${AC_URL}/api/3/contacts/sync`, syncPayload, { headers });
    const contact = syncResponse.data.contact;
    const contactId = contact.id;

    logger.info(`✅ Contato sincronizado: ${email} (ID: ${contactId})`);

    // Etapa 2: Inscrição manual à lista (caso necessário)
    if (AC_LIST_ID) {
      try {
        await axios.post(`${AC_URL}/api/3/contactLists`, {
          contactList: {
            contact: contactId,
            list: AC_LIST_ID,
            status: 1 // 1 = subscribed
          }
        }, { headers });

        logger.info(`📩 Contato ${email} adicionado à lista ${AC_LIST_ID}`);
      } catch (listError) {
        if (listError.response?.status !== 409) {
          logger.error(`❌ Erro ao adicionar contato à lista: ${listError.message}`, {
            data: listError.response?.data
          });
        } else {
          logger.warn(`⚠️ Contato ${email} já está na lista ${AC_LIST_ID}`);
        }
      }
    }

    // Etapa 3: Aplicar tag (se fornecida)
    if (tagId) {
      try {
        await axios.post(`${AC_URL}/api/3/contactTags`, {
          contactTag: {
            contact: contactId,
            tag: parseInt(tagId)
          }
        }, { headers });

        logger.info(`🏷️ Tag ${tagId} aplicada ao contato ${email}`);
      } catch (tagError) {
        if (tagError.response?.status === 409) {
          logger.warn(`⚠️ Tag ${tagId} já aplicada ao contato ${email}`);
        } else {
          logger.error(`❌ Erro ao aplicar tag: ${tagError.message}`, {
            data: tagError.response?.data
          });
        }
      }
    }

    return { success: true, contactId };
  } catch (error) {
    logger.error(`❌ Erro ao sincronizar contato com ActiveCampaign: ${error.message}`, {
      data: error.response?.data
    });
    throw new Error('Erro ao sincronizar com ActiveCampaign');
  }
}
