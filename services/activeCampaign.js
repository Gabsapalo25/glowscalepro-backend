// services/activeCampaign.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ACTIVE_CAMPAIGN_API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
const ACTIVE_CAMPAIGN_API_URL = process.env.ACTIVE_CAMPAIGN_API_URL;

const api = axios.create({
  baseURL: `${ACTIVE_CAMPAIGN_API_URL}/api/3`,
  headers: {
    'Api-Token': ACTIVE_CAMPAIGN_API_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Cria ou atualiza um contato no ActiveCampaign.
 * @param {Object} contactData
 * @param {string} contactData.name
 * @param {string} contactData.email
 * @param {string} [contactData.phone]
 */
export async function createOrUpdateContact({ name, email, phone }) {
  try {
    const response = await api.post('/contact/sync', {
      contact: {
        email,
        firstName: name,
        phone
      }
    });

    return response.data.contact;
  } catch (error) {
    const status = error.response?.status;
    const details = error.response?.data;

    console.error('❌ ActiveCampaign contact error:', {
      status,
      details
    });

    throw new Error(`ActiveCampaign contact creation failed with status ${status}`);
  }
}

/**
 * Aplica uma tag a um contato no ActiveCampaign.
 * @param {number|string} contactId
 * @param {number|string} tagId
 */
export async function applyTagToContact(contactId, tagId) {
  try {
    await api.post('/contactTags', {
      contactTag: {
        contact: contactId,
        tag: tagId
      }
    });
  } catch (error) {
    const status = error.response?.status;
    const details = error.response?.data;

    console.warn('⚠️ Failed to apply tag to contact:', {
      contactId,
      tagId,
      status,
      details
    });

    throw new Error(`Failed to apply tag with status ${status}`);
  }
}
