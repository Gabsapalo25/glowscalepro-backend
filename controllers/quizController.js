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

// Logger configuration
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json(),
    format.errors({ stack: true })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...metadata }) => {
          const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
          return `[${timestamp}] ${level}: ${message} ${meta}`;
        })
      ),
    }),
    ...(process.env.NODE_ENV === 'production'
      ? []
      : [
          new transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
          }),
          new transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
          }),
        ]),
  ],
  exceptionHandlers: [
    new transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? []
      : [new transports.File({ filename: path.join(__dirname, '../logs/exceptions.log') })]),
  ],
  rejectionHandlers: [
    new transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? []
      : [new transports.File({ filename: path.join(__dirname, '../logs/rejections.log') })]),
  ],
});

export const handleQuizResult = async (req, res) => {
  try {
    const { name, email, quizId, phone, score, total, affiliateLink } = req.body;

    logger.info("📩 Received quiz result", { name, email, quizId, score });

    // Obter configuração específica do quiz
    const config = quizzesConfig[quizId];
    if (!config) {
      logger.warn("❗ Invalid quizId received", { quizId });
      return res.status(400).json({ success: false, message: "Invalid quiz ID" });
    }

    // 1️⃣ ActiveCampaign – Criar ou atualizar o contato
    const contact = await createOrUpdateContact({ name, email, phone });
    logger.info("🧠 ActiveCampaign contact created/updated", contact);

    // 2️⃣ Aplicar tag com base no score
    const tag = tagMappings[quizId]?.find(t => score >= t.min && score <= t.max);
    if (tag) {
      await applyTagToContact(contact.id, tag.tagId);
      logger.info(`🏷️ Tag "${tag.name}" applied to contact`, { email });
    }

    // 3️⃣ Enviar e-mail com o resultado do quiz
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"GlowscalePro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: config.subject,
      html: config.generateEmailHtml({ name, score, total, affiliateLink })
    };

    await transporter.sendMail(mailOptions);
    logger.info("📧 Result email sent to contact", { to: email });

    // 4️⃣ Salvar lead localmente (data.json)
    const lead = {
      name,
      email,
      phone,
      score,
      total,
      quizId,
      date: new Date().toISOString()
    };

    const existingData = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, "utf-8"))
      : [];

    existingData.push(lead);
    fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
    logger.info("💾 Lead saved locally", lead);

    // 5️⃣ Retornar sucesso
    res.status(200).json({ success: true });

  } catch (err) {
    logger.error("❌ Error handling quiz result", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
