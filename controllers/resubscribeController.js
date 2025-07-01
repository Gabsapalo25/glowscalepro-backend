// controllers/resubscribeController.js

import * as ActiveCampaignService from "../services/activeCampaignService.js";
import tagMappings from "../data/tagMappings.js";
import logger from "../utils/logger.js";

export async function handleResubscribe(req, res) {
  try {
    const { email, quizId } = req.body;

    logger.debug("🔍 Dados recebidos para resubscribe", { email, quizId });

    if (!email || !quizId) {
      return res.status(400).json({ success: false, error: "Missing email or quizId" });
    }

    // 🔎 Buscar contato
    const contact = await ActiveCampaignService.getContactByEmail(email);
    if (!contact || !contact.id) {
      logger.warn(`⚠️ Contato não encontrado para o e-mail: ${email}`);
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    const contactId = contact.id;
    const listId = tagMappings.MASTER_LIST_ID;
    const productTagId = tagMappings.quizIdToTagId[quizId];

    logger.debug("📇 Contato localizado", { contactId, email, listId, productTagId });

    // ✅ Reinscreve o contato na lista mestre
    if (typeof ActiveCampaignService.addContactToList === "function") {
      await ActiveCampaignService.addContactToList(contactId, listId);
      logger.info(`✅ Contato reinscrito na lista ${listId}: ${email}`);
    }

    // ✅ Reaplica a tag de produto
    if (productTagId) {
      await ActiveCampaignService.applyTagToContact(email, productTagId);
      logger.info(`🏷️ Tag de produto reaplicada: ${productTagId} → ${email}`);
    } else {
      logger.warn(`⚠️ Tag de produto não encontrada para quizId: ${quizId}`);
    }

    // ✅ Remove tags de descadastro
    const { unsubscribeRequested, unsubscribeConfirmed } = tagMappings.specialTags;
    const tagsParaRemover = [unsubscribeRequested, unsubscribeConfirmed];

    for (const tag of tagsParaRemover) {
      try {
        await ActiveCampaignService.removeTagFromContact(contactId, tag.id);
        logger.info(`🧹 Tag '${tag.name}' (ID: ${tag.id}) removida de ${email}`);
      } catch (err) {
        logger.warn(`⚠️ Falha ao remover tag '${tag.name}' de ${email}: ${err.message}`);
      }
    }

    logger.info(`🔁 Resubscribe processado com sucesso para ${email}`);
    return res.status(200).json({ success: true });

  } catch (error) {
    logger.error("❌ ERRO interno em /api/resubscribe", {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
