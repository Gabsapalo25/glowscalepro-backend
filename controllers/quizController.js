// controllers/quizController.js
import { createOrUpdateContact, applyTagToContact } from '../services/activeCampaign.js';
import { quizzesConfig } from '../config/quizzesConfig.js';
import tagMappings from '../data/tagMappings.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger, format, transports } from 'winston';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/data.json');

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
        format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      )
    }),
    ...(process.env.NODE_ENV === 'production'
      ? []
      : [
          new transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error'
          }),
          new transports.File({
            filename: path.join(__dirname, '../logs/combined.log')
          })
        ])
  ]
});

export const handleQuizResult = async (req, res) => {
  try {
    const { name, email, quizId, phone, score, total, affiliateLink } = req.body;

    logger.info('📩 Received quiz result', { name, email, quizId, score });

    const config = quizzesConfig[quizId];
    if (!config) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID' });
    }

    // 1️⃣ ActiveCampaign – Criação/atualização do contato
    let contact;
    try {
      contact = await createOrUpdateContact({ name, email, phone });
      logger.info('🧠 ActiveCampaign contact created/updated');
    } catch (error) {
      logger.error(`❌ ActiveCampaign contact error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'ActiveCampaign error' });
    }

    // 2️⃣ Aplicar tag com base no score
    const tag = tagMappings[quizId]?.find(t => score >= t.min && score <= t.max);
    if (tag) {
      try {
        await applyTagToContact(contact.id, tag.tagId);
        logger.info(`🏷️ Tag "${tag.name}" applied to contact: ${email}`);
      } catch (error) {
        logger.warn(`⚠️ Failed to apply tag: ${error.message}`);
      }
    }

    // 3️⃣ Enviar e-mails: participante e admin
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true'
        }
      });

      // Enviar para participante
      await transporter.sendMail({
        from: `"GlowscalePro" <${process.env.SMTP_USER}>`,
        to: email,
        subject: config.subject,
        html: config.generateEmailHtml({ name, score, total, affiliateLink })
      });
      logger.info('📧 Result email sent to contact', { to: email });

      // Enviar para admin
      await transporter.sendMail({
        from: `"GlowscalePro" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `📥 New Quiz Submission (${quizId})`,
        html: `
          <h3>New Quiz Submission Received</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || '-'}</p>
          <p><strong>Score:</strong> ${score}/${total}</p>
          <p><strong>Quiz:</strong> ${quizId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        `
      });
      logger.info('📧 Notification email sent to admin', { to: process.env.ADMIN_EMAIL });

    } catch (error) {
      logger.error(`❌ Email sending error: ${error.message}`);
    }

    // 4️⃣ Salvar localmente
    const lead = {
      name,
      email,
      phone,
      score,
      total,
      quizId,
      date: new Date().toISOString()
    };

    try {
      const existingData = fs.existsSync(dataPath)
        ? JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
        : [];
      existingData.push(lead);
      fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
      logger.info('💾 Lead saved locally');
    } catch (error) {
      logger.warn(`⚠️ Failed to save lead locally: ${error.message}`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    logger.error(`❌ Error handling quiz result: ${err.message}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
