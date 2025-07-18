import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createLogger, format, transports } from 'winston';

import { createOrUpdateContact, applyTagToContact } from '../services/activeCampaign.js';
import { quizzesConfig } from '../config/quizzesConfig.js';
import tagMappings from '../data/tagMappings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/data.json');

// ✅ Logger Configuration
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
            maxsize: 5242880,
            maxFiles: 5,
          }),
          new transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880,
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

// ✅ Main Quiz Handler
export const handleQuizResult = async (req, res) => {
  try {
    const { name, email, quizId, phone, score, total, affiliateLink } = req.body;

    logger.info("📩 Received quiz result", { name, email, quizId, score });

    // ✅ Get quiz config
    const config = quizzesConfig.find(q => q.quizId === quizId);
    if (!config) {
      logger.warn("❌ Invalid quiz ID received", { quizId });
      return res.status(400).json({ success: false, message: "Invalid quiz ID" });
    }

    // ✅ 1. Create or update contact
    const contact = await createOrUpdateContact({ name, email, phone });
    logger.info("🧠 ActiveCampaign contact created/updated", contact);

    // ✅ 2. Apply score-based tag
    const tag = tagMappings[quizId]?.find(t => score >= t.min && score <= t.max);
    if (tag) {
      await applyTagToContact(contact.id, tag.tagId);
      logger.info(`🏷️ Tag "${tag.name}" applied`, { email, tagId: tag.tagId });
    }

    // ✅ 3. Send email with results
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
      from: `"${config.senderName}" <${config.senderEmail}>`,
      to: email,
      subject: config.subject,
      html: config.generateEmailHtml({ name, score, total, affiliateLink })
    };

    await transporter.sendMail(mailOptions);
    logger.info("📧 Result email sent", { to: email });

    // ✅ 4. Save locally (optional)
    const lead = { name, email, phone, score, total, quizId, date: new Date().toISOString() };
    const existing = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, "utf-8"))
      : [];
    existing.push(lead);
    fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2));
    logger.info("💾 Lead saved locally", lead);

    // ✅ 5. Respond to frontend
    res.status(200).json({ success: true });

  } catch (err) {
    logger.error(`❌ Error handling quiz result: ${err.message}`, { stack: err.stack });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
