// controllers/unsubscribeController.js
import axios from "axios";
import {
  getContactByEmail,
  applyTagToContact
} from "../services/activeCampaignService.js";

import tagMappings from "../data/tagMappings.js";
import logger from "../utils/logger.js";

const AC_API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
const AC_BASE_URL = process.env.ACTIVE_CAMPAIGN_API_URL || "https://glowscalepro48745.api-us1.com";

const TAG_DESCADASTRO_SOLICITADO = tagMappings.specialTags.unsubscribeRequested.id;
const TAG_DESCADASTRO_CONFIRMADO = tagMappings.specialTags.unsubscribeConfirmed.id;

export async function handleUnsubscribe(req, res) {
  const email = req.query.email || req.body.email;

  if (!email || typeof email !== "string") {
    logger.warn(`[UNSUBSCRIBE] 🚫 Email ausente ou inválido: ${email}`);
    return res.status(400).json({ success: false, error: "Missing or invalid email" });
  }

  logger.info(`[UNSUBSCRIBE] 📩 Requisição de descadastro recebida para: ${email}`);

  try {
    // 🔍 Verifica se o contato existe
    const contact = await getContactByEmail(email);
    if (!contact || !contact.id) {
      logger.warn(`[UNSUBSCRIBE] ❌ Contato não encontrado na ActiveCampaign: ${email}`);
      return res.status(404).json({ success: false, error: "Contact not found in ActiveCampaign" });
    }

    const contactId = contact.id;

    // ✅ Aplica tags de descadastro
    await applyTagToContact(email, TAG_DESCADASTRO_SOLICITADO);
    await applyTagToContact(email, TAG_DESCADASTRO_CONFIRMADO);
    logger.info(`[UNSUBSCRIBE] ✅ TAGs aplicadas com sucesso ao contato ${email}`);

    // 📤 Remove o contato de todas as listas
    const headers = { "Api-Token": AC_API_KEY };

    const listRes = await axios.get(`${AC_BASE_URL}/api/3/contacts/${contactId}/contactLists`, { headers });
    const lists = listRes.data.contactLists || [];

    for (const list of lists) {
      try {
        await axios.delete(`${AC_BASE_URL}/api/3/contactLists/${list.id}`, { headers });
        logger.info(`[UNSUBSCRIBE] 🧹 Contato ${email} removido da lista ID ${list.id}`);
      } catch (delErr) {
        logger.warn(`[UNSUBSCRIBE] ⚠️ Falha ao remover ${email} da lista ${list.id}: ${delErr.message}`);
      }
    }

    logger.info(`[UNSUBSCRIBE] ✅ ${email} removido de todas as listas e marcado como descadastrado`);
    return res.status(200).json({
      success: true,
      message: "Unsubscribe processed successfully"
    });

  } catch (err) {
    logger.error(`[UNSUBSCRIBE] ❌ Erro ao processar descadastro`, {
      message: err.message,
      stack: err.stack,
      email
    });

    return res.status(500).json({
      success: false,
      error: "Internal server error while processing unsubscribe"
    });
  }
}
