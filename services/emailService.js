// services/emailService.js
import nodemailer from 'nodemailer';
import pino from 'pino';
import { cleanEnv, str, port, bool } from 'envalid';

// Validação das variáveis de ambiente
const env = cleanEnv(process.env, {
  EMAIL_HOST: str(), // Mudado de SMTP_HOST para EMAIL_HOST para consistência com quizController.js
  EMAIL_PORT: port(), // Mudado de SMTP_PORT para EMAIL_PORT
  EMAIL_SECURE: bool(), // Mudado de SMTP_SECURE para EMAIL_SECURE
  EMAIL_USER: str(), // Mudado de SMTP_USER para EMAIL_USER
  EMAIL_PASS: str(), // Mudado de SMTP_PASS para EMAIL_PASS
  // SMTP_TLS_REJECT_UNAUTHORIZED: bool() // Removido, pois não é usado explicitamente na classe
});

// Configuração do logger (com a condição do pino-pretty que aprendemos)
const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    // Apenas adicione transport se NÃO for ambiente de produção
    ...(process.env.NODE_ENV !== 'production' && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
            },
        },
    }),
});

class EmailService {
  constructor(smtpConfig) {
    // Configuração do transporter usando as variáveis de ambiente ou config passada
    this.transporter = nodemailer.createTransport({
      host: smtpConfig.host || env.EMAIL_HOST,
      port: smtpConfig.port || env.EMAIL_PORT,
      secure: smtpConfig.secure || env.EMAIL_SECURE,
      auth: {
        user: smtpConfig.auth.user || env.EMAIL_USER,
        pass: smtpConfig.auth.pass || env.EMAIL_PASS
      },
      // tls: {
      //   rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED // Use se necessário e definido em env
      // }
    });

    // Verificação inicial do transporter
    this.transporter.verify((error) => {
      if (error) {
        logger.error(`❌ SMTP connection error: ${error.message}`);
        // Considerar lançar um erro ou lidar com isso de forma mais robusta no startup
      } else {
        logger.info('✅ SMTP server connected successfully');
      }
    });
  }

  async sendEmail({ from, to, subject, html, text }) {
    try {
      const mailOptions = {
        from: from || `"GlowscalePro" <${env.EMAIL_USER}>`, // Permite sobrescrever o remetente
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Fallback para text/plain
        headers: {
          'List-Unsubscribe': '<https://glowscalepro.com/unsubscribe>', // Exemplo, ajuste para o seu domínio
          'X-Mailer': 'GlowscaleProMailer/1.0'
        }
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Email sent successfully to: ${to}`);
    } catch (error) {
      logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}

export default EmailService; // Agora exporta a CLASSE EmailService