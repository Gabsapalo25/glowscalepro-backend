// activeCampaignService.js - VERSÃO CORRIGIDA
import axios from 'axios';
import pino from 'pino';

const logger = pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
});

// Função para inicializar o serviço com base nas variáveis do app.locals
const initializeService = (appLocals) => {
    const acApiUrl = appLocals.acApiUrl;
    const acApiKey = appLocals.acApiKey;
    const AC_LIST_ID_MASTERTOOLS_ALL = appLocals.acListIdMastertoolsAll;
    const AC_TAG_ID_UNSUBSCRIBE = appLocals.acTagIdUnsubscribe;

    const headers = {
        'Api-Token': acApiKey,
        'Content-Type': 'application/json',
    };

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
            throw error;
        }
    };

    return {
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

                const contactListStatus = await getContactListStatus(contactId, listId);
                if (!contactListStatus || contactListStatus.status !== '1') {
                    logger.info(`Adding contact ${contactId} to list ${listId}.`);
                    await addContactToList(contactId, listId);
                } else {
                    logger.info(`Contact ${contactId} already subscribed to list ${listId}.`);
                }
                return contactId;

            } catch (error) {
                if (error.response && error.response.data.errors && error.response.data.errors[0].code === 'api_contact_duplicate_email') {
                    logger.warn(`Duplicate email when creating contact ${email}. Attempting to find existing contact.`);
                    const existingContactId = await findContactByEmail(email);
                    if (existingContactId) {
                        logger.info(`Found existing contact ${existingContactId} for email ${email}.`);
                        const contactListStatus = await getContactListStatus(existingContactId, listId);
                        if (!contactListStatus || contactListStatus.status !== '1') {
                            logger.info(`Adding existing contact ${existingContactId} to list ${listId}.`);
                            await addContactToList(existingContactId, listId);
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
                return