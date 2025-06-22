import axios from 'axios';
import dotenv from 'dotenv';
import { cleanEnv, str, num } from 'envalid';
import pino from 'pino';

dotenv.config();

const logger = pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
});

const env = cleanEnv(process.env, {
    ACTIVE_CAMPAIGN_API_URL: str({ devDefault: 'https://your-activecampaign-dev-url.com' }), 
    ACTIVE_CAMPAIGN_API_KEY: str({ devDefault: 'YOUR_DEV_ACTIVE_CAMPAIGN_API_KEY' }), 
    AC_LIST_ID_MASTERTOOLS_ALL: num({ devDefault: 12345 }), 
    UNSUBSCRIBE_TAG_ID: num({ devDefault: 67890 }), 
});

const acApiUrl = env.ACTIVE_CAMPAIGN_API_URL;
const acApiKey = env.ACTIVE_CAMPAIGN_API_KEY;

const AC_LIST_ID_MASTERTOOLS_ALL = env.AC_LIST_ID_MASTERTOOLS_ALL;
const AC_TAG_ID_UNSUBSCRIBE = env.UNSUBSCRIBE_TAG_ID;

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
        logger.info(`Successful ${method.toUpperCase()} request to ${endpoint}`);
        return response.data;
    } catch (error) {
        logger.error({
            error: error.message,
            status: error.response?.status,
            data: error.response?.data,
            endpoint: error.config?.url
        }, `ActiveCampaign API Error (${method.toUpperCase()} ${endpoint})`);
        throw error;
    }
};

const activeCampaignService = {
    findContactByEmail: async (email) => {
        logger.info(`Searching for contact with email: ${email}`);
        try {
            const response = await callActiveCampaign('get', `/api/3/contacts?email=${email}`);
            if (response && response.contacts && response.contacts.length > 0) {
                logger.info(`Contact found: ${response.contacts[0].id}`);
                return response.contacts[0];
            }
            logger.info(`Contact with email ${email} not found.`);
            return null;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                logger.info(`Contact with email ${email} not found (404 response).`);
                return null;
            }
            logger.error(`Error finding contact by email ${email}: ${error.message}`);
            throw error;
        }
    },

    createOrUpdateContact: async (email, listId) => {
        logger.info(`Attempting to create or update contact for email: ${email} on list ID: ${listId}`);
        let contactId;
        let contactData = {
            contact: {
                email: email
            }
        };

        try {
            const existingContact = await activeCampaignService.findContactByEmail(email);

            if (existingContact) {
                contactId = existingContact.id;
                logger.info(`Contact ${contactId} already exists. Updating contact.`);
            } else {
                logger.info(`Contact ${email} not found. Creating new contact.`);
                const response = await callActiveCampaign('post', '/api/3/contacts', contactData);
                contactId = response.contact.id;
                logger.info(`New contact created: ${contactId}`);
            }

            const contactListStatus = await activeCampaignService.getContactListStatus(contactId, listId);
            if (!contactListStatus || contactListStatus.status !== '1') {
                logger.info(`Adding contact ${contactId} to list ${listId}.`);
                await activeCampaignService.addContactToList(contactId, listId);
            } else {
                logger.info(`Contact ${contactId} already subscribed to list ${listId}.`);
            }
            
            return contactId;

        } catch (error) {
            logger.error(`Failed to create or update contact for ${email}: ${error.message}`);
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
            if (error.response && error.response.data.errors && error.response.data.errors[0].code === 'api_contact_contact_list_already_exists') {
                logger.warn(`Contact ${contactId} is already on list ${listId}.`);
                return true;
            }
            logger.error(`Failed to add contact ${contactId} to list ${listId}: ${error.message}`);
            throw error;
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
            throw error;
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
            if (error.response && error.response.data.errors && error.response.data.errors[0].code === 'api_contact_tag_already_exists') {
                logger.warn(`Tag ${tagId} already exists for contact ${contactId}.`);
                return true;
            }
            logger.error(`Failed to add tag ${tagId} to contact ${contactId}: ${error.message}`);
            throw error;
        }
    },

    hasTag: async (contactId, tagId) => {
        logger.info(`Checking if contact ${contactId} has tag ${tagId}.`);
        try {
            const response = await callActiveCampaign('get', `/api/3/contactTags?contact=${contactId}&tag=${tagId}`);
            return response && response.contactTags && response.contactTags.length > 0;
        } catch (error) {
            logger.error(`Error checking tag for contact ${contactId}: ${error.message}`);
            throw error;
        }
    },

    updateCustomFields: async (contactId, customFieldData) => {
        logger.info(`Updating custom fields for contact ${contactId}: ${JSON.stringify(customFieldData)}`);
        try {
            for (const field of customFieldData) {
                const fieldValue = {
                    field: field.id,
                    contact: contactId,
                    value: field.value
                };

                logger.info(`Querying field values for contact ${contactId}, field ${fieldValue.field}`);
                const existingFieldValues = await callActiveCampaign('get', `/api/3/fieldValues?contact=${contactId}&field=${fieldValue.field}`);
                logger.info(`Field values response: ${JSON.stringify(existingFieldValues)}`);

                if (existingFieldValues && existingFieldValues.fieldValues && existingFieldValues.fieldValues.length > 0) {
                    const fieldId = existingFieldValues.fieldValues[0].id;
                    logger.info(`Using field value ID ${fieldId} for field ${fieldValue.field}`);
                    try {
                        await callActiveCampaign('put', `/api/3/fieldValues/${fieldId}`, { fieldValue });
                        logger.info(`Updated custom field ${fieldValue.field} for contact ${contactId}`);
                    } catch (error) {
                        if (error.response?.status === 404) {
                            logger.warn(`Field value ${fieldId} not found, creating new one`);
                            await callActiveCampaign('post', '/api/3/fieldValues', { fieldValue });
                            logger.info(`Created custom field ${fieldValue.field} for contact ${contactId}`);
                        } else {
                            throw error;
                        }
                    }
                } else {
                    await callActiveCampaign('post', '/api/3/fieldValues', { fieldValue });
                    logger.info(`Created custom field ${fieldValue.field} for contact ${contactId}`);
                }
            }
            logger.info(`All custom fields updated successfully for contact ${contactId}`);
            return true;
        } catch (error) {
            logger.error({
                error: error.message,
                status: error.response?.status,
                data: error.response?.data,
                endpoint: error.config?.url,
                contactId,
                fields: customFieldData.map(f => f.id)
            }, `Failed to update custom fields for contact ${contactId}`);
            throw error;
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
            throw error;
        }
    }
};

export default activeCampaignService;