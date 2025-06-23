// services/emailService.js
import nodemailer from 'nodemailer';
import pino from 'pino';
import { cleanEnv, str, port, bool } from 'envalid';

// Validação das variáveis de ambiente
const env = cleanEnv(process.env, {
  SMTP_HOST: str(), // VOLTOU A SER SMTP_HOST
  SMTP_PORT: port(), // VOLTOU A SER SMTP_PORT
  SMTP_SECURE: bool(), // VOLTOU A SER SMTP_SECURE
  SMTP_USER: str(), // VOLTOU A SER SMTP_USER
  SMTP_PASS: str(), // VOLTOU A SER SMTP_PASS
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
  // O construtor agora recebe a config de SMTP diretamente do quizController (process.env.EMAIL_...)
  // Mas o transporter ainda vai usar as variáveis globais 'env' (SMTP_...)
  constructor(smtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST, // Usando as variáveis limpas de 'env'
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      },
      // tls: {
      //   rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED // Adicione se estiver a usar e se for 'true' em produção
      // }
    });

    // Verificação inicial do transporter
    this.transporter.verify((error) => {
      if (error) {
        logger.error(`❌ SMTP connection error: ${error.message}`);
      } else {
        logger.info('✅ SMTP server connected successfully');
      }
    });
  }

  async sendEmail({ from, to, subject, html, text }) {
    try {
      const mailOptions = {
        from: from || `"GlowscalePro" <${env.SMTP_USER}>`, // Usando SMTP_USER do env
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        headers: {
          'List-Unsubscribe': '<https://glowscalepro.com/unsubscribe>',
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

export default EmailService;