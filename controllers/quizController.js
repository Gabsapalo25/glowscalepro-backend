// controllers/quizController.js

import axios from "axios";
import { templates } from "../services/templates/templates.js";
import EmailService from "../services/emailService.js";
import {
  applyMultipleTagsToContact,
  createOrUpdateContact
} from "../services/activeCampaignService.js";
import tagMappings from "../data/tagMappings.js";
import logger from "../utils/logger.js";
import validator from "validator";

const emailService = new EmailService();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sac@glowscalepro.com";
const MASTER_LIST_ID = parseInt(process.env.MASTER_LIST_ID) || 5;

function getAwarenessLevelFromScore(score) {
  const { cold, warm, hot } = tagMappings.scoreToAwarenessLevel;
  if (score >= cold.min && score <= cold.max) return "cold";
  if (score >= warm.min && score <= warm.max) return "warm";
  if (score >= hot.min && score <= hot.max) return "hot";
  return "cold";
}

export async function handleQuizSubmission(req, res) {
  logger.info("📥 Requisição recebida no /send-result", { body: req.body });

  let email;

  try {
    const { name, score, total, quizId, affiliateLink } = req.body;
    email = req.body.email;

    // ✅ Validação de campos obrigatórios
    if (!name || !email || !score || !total || !quizId || !affiliateLink) {
      logger.warn("⚠️ Campos obrigatórios ausentes", { body: req.body });
      return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes" });
    }

    // ✅ Validação de e-mail
    if (!validator.isEmail(email)) {
      logger.warn(`⚠️ E-mail inválido detectado: ${email}`);
      return res.status(400).json({ success: false, message: "Formato de e-mail inválido" });
    }

    // ✅ Score e total devem ser números válidos
    const parsedScore = parseInt(score);
    const parsedTotal = parseInt(total);

    if (isNaN(parsedScore) || isNaN(parsedTotal)) {
      logger.warn("⚠️ Score ou total inválido (não numérico)", { score, total });
      return res.status(400).json({ success: false, message: "Score ou total inválido" });
    }

    // 📄 Template por quizId
    const templateKey = tagMappings.quizIdToTemplateKey[quizId];
    const templateFn = templates[templateKey];

    if (!templateFn) {
      logger.warn(`⚠️ Template não encontrado para quizId: ${quizId}`);
      return res.status(400).json({ success: false, message: "Quiz ID inválido" });
    }

    // 📧 E-mail para lead
    const emailHtml = templateFn({ name, email, score: parsedScore, total: parsedTotal, affiliateLink });
    try {
      await emailService.sendEmail({ to: email, subject: "Your Quiz Result is Here 🎯", html: emailHtml });
      logger.info(`📧 E-mail enviado com sucesso para: ${email}`);
    } catch (emailError) {
      logger.error(`❌ Falha ao enviar e-mail para lead: ${email}`, { error: emailError.message });
    }

    // 📨 E-mail para admin
    const adminEmailHtml = `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Score:</strong> ${parsedScore}/${parsedTotal}</p>
      <p><strong>Quiz ID:</strong> ${quizId}</p>
      <p><strong>Affiliate Link:</strong> <a href="${affiliateLink}">${affiliateLink}</a></p>
    `;
    try {
      await emailService.sendEmail({ to: ADMIN_EMAIL, subject: `[NEW LEAD] ${name} - ${quizId}`, html: adminEmailHtml });
      logger.info(`📨 E-mail enviado para admin: ${ADMIN_EMAIL}`);
    } catch (adminEmailError) {
      logger.error(`❌ Falha ao enviar e-mail para admin`, { error: adminEmailError.message });
    }

    // 🔍 Nível de consciência por score absoluto
    const awarenessLevel = getAwarenessLevelFromScore(parsedScore);
    logger.debug(`🔍 Nível de consciência para score ${parsedScore}: ${awarenessLevel}`);

    // 👤 Cria ou atualiza o contato
    const contact = await createOrUpdateContact({ email, name });

    if (!contact) {
      logger.warn(`⚠️ Contato não encontrado após criação: ${email}`);
      return res.status(200).json({
        success: true,
        message: "Quiz enviado, mas TAGs/lista não aplicadas"
      });
    }

    // 🏷️ Aplica TAGs do quiz + awareness level
    const tagsToApply = [];

    const productTagId = tagMappings.quizIdToTagId[quizId];
    if (productTagId) tagsToApply.push(productTagId);

    const levelTagId = tagMappings.awarenessLevelToTagId[awarenessLevel];
    if (levelTagId) tagsToApply.push(levelTagId);

    try {
      await applyMultipleTagsToContact(email, tagsToApply);
      logger.info(`✅ TAGs aplicadas ao contato: ${email}`, {
        tags: tagsToApply,
        awarenessLevel
      });
    } catch (tagError) {
      logger.error(`❌ Erro ao aplicar TAGs para: ${email}`, { error: tagError.message });
    }

    // ✅ Log final de sucesso
    logger.info(`✅ Submissão concluída para: ${email}`, {
      awarenessLevel,
      quizId,
      tagsApplied: tagsToApply
    });

    // ✅ Resposta final
    res.status(200).json({
      success: true,
      message: "Quiz submetido com sucesso",
      awarenessLevel,
      tagIds: tagsToApply,
      listId: MASTER_LIST_ID
    });

  } catch (err) {
    const errorEmail = req.body?.email || "email-não-definido";
    logger.error(`❌ Erro no handleQuizSubmission: ${err.message}`, {
      stack: err.stack,
      email: errorEmail,
      body: req.body
    });

    if (err.message.includes("TAGs") || err.message.includes("contato")) {
      return res.status(200).json({
        success: true,
        message: "Quiz enviado, mas TAGs/listas não foram aplicadas",
        email: errorEmail
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro interno no servidor",
      email: errorEmail
    });
  }
}
