// services/activeCampaignService.js
import axios from 'axios';
import pino from 'pino';

// Configuração do logger
const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
        },
    },
});

class ActiveCampaignService {
    constructor(apiUrl, apiKey) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.api = axios.create({
            baseURL: `${this.apiUrl}/api/3`,
            headers: {
                'Api-Token': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Procura um contato pelo email.
     * @param {string} email
     * @returns {Promise<object|null>} O objeto do contato se encontrado, ou null.
     */
    async getContactByEmail(email) {
        logger.debug(`Searching for contact with email: ${email}`);
        try {
            const response = await this.api.get(`/contacts?email=${email}`);
            if (response.data && response.data.contacts.length > 0) {
                logger.info(`Contact found: ${response.data.contacts[0].id}`);
                return response.data.contacts[0];
            }
            logger.info(`Contact with email ${email} not found.`);
            return null;
        } catch (error) {
            logger.error(`Error searching for contact ${email}: ${error.message}`);
            // Log do erro detalhado da API do ActiveCampaign, se disponível
            if (error.response) {
                logger.error({
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers,
                }, `Response data for getContactByEmail error:`);
            }
            throw new Error(`Failed to search for contact: ${error.message}`);
        }
    }

    /**
     * Cria um novo contato no ActiveCampaign.
     * @param {string} email
     * @param {string} [firstName='']
     * @param {string} [lastName='']
     * @returns {Promise<object>} O objeto do novo contato.
     */
    async createContact(email, firstName = '', lastName = '') {
        logger.info(`Creating new contact: ${email}`);
        try {
            const response = await this.api.post('/contacts', {
                contact: { email, firstName, lastName }
            });
            logger.info(`New contact created: ${response.data.contact.id}`);
            return response.data.contact;
        } catch (error) {
            logger.error(`Error creating contact ${email}: ${error.message}`);
            if (error.response) {
                logger.error({
                    status: error.response.status,
                    data: error.response.data,
                }, `Response data for createContact error:`);
            }
            throw new Error(`Failed to create contact: ${error.message}`);
        }
    }

    /**
     * Adiciona um contato a uma lista.
     * @param {string} contactId
     * @param {string} listId
     * @returns {Promise<object>} O objeto de status da lista.
     */
    async addContactToList(contactId, listId) {
        logger.info(`Attempting to add contact ${contactId} to list ${listId}.`);
        try {
            const response = await this.api.post('/contactLists', {
                contactList: {
                    list: listId,
                    contact: contactId,
                    status: 1 // 1 = subscribed
                }
            });
            logger.info(`Contact ${contactId} successfully added/subscribed to list ${listId}.`);
            return response.data.contactList;
        } catch (error) {
            logger.error(`Error adding contact ${contactId} to list ${listId}: ${error.message}`);
            if (error.response) {
                logger.error({
                    status: error.response.status,
                    data: error.response.data,
                }, `Response data for addContactToList error:`);
            }
            throw new Error(`Failed to add contact to list: ${error.message}`);
        }
    }

    /**
     * Obtém o status de um contato em uma lista.
     * @param {string} contactId
     * @param {string} listId
     * @returns {Promise<object|null>} O objeto contactList se encontrado, ou null.
     */
    async getContactListStatus(contactId, listId) {
        logger.debug(`Getting list status for contact ${contactId} on list ${listId}.`);
        try {
            const response = await this.api.get(`/contactLists?contact=${contactId}&list=${listId}`);
            if (response.data && response.data.contactLists.length > 0) {
                return response.data.contactLists[0];
            }
            return null;
        } catch (error) {
            logger.error(`Error getting contact list status ${contactId} on list ${listId}: ${error.message}`);
            if (error.response) {
                logger.error({
                    status: error.response.status,
                    data: error.response.data,
                }, `Response data for getContactListStatus error:`);
            }
            throw new Error(`Failed to get contact list status: ${error.message}`);
        }
    }

    /**
     * Adiciona uma tag a um contato.
     * @param {string} contactId
     * @param {number} tagId O ID numérico da tag no ActiveCampaign.
     * @returns {Promise<object>} O objeto contactTag.
     */
    async addTagToContact(contactId, tagId) {
        logger.info(`Attempting to add tag ${tagId} to contact ${contactId}.`);
        try {
            const response = await this.api.post('/contactTags', {
                contactTag: {
                    contact: contactId,
                    tag: tagId
                }
            });
            logger.info(`Tag ${tagId} successfully added to contact ${contactId}.`);
            return response.data.contactTag;
        } catch (error) {
            logger.error(`Error adding tag ${tagId} to contact ${contactId}: ${error.message}`);
            if (error.response) {
                logger.error({
                    status: error.response.status,
                    data: error.response.data,
                }, `Response data for addTagToContact error:`);
            }
            // Não relance o erro se a tag já existir para evitar falha no fluxo.
            // O código 422 é geralmente para "Unprocessable Entity", pode indicar duplicação.
            if (error.response && error.response.status === 422 && error.response.data.errors && error.response.data.errors[0].code === 'duplicate') {
                logger.warn(`Tag ${tagId} already exists for contact ${contactId}. Skipping.`);
                return { status: 'already_exists' }; // Retorna um status indicando que já existe
            }
            throw new Error(`Failed to add tag ${tagId} to contact ${contactId}: ${error.message}`);
        }
    }

    /**
     * **ATUALIZAÇÃO IMPORTANTE AQUI:**
     * Esta função agora obtém ou cria o contato, adiciona à lista e, em uma única operação,
     * atualiza os campos personalizados.
     * Isso resolve o problema de tentar dar PUT em um fieldValueId que não existe para novos contatos.
     *
     * @param {string} email
     * @param {string} listId
     * @param {Array<object>} customFields Array de objetos { fieldId: string, value: string }
     * @param {string} [firstName='']
     * @param {string} [lastName='']
     * @returns {Promise<string>} O ID do contato criado ou atualizado.
     */
    async createOrUpdateContactAndFields(email, listId, customFields = [], firstName = '', lastName = '') {
        logger.info(`Attempting to create or update contact for email: ${email} on list ID: ${listId}`);
        let contact;
        let contactId;
        let isNewContact = false;

        try {
            contact = await this.getContactByEmail(email);

            if (contact) {
                contactId = contact.id;
                logger.info(`Contact found: ${contactId}. Updating existing contact.`);
                // Se o contato existe, prepara os dados para atualização (incluindo campos personalizados)
                // A API do ActiveCampaign permite enviar fieldValues junto com a atualização do contato.
                const updateData = {
                    contact: {
                        email,
                        firstName,
                        lastName,
                    }
                };

                if (customFields && customFields.length > 0) {
                    updateData.contact.fieldValues = customFields.map(field => ({
                        field: field.fieldId, // ID do campo personalizado
                        value: field.value,
                    }));
                }

                const response = await this.api.put(`/contacts/${contactId}`, updateData);
                contact = response.data.contact; // Atualiza o objeto do contato com a resposta
                logger.info(`Contact ${contactId} updated with custom fields.`);

            } else {
                logger.info(`Contact ${email} not found. Creating new contact.`);
                // Se o contato não existe, cria um novo (incluindo campos personalizados no payload inicial)
                isNewContact = true;
                const createData = {
                    contact: {
                        email,
                        firstName,
                        lastName,
                    }
                };

                if (customFields && customFields.length > 0) {
                    createData.contact.fieldValues = customFields.map(field => ({
                        field: field.fieldId, // ID do campo personalizado
                        value: field.value,
                    }));
                }

                const response = await this.api.post('/contacts', createData);
                contact = response.data.contact;
                contactId = contact.id;
                logger.info(`New contact created: ${contactId} with custom fields.`);
            }

            // Garante que o contato está na lista (se não estiver, adiciona)
            const contactListStatus = await this.getContactListStatus(contactId, listId);
            if (!contactListStatus || contactListStatus.status !== '1') {
                logger.info(`Adding contact ${contactId} to list ${listId}.`);
                await this.addContactToList(contactId, listId);
            } else {
                logger.info(`Contact ${contactId} already subscribed to list ${listId}.`);
            }

            return contactId;

        } catch (error) {
            logger.error(`Error in createOrUpdateContactAndFields for ${email}: ${error.message}`);
            if (error.response) {
                logger.error({
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers,
                }, `Response data for createOrUpdateContactAndFields error:`);
            }
            throw new Error(`Failed to process contact: ${error.message}`);
        }
    }
}

export default ActiveCampaignService;