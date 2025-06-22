import axios from 'axios';
import dotenv from 'dotenv';
import { cleanEnv, str, num } from 'envalid';
import pino from 'pino';

dotenv.config();

const logger = pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
});

// Validação e limpeza das variáveis de ambiente usando envalid
// CORREÇÃO AQUI: Os nomes das chaves agora correspondem EXATAMENTE aos nomes no Render.
const env = cleanEnv(process.env, {
    // Mapeia para ACTIVE_CAMPAIGN_API_URL no Render
    ACTIVE_CAMPAIGN_API_URL: str({ devDefault: 'https://your-activecampaign-dev-url.com' }), 
    // Mapeia para ACTIVE_CAMPAIGN_API_KEY no Render
    ACTIVE_CAMPAIGN_API_KEY: str({ devDefault: 'YOUR_DEV_ACTIVE_CAMPAIGN_API_KEY' }), 
    // Esta variável (AC_LIST_ID_MASTERTOOLS_ALL) não foi listada no seu print do Render.
    // VOCÊ PRECISARÁ ADICIONÁ-LA NO RENDER OU AJUSTAR O NOME AQUI SE JÁ EXISTIR LÁ.
    // Por enquanto, vou deixá-la como está no seu código original, mas ela será "undefined" se não estiver no Render.
    AC_LIST_ID_MASTERTOOLS_ALL: num({ devDefault: 12345 }), 
    // Mapeia para UNSUBSCRIBE_TAG_ID no Render
    UNSUBSCRIBE_TAG_ID: num({ devDefault: 67890 }), 
    // Adicione outras variáveis de ambiente se houver e quiser validá-las aqui
});

// As variáveis locais agora usam os nomes validados do 'env' que correspondem ao Render.
const acApiUrl = env.ACTIVE_CAMPAIGN_API_URL;
const acApiKey = env.ACTIVE_CAMPAIGN_API_KEY;

// No service, ao invés de AC_LIST_ID_MASTERTOOLS_ALL e AC_TAG_ID_UNSUBSCRIBE,
// vamos usar diretamente as do 'env' mapeadas para os nomes do Render.
// Você precisará atualizar quaisquer chamadas que usem essas variáveis em outros lugares
// para usar env.AC_LIST_ID_MASTERTOOLS_ALL e env.UNSUBSCRIBE_TAG_ID.
// Ou, para manter a clareza e evitar alterar outras partes do código,
// podemos mapeá-las de volta para os nomes originais aqui:
const acListIdMastertoolsAll = env.AC_LIST_ID_MASTERTOOLS_ALL; // Esta linha dependerá de você ter esta variável no Render
const acTagIdUnsubscribe = env.UNSUBSCRIBE_TAG_ID;


const headers = {
    'Api-Token': acApiKey,
    'Content-Type': 'application/json',
};

// Função auxiliar para requisições ActiveCampaign
const callActiveCampaign = async (method, endpoint, data = null) => {
    try {
        const url = `${acApiUrl}${endpoint}`;
        let response;
        if (method === 'get') {
            response = await axios.get(url, { headers });
        } else if (method === 'post') {
            response = await axios.post(url, data, { headers });
        } else if (method === 'put') {
            response = await axios.put(url, data, { headers });
        } else if (method === 'delete') {
            response = await axios.delete(url, { headers });
        }
        return response.data;
    } catch (error) {
        logger.error(`ActiveCampaign API Error (${method.toUpperCase()} ${endpoint}): ${error.message}`);
        if (error.response) {
            logger.error('Response data:', error.response.data);
            logger.error('Response status:', error.response.status);
            logger.error('Response headers:', error.response.headers);
        } else if (error.request) {
            logger.error('No response received:', error.request);
        } else {
            logger.error('Error setting up request:', error.message);
        }
        throw error; // Propagar o erro para quem chamou
    }
};

