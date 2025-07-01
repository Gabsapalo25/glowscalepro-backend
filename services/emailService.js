// services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import validator from 'validator';
import logger from '../utils/logger.js';

dotenv.config();

// 🔒 Validação de variáveis de ambiente
const REQUIRED_VARS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'ADMIN_EMAIL'
];

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    logger.error(`❌ Variável de ambiente ausente: ${key}`);
    throw new Error(`Variável de ambiente faltando: ${key}`);
  }
}

// ✉️ Configuração do transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true = 465 / false = 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// 🔎 Valida e-mail
function validateEmail(email) {
  if (!validator.isEmail(email)) {
    logger.warn(`⚠️ E-mail inválido detectado: ${email}`);
    throw new Error(`Formato de e-mail inválido: ${email}`);
  }
}

class EmailService {
  /**
   * Envia e-mail para lead e cópia para admin
   * @param {Object} options
   * @param {string} options.to - Destinatário principal
   * @param {string} options.subject - Assunto do e-mail
   * @param {string} options.html - Conteúdo HTML
   * @param {boolean} [options.copyAdmin=true] - Envia cópia para admin
   */
  async sendEmail({ to, subject, html, copyAdmin = true }) {
    try {
      validateEmail(to);
      const from = process.env.ADMIN_EMAIL;

      const recipients = [to];
      if (copyAdmin && process.env.ADMIN_EMAIL && to !== process.env.ADMIN_EMAIL) {
        recipients.push(process.env.ADMIN_EMAIL);
      }

      const mailOptions = {
        from,
        to: recipients,
        subject,
        html
      };

      const info = await transporter.sendMail(mailOptions);

      for (const recipient of recipients) {
        logger.info(`✅ E-mail enviado para ${recipient}: ${info.messageId}`);
      }

      logger.debug(`📨 Detalhes da entrega:`, {
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
        envelope: info.envelope
      });

    } catch (error) {
      logger.error(`❌ Falha ao enviar e-mail para ${to}: ${error.message}`, {
        code: error.code,
        response: error.response,
        command: error.command
      });
      throw error;
    }
  }

  /**
   * Verifica conexão SMTP no início do servidor
   */
  async testConnection() {
    try {
      await transporter.verify();
      logger.info('✅ Conexão SMTP verificada com sucesso');
    } catch (error) {
      logger.error(`❌ Falha ao verificar conexão SMTP: ${error.message}`, {
        code: error.code,
        response: error.response,
        command: error.command
      });
      throw new Error(`Falha de conexão SMTP: ${error.message}`);
    }
  }
}

export default EmailService;
