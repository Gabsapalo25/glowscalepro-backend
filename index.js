require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do Nodemailer com Zoho
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Use apenas em ambiente de desenvolvimento
  },
});

// Verifica a conexão com o servidor SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error('Erro na configuração SMTP:', error);
  } else {
    console.log('Servidor SMTP pronto para envio');
  }
});

// Endpoint para envio dos resultados do quiz
app.post('/send-result', async (req, res) => {
  try {
    const { name, email, score, quizTitle } = req.body;

    // Validações básicas
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome inválido' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Email inválido' });
    }

    if (!score || !quizTitle) {
      return res.status(400).json({ success: false, error: 'Pontuação e título do quiz são obrigatórios' });
    }

    const affiliateLink = 'https://nervovive24.com/text.php#aff=gabynos';

    const htmlContent = `
      <h2>Hi ${name},</h2>
      <p>Thank you for completing the <strong>${quizTitle}</strong>.</p>
      <p>Your quiz score: <strong>${score}</strong></p>
      <p>Based on your score, we recommend taking the next step.</p>
      <p><a href="${affiliateLink}" style="background:#007bff;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Learn More About NervoVive</a></p>
      <br>
      <p>Best regards,<br>The NervoVive Team</p>
    `;

    const mailToLead = {
      from: `"NervoVive Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your Quiz Result - ${quizTitle}`,
      html: htmlContent,
    };

    const mailToAdmin = {
      from: `"NervoVive Quiz Notification" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `New quiz result from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Quiz:</strong> ${quizTitle}</p>
        <p><strong>Score:</strong> ${score}</p>
      `,
    };

    await transporter.sendMail(mailToLead);
    await transporter.sendMail(mailToAdmin);

    return res.json({ success: true, message: 'Emails enviados com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
