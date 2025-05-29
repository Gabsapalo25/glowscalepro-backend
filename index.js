// index.js

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Health Check
app.get('/', (req, res) => {
  res.json({ message: 'GlowscalePro Backend is running 🚀' });
});

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verifica conexão SMTP ao iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP connected successfully');
  }
});

// Endpoint para envio de resultado do quiz
app.post('/send-result', async (req, res) => {
  try {
    const {
      quizName,
      userName,
      userEmail,
      score,
      resultDescription,
      adminEmail,
    } = req.body;

    if (!userEmail || !quizName || !score || !resultDescription || !adminEmail) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const subject = `[${quizName}] Result for ${userName || 'Participant'}`;
    const htmlContent = `
      <h2>${quizName} Result</h2>
      <p><strong>Name:</strong> ${userName || 'N/A'}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Score:</strong> ${score}</p>
      <p><strong>Result:</strong> ${resultDescription}</p>
    `;

    // Email para o participante
    await transporter.sendMail({
      from: `"GlowscalePro Quizzes" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Your Result: ${quizName}`,
      html: htmlContent,
    });

    // Email para o administrador
    await transporter.sendMail({
      from: `"GlowscalePro Notifications" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: subject,
      html: htmlContent,
    });

    res.status(200).json({ message: 'Emails sent successfully!' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email.', error: error.message });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
