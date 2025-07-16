import axios from "axios";
import { ACTIVE_CAMPAIGN_API_KEY, ACTIVE_CAMPAIGN_BASE_URL } from "../config.js";

const headers = {
  "Api-Token": ACTIVE_CAMPAIGN_API_KEY,
  "Content-Type": "application/json",
};

const api = axios.create({
  baseURL: `${ACTIVE_CAMPAIGN_BASE_URL}/api/3`,
  headers,
});

// Cria ou atualiza um contato
export async function createOrUpdateContact({ email, name, customFields = {} }) {
  try {
    const response = await api.post("/contact/sync", {
      contact: {
        email,
        firstName: name,
        fieldValues: Object.entries(customFields).map(([fieldId, fieldValue]) => ({
          field: fieldId,
          value: fieldValue,
        })),
      },
    });

    return response.data.contact;
  } catch (error) {
    console.error("Erro ao criar/atualizar contato no ActiveCampaign:", error.response?.data || error.message);
    throw error;
  }
}

// Aplica uma TAG a um contato via e-mail
export async function applyTagToContact(email, tagId) {
  try {
    const contactId = await getContactIdByEmail(email);
    if (!contactId) throw new Error(`Contato não encontrado: ${email}`);

    await api.post("/contactTags", {
      contactTag: {
        contact: contactId,
        tag: tagId,
      },
    });

    return true;
  } catch (error) {
    console.error(`Erro ao aplicar TAG ${tagId} ao contato ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

// Obtém o ID do contato com base no e-mail
export async function getContactIdByEmail(email) {
  try {
    const response = await api.get(`/contacts?email=${email}`);
    const contacts = response.data.contacts;

    return contacts.length > 0 ? contacts[0].id : null;
  } catch (error) {
    console.error("Erro ao buscar contato por email:", error.response?.data || error.message);
    throw error;
  }
}

// Aplica múltiplas tags
export async function applyMultipleTagsToContact(email, tagIds = []) {
  for (const tagId of tagIds) {
    await applyTagToContact(email, tagId);
  }
}
