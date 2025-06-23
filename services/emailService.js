// services/emailService.js
import nodemailer from 'nodemailer';
import pino from 'pino'; // Mantenha esta importação para o 'env' logger se for necessário para depuração da validação
import { cleanEnv, str, port, bool } from 'envalid';
import logger from '../utils/logger.js'; // Importa o logger centralizado

// Validação das variáveis de ambiente usando envalid
const env = cleanEnv(process.env, {
  SMTP_HOST: str(),
  SMTP_PORT: port(),
  SMTP_SECURE: bool(),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  // SMTP_TLS_REJECT_UNAUTHORIZED: bool({ default: false }) // Descomente e use se precisar desta validação
});

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      },
      // Descomente e ajuste conforme necessário se usar SMTP_TLS_REJECT_UNAUTHORIZED
      // tls: {
      //   rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED
      // }
    });

    // Verificação inicial do transporter
    this.transporter.verify((error) => {
      if (error) {
        // Usa o logger centralizado
        logger.error(`❌ SMTP connection error: ${error.message}`);
      } else {
        // Usa o logger centralizado
        logger.info('✅ SMTP server connected successfully');
      }
    });
  }

  async sendEmail({ from, to, subject, html, text }) {
    try {
      const mailOptions = {
        from: from || `"GlowscalePro" <${env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Fallback para text/plain
        headers: {
          'List-Unsubscribe': '<https://glowscalepro.com/unsubscribe>', // Ajuste para o seu domínio real
          'X-Mailer': 'GlowscaleProMailer/1.0'
        }
      };

      await this.transporter.sendMail(mailOptions);
      // Usa o logger centralizado
      logger.info(`✅ Email sent successfully to: ${to}`);
    } catch (error) {
      // Usa o logger centralizado
      logger.error({ error: error.message, to }, `❌ Failed to send email to ${to}`);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}

export default EmailService;