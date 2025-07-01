// services/activeCampaignService.js
import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const AC_BASE_URL = `${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3`;
const API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
const MASTER_LIST_ID = parseInt(process.env.MASTER_LIST_ID) || 5;

const headers = {
  'Api-Token': API_KEY,
  'Content-Type': 'application/json',
};

// 🔹 Cria ou atualiza um contato
export async function createOrUpdateContact({ email, name = '', listId = MASTER_LIST_ID }) {
  try {
    const response = await axios.post(
      `${AC_BASE_URL}/contacts/sync`,
      {
        contact: {
          email,
          firstName: name,
          list: listId,
        },
      },
      { headers }
    );
    logger.info(`✅ Contato criado/atualizado: ${email}`);
    return response.data.contact;
  } catch (error) {
    logger.error(`❌ Erro ao criar/atualizar contato: ${error.message}`, {
      email,
      data: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// 🔹 Busca um contato por e-mail
export async function getContactByEmail(email) {
  try {
    const response = await axios.get(`${AC_BASE_URL}/contacts`, {
      headers,
      params: { email },
    });

    const contact = response.data.contacts?.[0];
    return contact || null;
  } catch (error) {
    logger.error(`❌ Erro ao buscar contato: ${error.message}`, {
      email,
      data: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// 🔹 Aplica uma tag única
export async function applyTagToContact(email, tagId) {
  try {
    const contact = await getContactByEmail(email);
    if (!contact) throw new Error(`Contato com email ${email} não encontrado.`);

    const response = await axios.post(
      `${AC_BASE_URL}/contactTags`,
      {
        contactTag: {
          contact: contact.id,
          tag: tagId,
        },
      },
      { headers }
    );
    logger.info(`🏷️ Tag ${tagId} aplicada ao contato ${email}`);
    return response.data.contactTag;
  } catch (error) {
    if (error.response?.status === 409) {
      logger.warn(`⚠️ Tag ${tagId} já estava aplicada a ${email}`);
      return { success: true, message: "Tag já aplicada anteriormente" };
    }
    logger.error(`❌ Erro ao aplicar tag ${tagId} a ${email}: ${error.message}`);
    throw error;
  }
}

// 🔹 Aplica várias tags
export async function applyMultipleTagsToContact(email, tagIds = []) {
  const results = [];
  for (const tagId of tagIds) {
    try {
      const result = await applyTagToContact(email, tagId);
      results.push(result);
    } catch (err) {
      logger.warn(`⚠️ Falha ao aplicar tag ${tagId} para ${email}: ${err.message}`);
    }
  }
  return results;
}

// 🔹 Remove tag específica
export async function removeTagFromContact(email, tagId) {
  try {
    const contact = await getContactByEmail(email);
    if (!contact) throw new Error(`Contato com email ${email} não encontrado.`);

    const tagsResponse = await axios.get(`${AC_BASE_URL}/contactTags`, {
      headers,
      params: {
        contact: contact.id,
        tag: tagId,
      },
    });

    const contactTag = tagsResponse.data.contactTags?.[0];
    if (contactTag) {
      await axios.delete(`${AC_BASE_URL}/contactTags/${contactTag.id}`, { headers });
      logger.info(`🧹 Tag ${tagId} removida de ${email}`);
    } else {
      logger.info(`ℹ️ Nenhuma tag ${tagId} associada ao contato ${email}`);
    }
  } catch (error) {
    logger.error(`❌ Erro ao remover tag ${tagId} de ${email}: ${error.message}`);
  }
}

// 🔹 Remove o contato da lista
export async function removeContactFromList(email, listId = MASTER_LIST_ID) {
  try {
    const contact = await getContactByEmail(email);
    if (!contact) throw new Error(`Contato com email ${email} não encontrado.`);

    const response = await axios.get(`${AC_BASE_URL}/contactLists`, {
      headers,
      params: {
        contact: contact.id,
        list: listId,
      },
    });

    const listEntry = response.data.contactLists?.[0];
    if (listEntry) {
      await axios.delete(`${AC_BASE_URL}/contactLists/${listEntry.id}`, { headers });
      logger.info(`📭 Contato ${email} removido da lista ${listId}`);
    } else {
      logger.info(`ℹ️ Contato ${email} não estava na lista ${listId}`);
    }
  } catch (error) {
    logger.error(`❌ Erro ao remover contato da lista: ${error.message}`);
    throw error;
  }
}
