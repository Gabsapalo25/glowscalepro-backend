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

    // 1️⃣ Create or update contact in ActiveCampaign
    let contact;
    try {
      contact = await createOrUpdateContact({ name, email, phone });
      logger.info('🧠 ActiveCampaign contact created/updated');
    } catch (error) {
      logger.error(`❌ ActiveCampaign contact error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'ActiveCampaign error' });
    }

    // 2️⃣ Determine awareness level and tag
    let appliedTag = null;
    for (const [level, range] of Object.entries(tagMappings.scoreToAwarenessLevel)) {
      if (score >= range.min && score <= range.max) {
        const tagId = tagMappings.awarenessLevelToTagId[level];
        const tagName = tagMappings.awarenessLevelToTagName[level];
        try {
          await applyTagToContact(contact.id, tagId);
          logger.info(`🏷️ Tag "${tagName}" (ID: ${tagId}) applied to contact: ${email}`);
          appliedTag = { level, tagId, tagName };
        } catch (error) {
          logger.warn(`⚠️ Failed to apply tag: ${error.message}`);
        }
        break;
      }
    }

    // 3️⃣ Send quiz result email to participant
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

    const participantMailOptions = {
      from: `"GlowscalePro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: config.subject,
      html: config.generateEmailHtml({ name, score, total, affiliateLink })
    };

    try {
      await transporter.sendMail(participantMailOptions);
      logger.info(`📧 Result email sent to participant: ${email}`);
    } catch (error) {
      logger.error(`❌ Error sending participant email: ${error.message}`);
    }

    // 4️⃣ Send admin notification email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@glowscalepro.com';
    const adminHtml = `
      <h2>New Quiz Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || '-'}</p>
      <p><strong>Quiz:</strong> ${quizId}</p>
      <p><strong>Score:</strong> ${score}/${total}</p>
      <p><strong>Affiliate Link:</strong> <a href="${affiliateLink}">${affiliateLink}</a></p>
      <p><strong>Awareness Level:</strong> ${appliedTag?.level || 'N/A'}</p>
    `;

    try {
      await transporter.sendMail({
        from: `"GlowscalePro" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `New ${quizId} Quiz Submission - ${name}`,
        html: adminHtml
      });
      logger.info(`📧 Notification email sent to admin: ${adminEmail}`);
    } catch (error) {
      logger.error(`❌ Error sending admin email: ${error.message}`);
    }

    // 5️⃣ Save lead locally
    const lead = {
      name,
      email,
      phone,
      score,
      total,
      quizId,
      awarenessLevel: appliedTag?.level || 'unknown',
      tagId: appliedTag?.tagId || null,
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

    // ✅ Done
    res.status(200).json({ success: true });
  } catch (err) {
    logger.error(`❌ Error handling quiz result: ${err.message}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
