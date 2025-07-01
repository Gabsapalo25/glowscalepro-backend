// controllers/unsubscribeController.js
import axios from "axios";
import {
  getContactByEmail,
  applyTagToContact
} from "../services/activeCampaignService.js";

import tagMappings from "../data/tagMappings.js";
import logger from "../utils/logger.js";

const AC_API_KEY = process.env.AC_API_KEY;
const AC_BASE_URL = process.env.AC_BASE_URL || "https://glowscalepro48745.api-us1.com/api/3";

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

    // 📤 Envia status 2 = unsubscribe
    await axios.post(`${AC_BASE_URL}/contact/sync`, {
      contact: {
        email,
        status: 2 // Desinscrição
      }
    }, {
      headers: {
        "Api-Token": AC_API_KEY,
        "Content-Type": "application/json"
      }
    });

    logger.info(`[UNSUBSCRIBE] ✅ ${email} descadastrado com sucesso e marcado com TAGs`);
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