const activeCampaignService = {
    findContactByEmail: async (email) => {
        logger.info(`Searching for contact with email: ${email}`);
        try {
            const response = await callActiveCampaign('get', `/api/3/contacts?email=${email}`);
            if (response && response.contacts && response.contacts.length > 0) {
                logger.info(`Contact found: ${response.contacts[0].id}`);
                return response.contacts[0].id;
            }
            logger.info(`Contact with email ${email} not found.`);
            return null;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                logger.info(`Contact with email ${email} not found (404 response).`);
                return null;
            }
            throw error;
        }
    },

    createOrUpdateContact: async (email, listId) => {
        logger.info(`Creating or updating contact for email: ${email} on list ID: ${listId}`);
        const contactData = {
            contact: {
                email: email
            }
        };

        try {
            const response = await callActiveCampaign('post', '/api/3/contacts', contactData);
            const contactId = response.contact.id;
            logger.info(`Contact created/updated: ${contactId}`);

            const contactListStatus = await activeCampaignService.getContactListStatus(contactId, listId);
            if (!contactListStatus || contactListStatus.status !== '1') {
                logger.info(`Adding contact ${contactId} to list ${listId}.`);
                await activeCampaignService.addContactToList(contactId, listId);
            } else {
                logger.info(`Contact ${contactId} already subscribed to list ${listId}.`);
            }
            return contactId;

        } catch (error) {
            if (error.response && error.response.data.errors && error.response.data.errors[0].code === 'api_contact_duplicate_email') {
                logger.warn(`Duplicate email when creating contact ${email}. Attempting to find existing contact.`);
                const existingContactId = await activeCampaignService.findContactByEmail(email);
                if (existingContactId) {
                    logger.info(`Found existing contact ${existingContactId} for email ${email}.`);
                    const contactListStatus = await activeCampaignService.getContactListStatus(existingContactId, listId);
                    if (!contactListStatus || contactListStatus.status !== '1') {
                        logger.info(`Adding existing contact ${existingContactId} to list ${listId}.`);
                        await activeCampaignService.addContactToList(existingContactId, listId);
                    } else {
                        logger.info(`Existing contact ${existingContactId} already subscribed to list ${listId}.`);
                    }
                    return existingContactId;
                }
            }
            throw error;
        }
    },

    addContactToList: async (contactId, listId) => {
        logger.info(`Attempting to add contact ${contactId} to list ${listId}.`);
        const data = {
            contactList: {
                list: listId,
                contact: contactId,
                status: 1
            }
        };
        try {
            await callActiveCampaign('post', '/api/3/contactLists', data);
            logger.info(`Contact ${contactId} successfully added/subscribed to list ${listId}.`);
            return true;
        } catch (error) {
            logger.error(`Failed to add contact ${contactId} to list ${listId}: ${error.message}`);
            return false;
        }
    },

    removeContactFromList: async (contactId, listId) => {
        logger.info(`Attempting to remove contact ${contactId} from list ${listId}.`);
        try {
            const response = await callActiveCampaign('get', `/api/3/contactLists?contact=${contactId}&list=${listId}`);
            if (response && response.contactLists && response.contactLists.length > 0) {
                const contactListId = response.contactLists[0].id;
                await callActiveCampaign('delete', `/api/3/contactLists/${contactListId}`);
                logger.info(`Contact ${contactId} successfully removed from list ${listId}.`);
                return true;
            }
            logger.warn(`Contact ${contactId} not found in list ${listId}. No action needed.`);
            return false;
        } catch (error) {
            logger.error(`Failed to remove contact ${contactId} from list ${listId}: ${error.message}`);
            return false;
        }
    },

    addTagToContact: async (contactId, tagId) => {
        logger.info(`Attempting to add tag ${tagId} to contact ${contactId}.`);
        const data = {
            contactTag: {
                contact: contactId,
                tag: tagId
            }
        };
        try {
            await callActiveCampaign('post', '/api/3/contactTags', data);
            logger.info(`Tag ${tagId} successfully added to contact ${contactId}.`);
            return true;
        } catch (error) {
            logger.error(`Failed to add tag ${tagId} to contact ${contactId}: ${error.message}`);
            return false;
        }
    },

    hasTag: async (contactId, tagId) => {
        logger.info(`Checking if contact ${contactId} has tag ${tagId}.`);
        try {
            const response = await callActiveCampaign('get', `/api/3/contactTags?contact=${contactId}&tag=${tagId}`);
            return response && response.contactTags && response.contactTags.length > 0;
        } catch (error) {
            logger.error(`Error checking tag for contact ${contactId}: ${error.message}`);
            return false;
        }
    },

    updateCustomFields: async (contactId, customFieldData) => {
        logger.info(`Updating custom fields for contact ${contactId}.`);
        const fieldValues = customFieldData.map(field => ({
            field: field.id,
            contact: contactId,
            value: field.value
        }));

        try {
            for (const fieldValue of fieldValues) {
                const existingFieldResponse = await callActiveCampaign('get', `/api/3/fieldValues?contact=${contactId}&field=${fieldValue.field}`);
                if (existingFieldResponse && existingFieldResponse.fieldValues && existingFieldResponse.fieldValues.length > 0) {
                    const fieldId = existingFieldResponse.fieldValues[0].id;
                    await callActiveCampaign('put', `/api/3/fieldValues/${fieldId}`, { fieldValue: fieldValue });
                    logger.info(`Updated custom field ${fieldValue.field} for contact ${contactId}.`);
                } else {
                    await callActiveCampaign('post', '/api/3/fieldValues', { fieldValue: fieldValue });
                    logger.info(`Created custom field ${fieldValue.field} for contact ${contactId}.`);
                }
            }
            logger.info(`All custom fields updated successfully for contact ${contactId}.`);
            return true;
        } catch (error) {
            logger.error(`Failed to update custom fields for contact ${contactId}: ${error.message}`);
            return false;
        }
    },

    getContactListStatus: async (contactId, listId) => {
        logger.info(`Getting list status for contact ${contactId} on list ${listId}.`);
        try {
            const response = await callActiveCampaign('get', `/api/3/contactLists?contact=${contactId}&list=${listId}`);
            if (response && response.contactLists && response.contactLists.length > 0) {
                return response.contactLists[0];
            }
            return null;
        } catch (error) {
            logger.error(`Error getting contact list status for contact ${contactId} on list ${listId}: ${error.message}`);
            return null;
        }
    }
};

export default activeCampaignService;