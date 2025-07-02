import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// 🔧 Configurações
const AC_BASE_URL = `${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3`;
const API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
const MASTER_LIST_ID = parseInt(process.env.MASTER_LIST_ID || '5');

// ✅ Validação de variáveis
if (!AC_BASE_URL || !API_KEY) {
  logger.error("❌ Configuração do ActiveCampaign ausente");
  throw new Error("ActiveCampaign não configurado");
}

const headers = {
  'Api-Token': API_KEY,
  'Content-Type': 'application/json',
};

// ✅ Cria ou atualiza um contato (com listId)
export async function createOrUpdateContact({ email, name = '' }) {
  try {
    const response = await axios.post(`${AC_BASE_URL}/contacts/sync`, {
      contact: {
        email,
        firstName: name,
        listId: MASTER_LIST_ID // Adiciona à lista principal
      },
    }, { headers });

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

// ✅ Recupera contato por email
export async function getContactByEmail(email) {
  try {
    const response = await axios.get(`${AC_BASE_URL}/contacts`, {
      headers,
      params: { email },
    });

    return response.data.contacts?.[0] || null;
  } catch (error) {
    logger.error(`❌ Erro ao buscar contato: ${error.message}`, {
      email,
      data: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// ✅ Aplica uma tag individual (exportada corretamente)
export async function applyTagToContact(email, tagId) {
  try {
    const contact = await getContactByEmail(email);
    if (!contact) throw new Error(`Contato com email ${email} não encontrado.`);

    const response = await axios.post(`${AC_BASE_URL}/contactTags`, {
      contactTag: {
        contact: contact.id,
        tag: tagId,
      },
    }, { headers });

    logger.info(`🏷️ Tag ${tagId} aplicada ao contato ${email}`);
    return response.data.contactTag;
  } catch (error) {
    if (error.response?.status === 409) {
      logger.warn(`⚠️ Tag ${tagId} já aplicada a ${email}`);
      return { success: true, message: "Tag já aplicada anteriormente" };
    }

    logger.error(`❌ Erro ao aplicar tag ${tagId} a ${email}: ${error.message}`);
    throw error;
  }
}

// ✅ Aplica múltiplas tags
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

// ✅ Remove tag de um contato
export async function removeTagFromContact(contactId, tagId) {
  try {
    const tagsResponse = await axios.get(`${AC_BASE_URL}/contactTags`, {
      headers,
      params: {
        contact: contactId,
        tag: tagId,
      },
    });

    const contactTag = tagsResponse.data.contactTags?.[0];
    if (contactTag) {
      await axios.delete(`${AC_BASE_URL}/contactTags/${contactTag.id}`, { headers });
      logger.info(`🧹 Tag ${tagId} removida do contato ID: ${contactId}`);
    } else {
      logger.info(`ℹ️ Nenhuma tag ${tagId} associada ao contato ID: ${contactId}`);
    }
  } catch (error) {
    logger.error(`❌ Erro ao remover tag ${tagId} do contato ${contactId}: ${error.message}`);
  }
}

// ✅ Remove o contato de uma lista
export async function removeContactFromList(contactId, listId = MASTER_LIST_ID) {
  try {
    const response = await axios.get(`${AC_BASE_URL}/contactLists`, {
      headers,
      params: {
        contact: contactId,
        list: listId,
      },
    });

    const listEntry = response.data.contactLists?.[0];
    if (listEntry) {
      await axios.delete(`${AC_BASE_URL}/contactLists/${listEntry.id}`, { headers });
      logger.info(`📭 Contato ID ${contactId} removido da lista ${listId}`);
    } else {
      logger.info(`ℹ️ Contato ID ${contactId} não estava na lista ${listId}`);
    }
  } catch (error) {
    logger.error(`❌ Erro ao remover contato ${contactId} da lista ${listId}: ${error.message}`);
  }
}

// ✅ Adiciona contato a uma lista (reinscrição)
export async function addContactToList(contactId, listId = MASTER_LIST_ID) {
  try {
    const response = await axios.post(`${AC_BASE_URL}/contactLists`, {
      contactList: {
        list: listId,
        contact: contactId,
        status: 1 // 1 = subscribed
      }
    }, { headers });

    logger.info(`📩 Contato ID ${contactId} inscrito na lista ${listId}`);
    return response.data.contactList;
  } catch (error) {
    if (error.response?.status === 409) {
      logger.warn(`⚠️ Contato ID ${contactId} já inscrito na lista ${listId}`);
      return { success: true, message: "Já inscrito na lista" };
    }

    logger.error(`❌ Erro ao adicionar contato ${contactId} à lista ${listId}: ${error.message}`, {
      data: error.response?.data,
    });
    throw error;
  }
}