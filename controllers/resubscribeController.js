import * as ActiveCampaignService from "../services/activeCampaignService.js";
import tagMappings from "../data/tagMappings.js";
import logger from "../utils/logger.js";

export async function handleResubscribe(req, res) {
  try {
    const { email, quizId } = req.body;

    logger.debug(`🔍 Requisição de reativação recebida`, { email, quizId });

    if (!email || typeof email !== "string" || !quizId) {
      logger.warn(`🚫 Dados ausentes ou inválidos na requisição`, { email, quizId });
      return res.status(400).json({ success: false, error: "Missing or invalid email or quizId" });
    }

    const contact = await ActiveCampaignService.getContactByEmail(email);
    if (!contact || !contact.id) {
      logger.warn(`⚠️ Contato não encontrado para o e-mail: ${email}`);
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    const contactId = contact.id;
    const listId = tagMappings.MASTER_LIST_ID || 5;
    const productTagId = tagMappings.quizIdToTagId[quizId];

    logger.debug(`📇 Contato localizado`, { contactId, email, listId, productTagId });

    // ✅ Reinscreve o contato na lista mestre (se disponível)
    if (typeof ActiveCampaignService.addContactToList === "function") {
      await ActiveCampaignService.addContactToList(contactId, listId);
      logger.info(`✅ Contato ${email} reinscrito na lista ID ${listId}`);
    } else {
      logger.warn(`⚠️ Função 'addContactToList' não está disponível em ActiveCampaignService`);
    }

    // ✅ Reaplica a tag do produto, se houver
    if (productTagId) {
      await ActiveCampaignService.applyTagToContact(email, productTagId);
      logger.info(`🏷️ Tag de produto ${productTagId} reaplicada ao contato ${email}`);
    } else {
      logger.warn(`⚠️ Nenhuma tag mapeada para quizId: ${quizId}`);
    }

    // ✅ Remove tags de descadastro
    const { unsubscribeRequested, unsubscribeConfirmed } = tagMappings.specialTags || {};
    const tagsParaRemover = [unsubscribeRequested, unsubscribeConfirmed].filter(Boolean);

    for (const tag of tagsParaRemover) {
      try {
        await ActiveCampaignService.removeTagFromContact(contactId, tag.id);
        logger.info(`🧹 Tag '${tag.name}' (ID: ${tag.id}) removida do contato ${email}`);
      } catch (err) {
        logger.warn(`⚠️ Erro ao remover tag '${tag.name}' de ${email}: ${err.message}`);
      }
    }

    logger.info(`🔁 Reativação concluída com sucesso para ${email}`);
    return res.status(200).json({ success: true });

  } catch (error) {
    logger.error(`❌ Erro interno ao processar reativação`, {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: "Internal server error while processing resubscribe"
    });
  }
}
