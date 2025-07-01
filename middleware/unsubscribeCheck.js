// middleware/unsubscribeCheck.js

import { getContactByEmail } from "../services/activeCampaignService.js";
import tagMappings from "../data/tagMappings.js";
import logger from "../utils/logger.js";

const TAG_DESCADASTRO_CONFIRMADO = tagMappings.specialTags.unsubscribeConfirmed.id;

export default async function unsubscribeCheck(req, res, next) {
  const email = req.body?.email;

  if (!email) {
    return res.status(400).json({ success: false, error: "Missing email" });
  }

  try {
    const contact = await getContactByEmail(email);

    // ✅ Se o contato ainda não existe, deixar passar
    if (!contact || !contact.id) {
      logger.warn(`[UnsubscribeCheck] ⚠️ Contato ainda não existe, liberando: ${email}`);
      return next();
    }

    // ⛔ Se o contato tem a tag de descadastro confirmado, bloquear
    const hasUnsubscribed = contact.tags?.some(
      tag => parseInt(tag.tag) === TAG_DESCADASTRO_CONFIRMADO
    );

    if (hasUnsubscribed) {
      logger.warn(`[UnsubscribeCheck] ⛔ Contato descadastrado tentou se reinscrever: ${email}`);
      return res.status(403).json({
        success: false,
        error: "This email has unsubscribed and cannot be resubscribed automatically."
      });
    }

    // ✅ Autorizado
    return next();

  } catch (error) {
    logger.error(`[UnsubscribeCheck] ❌ Erro ao verificar descadastro: ${error.message}`, {
      email,
      stack: error.stack
    });

    return res.status(500).json({ success: false, error: "Internal error during unsubscribe check" });
  }
}
