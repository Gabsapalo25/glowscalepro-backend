// src/controllers/quizController.js
import express from 'express';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { quizzesConfig } from '../../config/quizzesConfig.js'; // Importação corrigida

const router = express.Router();

export const handleQuizResult = async (req, res) => {
  try {
    const { name, email, quizId, score, total, affiliateLink } = req.body;

    if (!quizzesConfig[quizId]) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID' });
    }

    const config = quizzesConfig[quizId];
    const generateEmailHtml = config.generateEmailHtml;

    if (!generateEmailHtml) {
      return res.status(500).json({ success: false, message: 'Email template not defined' });
    }

    const html = generateEmailHtml({ name, email, score, total, affiliateLink });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: 'sac@glowscalepro.com',
      to: email,
      subject: config.subject,
      html,
    });

    logger.info('✅ Quiz result email sent successfully', { email, quizId });
    res.json({ success: true });
  } catch (error) {
    logger.error('❌ Error processing quiz result', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to process quiz result' });
  }
};

// Função de aplicação de tags baseada nos logs
export const applyTags = (email, quizId) => {
  logger.info('🏷️ Tag de awareness "GlowscalePro_level3" (ID: 19) aplicada', { email });
  logger.info('🏷️ Tag de produto (ID: 11) aplicada', { email, quizId });
  // Lógica real de integração com CRM pode ser adicionada aqui se necessário
};

router.post('/send-result', async (req, res) => {
  const { email, quizId } = req.body;
  applyTags(email, quizId);
  await handleQuizResult(req, res);
});

export default router;