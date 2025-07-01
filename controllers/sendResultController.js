// controllers/sendResultController.js
import {
  createOrUpdateContact,
  applyMultipleTagsToContact
} from "../services/activeCampaignService.js";

import EmailService from "../services/emailService.js";
import { templates } from "../services/templates/templates.js";
import tagMappings from "../data/tagMappings.js";
import { affiliateLinks } from "../services/affiliateLinks.js";
import logger from "../utils/logger.js";

const emailService = new EmailService();

export async function handleSendResult(req, res) {
  try {
    const { name, email, score, total, quizId, cta_url } = req.body;

    logger.info(`📥 Novo lead recebido: ${email} - Quiz: ${quizId} - Score: ${score}/${total}`);

    if (!email || !quizId || typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid parameters"
      });
    }

    // 1️⃣ Criação ou atualização do contato
    const contact = await createOrUpdateContact({ email, name });

    // 2️⃣ Determina o nível de consciência com base no score ABSOLUTO
    let awarenessLevel = "cold"; // default
    for (const level in tagMappings.scoreToAwarenessLevel) {
      const range = tagMappings.scoreToAwarenessLevel[level];
      if (score >= range.min && score <= range.max) {
        awarenessLevel = level;
        break;
      }
    }

    const awarenessLevelTagId = tagMappings.awarenessLevelToTagId[awarenessLevel];
    const awarenessLevelName = tagMappings.awarenessLevelToTagName[awarenessLevel];

    // 3️⃣ Tag do produto com base no quizId
    const productTagId = tagMappings.quizIdToTagId[quizId];
    if (!productTagId) {
      logger.warn(`❌ quizId desconhecido: ${quizId} – tag de produto não será aplicada`);
    }

    // 4️⃣ Aplica as tags no ActiveCampaign
    const tagsToApply = [];
    if (productTagId) tagsToApply.push(productTagId);
    if (awarenessLevelTagId) tagsToApply.push(awarenessLevelTagId);

    await applyMultipleTagsToContact(email, tagsToApply);

    logger.info(`🏷️ Tags aplicadas ao lead ${email}: Produto=${productTagId}, Nível=${awarenessLevelName}`);

    // 5️⃣ Usa link de afiliado com fallback
    const redirectUrl = affiliateLinks[quizId] || cta_url || "https://glowscalepro.com";
    const templateFn = templates[quizId];

    if (!templateFn) {
      logger.warn(`⚠️ Template de e-mail não encontrado para quizId: ${quizId}`);
      return res.status(500).json({ error: "Email template not found" });
    }

    const html = templateFn({
      name,
      email,
      score,
      total,
      affiliateLink: redirectUrl
    });

    // 6️⃣ Envia o e-mail para o lead
    await emailService.sendEmail({
      to: email,
      subject: `Your ${quizId} Quiz Result from GlowscalePro`,
      html
    });

    // 7️⃣ Envia cópia administrativa
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await emailService.sendEmail({
        to: adminEmail,
        subject: `📥 Novo lead: ${email} - ${quizId}`,
        html: `
          <h3>Novo lead do quiz ${quizId}</h3>
          <p><strong>Nome:</strong> ${name || "Não informado"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Score:</strong> ${score}/${total}</p>
          <p><strong>Nível:</strong> ${awarenessLevelName}</p>
        `
      });
    }

    // 8️⃣ Retorna resposta final
    return res.status(200).json({
      success: true,
      message: "Lead processed and email sent successfully",
      appliedTags: {
        productTagId,
        awarenessLevelTagId,
        awarenessLevelName
      },
      redirect: redirectUrl
    });

  } catch (error) {
    logger.error(`❌ Erro ao processar lead: ${error.message}`, {
      stack: error.stack,
      payload: req.body
    });

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}
