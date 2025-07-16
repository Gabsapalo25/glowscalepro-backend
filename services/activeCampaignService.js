// services/activeCampaignService.js

import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const AC_BASE_URL = `${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3`;
const API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;

if (!AC_BASE_URL || !API_KEY) {
  logger.error("❌ Configuração do ActiveCampaign ausente");
  throw new Error("ActiveCampaign não configurado");
}

const headers = {
  'Api-Token': API_KEY,
  'Content-Type': 'application/json',
};

// 🔁 Cria ou atualiza contato com segurança
export async function createOrUpdateContact({ email, name, phone = null, customFields = {} }) {
  try {
    const searchRes = await axios.get(`${AC_BASE_URL}/contacts?email=${email}`, { headers });
    const existingContact = searchRes.data.contacts?.[0];

    if (existingContact) {
      logger.info(`🔁 Contato já existente: ${email} (ID: ${existingContact.id}) – atualizando...`);

      const updatePayload = {
        contact: {
          firstName: name || existingContact.firstName,
          phone: phone || existingContact.phone,
          fieldValues: Object.entries(customFields).map(([fieldId, value]) => ({
            field: fieldId,
            value
          }))
        }
      };

      await axios.put(`${AC_BASE_URL}/contacts/${existingContact.id}`, updatePayload, { headers });
      return existingContact;
    } else {
      logger.info(`🆕 Criando novo contato: ${email}`);

      const createPayload = {
        contact: {
          email,
          firstName: name,
          phone,
          fieldValues: Object.entries(customFields).map(([fieldId, value]) => ({
            field: fieldId,
            value
          }))
        }
      };

      const response = await axios.post(`${AC_BASE_URL}/contacts`, createPayload, { headers });
      return response.data.contact;
    }
  } catch (error) {
    logger.error(`❌ Erro no createOrUpdateContact: ${error.message}`, {
      data: error.response?.data
    });
    throw error;
  }
}

// 🔍 Obtém contato por email
export async function getContactByEmail(email) {
  try {
    const response = await axios.get(`${AC_BASE_URL}/contacts?email=${email}`, { headers });
    const contact = response.data.contacts?.[0];
    return contact || null;
  } catch (error) {
    logger.error(`❌ Erro ao buscar contato por email (${email}): ${error.message}`);
    throw error;
  }
}

// 🏷️ Aplica uma tag a um contato
export async function applyTagToContact(contactId, tagId) {
  try {
    const payload = {
      contactTag: {
        contact: contactId,
        tag: tagId
      }
    };

    const response = await axios.post(`${AC_BASE_URL}/contactTags`, payload, { headers });

    logger.info(`🏷️ Tag ${tagId} aplicada ao contato ${contactId}`);
    return response.data.contactTag;
  } catch (error) {
    logger.error(`❌ Erro ao aplicar tag ao contato ${contactId}: ${error.message}`, {
      data: error.response?.data
    });
    throw error;
  }
}
