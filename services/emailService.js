import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import validator from 'validator';
import logger from '../utils/logger.js';

dotenv.config();

// 🧪 Validação de variáveis essenciais
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

// ✅ Validação adicional para ADMIN_EMAIL
if (!validator.isEmail(process.env.ADMIN_EMAIL)) {
  logger.error(`❌ E-mail do admin inválido: ${process.env.ADMIN_EMAIL}`);
  throw new Error("E-mail do admin inválido");
}

// ✉️ Configuração do transporte SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true: porta 465, false: porta 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  authMethod: process.env.SMTP_AUTH_METHOD || 'PLAIN', // Ex: 'XOAUTH2' para OAuth
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// 🔍 Validação básica de e-mail
function validateEmail(email) {
  if (!validator.isEmail(email)) {
    logger.warn(`⚠️ E-mail inválido: ${email}`);
    throw new Error(`Formato de e-mail inválido: ${email}`);
  }
}

// 📬 Serviço de envio de e-mails
class EmailService {
  async sendEmail({ to, subject, html, copyAdmin = true }) {
    try {
      validateEmail(to);

      const from = process.env.ADMIN_EMAIL;

      // Enviar para lead
      try {
        await transporter.sendMail({
          from,
          to,
          subject,
          html
        });
        logger.info(`✅ E-mail enviado para lead: ${to}`);
      } catch (leadError) {
        logger.error(`❌ Falha ao enviar e-mail para lead: ${to}`, {
          code: leadError.code,
          response: leadError.response,
          command: leadError.command
        });
        throw leadError;
      }

      // Enviar cópia para admin (se aplicável)
      if (copyAdmin && to !== from) {
        try {
          await transporter.sendMail({
            from,
            to: from,
            subject: `[CÓPIA] ${subject}`,
            html
          });
          logger.info(`✅ E-mail enviado para admin: ${from}`);
        } catch (adminError) {
          logger.error(`❌ Falha ao enviar e-mail para admin: ${from}`, {
            code: adminError.code,
            response: adminError.response,
            command: adminError.command
          });
        }
      }

    } catch (error) {
      logger.error(`❌ Erro crítico no envio de e-mail: ${error.message}`, {
        code: error.code,
        response: error.response,
        command: error.command
      });
      throw error;
    }
  }

  async testConnection() {
    try {
      await transporter.verify();
      logger.info("✅ Conexão SMTP verificada com sucesso");
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