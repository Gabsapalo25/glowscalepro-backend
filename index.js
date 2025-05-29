require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Define transporter
const isDev = process.env.NODE_ENV !== 'production';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: isDev ? { rejectUnauthorized: false } : undefined
});

// Verifica conexão com SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Rota para envio do resultado
app.post('/send-result', async (req, res) => {
  const { name, email, score, quizTitle } = req.body;

  if (!name || !email || typeof score === 'undefined' || !quizTitle) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const mailOptions = {
    from: `"GlowscalePro" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your Results for the ${quizTitle} Quiz`,
    html: `
      <h2>Hi ${name},</h2>
      <p>Thank you for taking the <strong>${quizTitle}</strong> quiz!</p>
      <p>Your score: <strong>${score}</strong></p>
      <p>We’ll be in touch with more insights soon.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
    res.status(200).json({ message: 'Result sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send result.' });
  }
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
