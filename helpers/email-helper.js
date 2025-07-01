import nodemailer from 'nodemailer';

/**
 * Cria dinamicamente o transporter, evitando erros com variáveis não carregadas.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true'
    }
  });
}

/**
 * Envia um e-mail genérico.
 */
export async function sendEmail({ to, subject, html }) {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"GlowscalePro" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    console.log(`📧 E-mail enviado para ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao enviar e-mail para ${to}:`, error);
    return false;
  }
}

/**
 * Envia o mesmo e-mail para o lead e uma cópia para o administrador.
 */
export async function sendToLeadAndAdmin({ leadEmail, name, subject, html }) {
  const adminEmail = process.env.ADMIN_EMAIL;

  const results = await Promise.all([
    sendEmail({ to: leadEmail, subject, html }),
    sendEmail({
      to: adminEmail,
      subject: `[ADMIN COPY] ${subject}`,
      html: `<p><strong>Lead:</strong> ${name} (${leadEmail})</p>${html}`
    })
  ]);

  return results.every((r) => r === true);
}
