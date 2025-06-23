// services/activeCampaignService.js

import axios from 'axios';
import logger from '../utils/logger.js'; // Importa o logger centralizado

class ActiveCampaignService {
    constructor(apiUrl, apiKey) {
        if (!apiUrl || !apiKey) {
            logger.warn('⚠️ ActiveCampaignService initialized without API URL or Key. Operations will be skipped.');
            this.isEnabled = false;
            return;
        }

        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.axiosInstance = axios.create({
            baseURL: `${this.apiUrl}/api/3`,
            headers: {
                'Api-Token': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
        this.isEnabled = true;
        logger.info('✅ ActiveCampaignService initialized successfully.');
    }

    async request(method, endpoint, data = null) {
        if (!this.isEnabled) {
            logger.debug(`⏩ ActiveCampaign operation skipped: ${method} ${endpoint} (Service not enabled).`);
            return null;
        }
        try {
            const config = { method, url: endpoint, data };
            logger.debug(`⚡ ActiveCampaign API Request: ${method} ${endpoint}`);
            const response = await this.axiosInstance(config);
            logger.debug(`✅ ActiveCampaign API Response for ${endpoint}: Status ${response.status}`);
            return response.data;
        } catch (error) {
            if (error.response) {
                logger.error({
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers,
                    endpoint: endpoint,
                }, `❌ ActiveCampaign API Error for ${endpoint}: ${error.response.statusText}`);
            } else if (error.request) {
                logger.error({ request: error.request, endpoint: endpoint }, `❌ ActiveCampaign API No Response for ${endpoint}`);
            } else {
                logger.error({ message: error.message, endpoint: endpoint }, `❌ ActiveCampaign API Request Setup Error for ${endpoint}`);
            }
            throw new Error(`ActiveCampaign API Error: ${error.message}`);
        }
    }

    async createOrUpdateContactAndFields(email, listId, customFields = [], firstName = '', lastName = '') {
        if (!this.isEnabled) return null;

        let contactData = {
            contact: {
                email: email,
                firstName: firstName,
                lastName: lastName,
            }
        };

        try {
            logger.debug(`Searching for contact with email: ${email}`);
            const searchResponse = await this.request('GET', `/contacts?email=${email}`);
            let contactId;

            if (searchResponse && searchResponse.contacts && searchResponse.contacts.length > 0) {
                contactId = searchResponse.contacts[0].id;
                logger.info(`Contact found: ${email} (ID: ${contactId}). Updating...`);
                // Update existing contact
                await this.request('PUT', `/contacts/${contactId}`, contactData);
            } else {
                logger.info(`Contact not found: ${email}. Creating new contact...`);
                // Create new contact
                const createResponse = await this.request('POST', '/contacts', contactData);
                contactId = createResponse.contact.id;
            }

            // Ensure contact is associated with the list
            logger.debug(`Adding contact ${contactId} to list ${listId}...`);
            await this.request('POST', '/contactLists', {
                contactList: {
                    list: listId,
                    contact: contactId,
                    status: 1 // 1 for active
                }
            });

            // Update custom fields
            if (customFields.length > 0) {
                for (const field of customFields) {
                    if (field.fieldId && field.value !== undefined && field.value !== null) {
                        logger.debug(`Updating custom field ${field.fieldId} for contact ${contactId} with value: ${field.value}`);
                        await this.request('POST', '/fieldValues', {
                            fieldValue: {
                                contact: contactId,
                                field: field.fieldId,
                                value: String(field.value), // Ensure value is a string
                            }
                        });
                    } else {
                         logger.warn(`Skipping invalid custom field for contact ${contactId}: ${JSON.stringify(field)}`);
                    }
                }
            }
            logger.info(`Contact ${contactId} created/updated and fields processed successfully.`);
            return contactId;

        } catch (error) {
            logger.error({ email, listId, customFields, firstName, error_message: error.message }, '❌ Error in createOrUpdateContactAndFields');
            throw error;
        }
    }

    async addTagToContact(contactId, tagId) {
        if (!this.isEnabled) return null;
        try {
            logger.debug(`Adding tag ${tagId} to contact ${contactId}`);
            await this.request('POST', '/contactTags', {
                contactTag: {
                    contact: contactId,
                    tag: tagId,
                },
            });
            logger.info(`Tag ${tagId} added to contact ${contactId}.`);
        } catch (error) {
            logger.error({ contactId, tagId, error_message: error.message }, '❌ Error adding tag to contact');
            throw error;
        }
    }

    async removeTagFromContact(contactId, tagId) {
        if (!this.isEnabled) return null;
        try {
            // ActiveCampaign API doesn't have a direct "remove by contact and tag ID".
            // You usually delete the contactTag association.
            // First, find the contactTag ID
            const response = await this.request('GET', `/contactTags?contact=${contactId}&tag=${tagId}`);
            if (response && response.contactTags && response.contactTags.length > 0) {
                const contactTagId = response.contactTags[0].id;
                logger.debug(`Removing contactTag ${contactTagId} for contact ${contactId} and tag ${tagId}`);
                await this.request('DELETE', `/contactTags/${contactTagId}`);
                logger.info(`Tag ${tagId} removed from contact ${contactId}.`);
            } else {
                logger.warn(`Tag ${tagId} not found for contact ${contactId}. No action taken.`);
            }
        } catch (error) {
            logger.error({ contactId, tagId, error_message: error.message }, '❌ Error removing tag from contact');
            throw error;
        }
    }
}

export default ActiveCampaignService;