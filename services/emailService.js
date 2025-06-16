import nodemailer from 'nodemailer';
import pino from 'pino';
import { cleanEnv, str, port, bool } from 'envalid';

// Validação das variáveis de ambiente
const env = cleanEnv(process.env, {
  SMTP_HOST: str(),
  SMTP_PORT: port(),
  SMTP_SECURE: bool(),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  SMTP_TLS_REJECT_UNAUTHORIZED: bool()
});

// Configuração do logger
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Configuração do transporter
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED
  }
});

// Verificação inicial do transporter
transporter.verify((error) => {
  if (error) {
    logger.error(`❌ SMTP connection error: ${error.message}`);
  } else {
    logger.info('✅ SMTP server connected successfully');
  }
});

// Função para enviar e-mail
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"GlowscalePro" <${env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback para text/plain
      headers: {
        'List-Unsubscribe': '<https://glowscalepro.com/unsubscribe>',
        'X-Mailer': 'GlowscaleProMailer/1.0'
      }
    };

    await transporter.sendMail(mailOptions);
    logger.info(`✅ Email sent successfully to: ${to}`);
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};