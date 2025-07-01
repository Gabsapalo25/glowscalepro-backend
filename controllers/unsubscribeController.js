// controllers/unsubscribeController.js

import {
  createOrUpdateContact,
  getContactByEmail,
  applyTagToContact,
  removeContactFromList
} from '../services/activeCampaignService.js';

import tagMappings from '../data/tagMappings.js';
import logger from '../utils/logger.js';

const TAG_DESCADASTRO_SOLICITADO = tagMappings.specialTags.unsubscribeRequested.id;
const TAG_DESCADASTRO_CONFIRMADO = tagMappings.specialTags.unsubscribeConfirmed.id;
const MASTER_LIST_ID = tagMappings.MASTER_LIST_ID;

export async function handleUnsubscribe(req, res) {
  const email = req.query.email || req.body.email;

  if (!email || typeof email !== 'string') {
    logger.warn(`[UNSUBSCRIBE] 🚫 Email ausente ou inválido: ${email}`);
    return res.status(400).json({
      success: false,
      error: "Missing or invalid email"
    });
  }

  logger.info(`[UNSUBSCRIBE] 📩 Requisição de descadastro recebida para: ${email}`);

  try {
    // 1. Garante que o contato existe
    await createOrUpdateContact({ email });
    logger.debug(`[UNSUBSCRIBE] 🛠️ Contato criado/atualizado com sucesso: ${email}`);

    // 2. Recupera o contato completo
    const contact = await getContactByEmail(email);
    if (!contact || !contact.id) {
      logger.warn(`[UNSUBSCRIBE] ❌ Contato não encontrado na ActiveCampaign: ${email}`);
      return res.status(404).json({
        success: false,
        error: "Contact not found in ActiveCampaign"
      });
    }

    const contactId = contact.id;
    logger.debug(`[UNSUBSCRIBE] ✅ Contato localizado. ID: ${contactId}`);

    // 3. Aplica tag de descadastro solicitado
    logger.debug(`[UNSUBSCRIBE] 🏷️ Aplicando tag DESCADASTRO_SOLICITADO (${TAG_DESCADASTRO_SOLICITADO})`);
    await applyTagToContact(email, TAG_DESCADASTRO_SOLICITADO);

    // 4. Remove o contato da lista mestre
    logger.debug(`[UNSUBSCRIBE] 🧹 Removendo da lista mestre ID: ${MASTER_LIST_ID}`);
    await removeContactFromList(contactId, MASTER_LIST_ID);

    // 5. Aplica tag de descadastro confirmado
    logger.debug(`[UNSUBSCRIBE] ✅ Aplicando tag DESCADASTRO_CONFIRMADO (${TAG_DESCADASTRO_CONFIRMADO})`);
    await applyTagToContact(email, TAG_DESCADASTRO_CONFIRMADO);

    // 6. Responde com sucesso
    logger.info(`[UNSUBSCRIBE] ✅ Descadastro processado com sucesso para ${email}`);
    return res.status(200).json({
      success: true,
      message: "Unsubscribe processed successfully"
    });

  } catch (err) {
    logger.error(`[UNSUBSCRIBE] ❌ Erro ao processar descadastro`, {
      message: err.message,
      stack: err.stack
    });

    return res.status(500).json({
      success: false,
      error: "Internal server error while processing unsubscribe"
    });
  }
}
