import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import validator from 'validator';
import logger from '../utils/logger.js';
import { affiliateLinks } from './affiliateLinks.js';

dotenv.config();

// Verificação de variáveis de ambiente essenciais
const REQUIRED_VARS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'ADMIN_EMAIL'];
for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    logger.error(`❌ Variável de ambiente ausente: ${key}`);
    throw new Error(`Variável de ambiente faltando: ${key}`);
  }
}

if (!validator.isEmail(process.env.ADMIN_EMAIL)) {
  logger.error(`❌ E-mail do admin inválido: ${process.env.ADMIN_EMAIL}`);
  throw new Error("E-mail do admin inválido");
}

// Configuração SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  authMethod: process.env.SMTP_AUTH_METHOD || 'PLAIN',
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

function validateEmail(email) {
  if (!validator.isEmail(email)) {
    logger.warn(`⚠️ E-mail inválido: ${email}`);
    throw new Error(`Formato de e-mail inválido: ${email}`);
  }
}

// Serviço de envio de emails
class EmailService {
  async sendEmail({ to, subject, html, copyAdmin = true }) {
    validateEmail(to);
    const from = process.env.ADMIN_EMAIL;

    await transporter.sendMail({ from, to, subject, html });
    logger.info(`✅ E-mail enviado para lead: ${to}`);

    if (copyAdmin && to !== from) {
      await transporter.sendMail({
        from,
        to: from,
        subject: `[CÓPIA] ${subject}`,
        html
      });
      logger.info(`✅ E-mail enviado para admin: ${from}`);
    }
  }

  // Email 2: Lembrete após 48h
  async sendReminderEmail(to, product = 'primebiome') {
    const subjects = {
      tokmate: "📲 TikTok creators are using this tool to go viral",
      nervovive: "🧠 Still struggling with memory? Here's help.",
      primebiome: "⏰ Just Checking In – Did You See This?",
      prodentim: "🦷 Reminder: Your smile deserves better",
      glucoshield: "💥 Reminder: Control your sugar naturally",
      prostadine: "⚠️ Don’t ignore this prostate breakthrough",
      totalcontrol24: "🔥 Just Checking In – Your metabolism solution"
    };

    const subject = subjects[product] || "⏰ Just Checking In – Don’t Miss This";
    const url = affiliateLinks[product] || "#";

    const html = `
      <p>Hi there,</p>
      <p>We noticed you haven’t opened our last email yet. Just wanted to make sure you don’t miss out on something that could truly help you.</p>
      <p>👉 <a href="${url}" target="_blank">Click here to see what it's all about</a></p>
      <p>Warm regards,<br/>GlowScalePro Team</p>
    `;

    await this.sendEmail({ to, subject, html });
  }

  // Email 3: Último aviso após 72h
  async sendFinalReminderEmail(to, product = 'primebiome') {
    const subject = "⏳ Last Chance – Don’t Miss This Again";
    const url = affiliateLinks[product] || "#";

    const html = `
      <p>Hey!</p>
      <p>This is your last reminder – and we wouldn’t send it if it wasn’t important.</p>
      <p>Many people have already taken the first step toward improving their health... and we don’t want you to be left behind.</p>
      <p>👉 <a href="${url}" target="_blank">Click here to take that first step now</a></p>
      <p>We might not send this again.</p>
      <p>Warm regards,<br/>GlowScalePro Team</p>
    `;

    await this.sendEmail({ to, subject, html });
  }

  // ✅ Email 4: História emocional após 96h
  async sendStoryEmail(to, product = 'primebiome') {
    const stories = {
      tokmate: {
        subject: "🎥 How a broke creator hit 1M views in 7 days",
        story: "He had no followers. Just one idea. Today, he’s a TikTok sensation thanks to this simple tool..."
      },
      nervovive: {
        subject: "🧠 She forgot her son's name – Until this...",
        story: "It was scary. But after trying this solution, she regained her clarity – and her memories."
      },
      primebiome: {
        subject: "💩 From bloated & tired… to energized in 7 days",
        story: "He didn’t believe gut health could make such a difference — until he experienced it himself."
      },
      prodentim: {
        subject: "🦷 Dentist was shocked – “Your gums healed fast!”",
        story: "She always hated dentist visits… but now, her oral health speaks for itself."
      },
      glucoshield: {
        subject: "💥 His sugar dropped naturally after this habit",
        story: "He was tired of meds. What happened after 14 days shocked even his doctor."
      },
      prostadine: {
        subject: "😨 He peed 12 times a night… not anymore.",
        story: "Now he sleeps through the night — and feels 20 years younger. Here’s how."
      },
      totalcontrol24: {
        subject: "🔥 She wore that dress again after 2 years",
        story: "After trying everything, she gave this one last shot. Today, she loves the mirror again."
      }
    };

    const fallback = {
      subject: "✨ A story you can’t ignore",
      story: "Real people. Real changes. You could be next. Don’t miss your chance."
    };

    const { subject, story } = stories[product] || fallback;
    const url = affiliateLinks[product] || "#";

    const html = `
      <p>Hey there,</p>
      <p>Let me share something real quick...</p>
      <p><strong>${story}</strong></p>
      <p>It's a true story – and it’s been happening to more and more people just like you.</p>
      <p>They decided to stop waiting, clicked the link, and today they’re seeing incredible results.</p>
      <p>👉 <a href="${url}" target="_blank">Click here to see what it’s all about</a></p>
      <p>You might not get this chance again.</p>
      <p>Warm regards,<br/>GlowScalePro Team</p>
    `;

    await this.sendEmail({ to, subject, html });
  }

  // Teste da conexão SMTP
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

export default new EmailService();
