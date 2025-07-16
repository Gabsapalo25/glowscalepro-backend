// controllers/quizController.js

import { createOrUpdateContact, applyMultipleTagsToContact } from '../services/activeCampaignService.js';
import emailService from '../services/emailService.js';
import tagMappings from '../data/tagMappings.js';
import logger from '../utils/logger.js';
import { exportContactsByTag } from '../services/exportService.js'; // ✅ CORRIGIDO

export async function handleQuizResult(req, res) {
  const { email, name, phone, quizId, awarenessLevel } = req.body;

  if (!email || !quizId || !awarenessLevel) {
    logger.warn('❌ Dados insuficientes para processar resultado do quiz', { body: req.body });
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    logger.info(`📥 Processando resultado do quiz para: ${email} [${quizId}]`);

    // Cria ou atualiza o contato
    const contact = await createOrUpdateContact({ email, name, phone });
    const contactId = contact.id;

    // Aplica tags de produto e de nível de consciência
    const tagProduto = tagMappings.quizIdToTagId[quizId];
    const tagAwareness = tagMappings.awarenessLevelToTagId[awarenessLevel];

    if (!tagProduto || !tagAwareness) {
      logger.warn(`⚠️ Tag não encontrada para quizId: ${quizId} ou awareness: ${awarenessLevel}`);
      return res.status(400).json({ success: false, error: 'Invalid quizId or awarenessLevel' });
    }

    await applyMultipleTagsToContact(email, [tagProduto, tagAwareness]);
    logger.info(`🏷️ Tags aplicadas com sucesso para ${email}: [${tagProduto}, ${tagAwareness}]`);

    // Envia email inicial
    await emailService.sendEmail({
      to: email,
      subject: "🎁 Here's your personalized result!",
      html: `
        <p>Thank you for completing the quiz, ${name || ''}!</p>
        <p>Your answers indicate you're at the <strong>${awarenessLevel.toUpperCase()}</strong> stage.</p>
        <p>Click below to discover your personalized solution:</p>
        <p><a href="https://glowscalepro.com/quiz-results/${quizId}">View My Recommendation</a></p>
      `
    });

    return res.status(200).json({ success: true, message: "Quiz result processed successfully." });

  } catch (error) {
    logger.error('❌ Erro ao processar quiz result', {
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });

    return res.status(500).json({
      success: false,
      error: "Internal server error while processing quiz result"
    });
  }
}

export async function handleExportLeads(req, res) {
  const tagId = parseInt(req.params.tagId);

  if (!tagId || isNaN(tagId)) {
    return res.status(400).json({ success: false, error: 'Invalid tag ID' });
  }

  try {
    const csvData = await exportContactsByTag(tagId); // ✅ Nome correto
    res.setHeader('Content-Disposition', `attachment; filename=leads_tag_${tagId}.csv`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvData);
  } catch (err) {
    logger.error('❌ Erro ao exportar leads:', err.message);
    res.status(500).json({ success: false, error: 'Failed to export leads' });
  }
}
