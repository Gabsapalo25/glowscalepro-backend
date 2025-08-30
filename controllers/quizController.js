import { createOrUpdateContact, applyTagToContact } from '../services/activeCampaign.js';
import { quizzesConfig } from '../config/quizzesConfig.js';
import tagMappings from '../data/tagMappings.js';
import { templates } from '../services/templates/templates.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger, format, transports } from 'winston';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/data.json');

// Logger configuration
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    }),
    ...(process.env.NODE_ENV === 'production'
      ? []
      : [
          new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
          new transports.File({ filename: path.join(__dirname, '../logs/combined.log') })
        ])
  ]
});

export const handleQuizResult = async (req, res) => {
  try {
    // ✅ Validação dos dados de entrada
    const { name, email, quizId, phone, score, total, affiliateLink } = req.body;
    if (!name || !email || !quizId || score == null || total == null) {
      logger.warn('⚠️ Dados inválidos recebidos', { body: req.body });
      return res.status(400).json({ success: false, message: 'Dados obrigatórios ausentes' });
    }

    logger.info('📩 Recebendo resultado do quiz', { name, email, quizId, score, total });

    const config = quizzesConfig[quizId];
    if (!config) {
      logger.warn('⚠️ Quiz ID inválido', { quizId });
      return res.status(400).json({ success: false, message: 'Quiz ID inválido' });
    }

    // 1️⃣ Create or update contact in ActiveCampaign
    let contact;
    try {
      contact = await createOrUpdateContact({ name, email, phone });
      logger.info('🧠 Contato criado/atualizado no ActiveCampaign', { contactId: contact.id });
    } catch (error) {
      logger.error('❌ Erro no ActiveCampaign', { error: error.message });
      return res.status(500).json({ success: false, message: 'Erro no ActiveCampaign' });
    }

    // 2️⃣ Apply awareness tag based on score
    let appliedTag = null;
    for (const [level, range] of Object.entries(tagMappings.scoreToAwarenessLevel)) {
      if (score >= range.min && score <= range.max) {
        const tagId = tagMappings.awarenessLevelToTagId[level];
        const tagName = tagMappings.awarenessLevelToTagName[level];
        try {
          await applyTagToContact(contact.id, tagId);
          logger.info(`🏷️ Tag de awareness "${tagName}" (ID: ${tagId}) aplicada`, { email });
          appliedTag = { level, tagId, tagName };
        } catch (error) {
          logger.warn('⚠️ Falha ao aplicar tag de awareness', { error: error.message, email });
        }
        break;
      }
    }

    // 2️⃣b Apply product tag based on quizId
    try {
      const productTagId = tagMappings.quizIdToTagId[quizId];
      if (productTagId) {
        await applyTagToContact(contact.id, productTagId);
        logger.info(`🏷️ Tag de produto (ID: ${productTagId}) aplicada`, { email, quizId });
      } else {
        logger.warn('⚠️ Nenhuma tag de produto encontrada', { quizId });
      }
    } catch (error) {
      logger.warn('⚠️ Falha ao aplicar tag de produto', { error: error.message, email, quizId });
    }

    // 3️⃣ Send quiz result email to participant
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true' },
    });

    const participantMailOptions = {
      from: `"GlowscalePro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: config.subject,
      html: templates[quizId]?.({ name, email, score, total, affiliateLink }) || config.generateEmailHtml({ name, score, total, affiliateLink }),
    };

    try {
      await transporter.sendMail(participantMailOptions);
      logger.info('📧 E-mail de resultado enviado ao participante', { email });
    } catch (error) {
      logger.error('❌ Erro ao enviar e-mail ao participante', { error: error.message, email });
      // Não falha a requisição, apenas loga o erro
    }

    // 4️⃣ Send admin notification email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@glowscalepro.com';
    const adminHtml = `
      <h2>Nova Submissão de Quiz</h2>
      <p><strong>Nome:</strong> ${name}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Telefone:</strong> ${phone || '-'}</p>
      <p><strong>Quiz:</strong> ${quizId}</p>
      <p><strong>Score:</strong> ${score}/${total}</p>
      <p><strong>Affiliate Link:</strong> <a href="${affiliateLink}">${affiliateLink}</a></p>
      <p><strong>Awareness Level:</strong> ${appliedTag?.level || 'N/A'}</p>
    `;

    try {
      await transporter.sendMail({
        from: `"GlowscalePro" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `Nova Submissão ${quizId} - ${name}`,
        html: adminHtml,
      });
      logger.info('📧 Notificação enviada ao administrador', { adminEmail });
    } catch (error) {
      logger.error('❌ Erro ao enviar e-mail ao administrador', { error: error.message, adminEmail });
    }

    // 5️⃣ Save lead locally with limit
    const lead = {
      name,
      email,
      phone,
      score,
      total,
      quizId,
      awarenessLevel: appliedTag?.level || 'unknown',
      awarenessTagId: appliedTag?.tagId || null,
      productTagId: tagMappings.quizIdToTagId[quizId] || null,
      date: new Date().toISOString(),
    };

    try {
      let existingData = [];
      if (fs.existsSync(dataPath)) {
        existingData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        // Limita a 1000 registros para evitar crescimento excessivo
        if (existingData.length >= 1000) existingData = existingData.slice(-1000);
      }
      existingData.push(lead);
      fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
      logger.info('💾 Lead salvo localmente', { email });
    } catch (error) {
      logger.warn('⚠️ Falha ao salvar lead localmente', { error: error.message, email });
    }

    // ✅ Done
    res.status(200).json({ success: true });
  } catch (err) {
    logger.error('❌ Erro geral ao processar resultado do quiz', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};