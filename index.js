require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Nodemailer transporter configuration (Zoho SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Use only in development
  },
});

// Verify transporter
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Endpoint to receive quiz results
app.post('/send-result', async (req, res) => {
  try {
    const { name, email, score, quizTitle } = req.body;

    // Basic validation
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email' });
    }

    if (!score) {
      return res.status(400).json({ success: false, error: 'Score is required' });
    }

    if (!quizTitle) {
      return res.status(400).json({ success: false, error: 'Quiz title is required' });
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

    // Email to lead
    const mailToLead = {
      from: `"NervoVive Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Quiz Result - ${quizTitle}`,
      html: htmlContent,
    };

    // Email to admin
    const mailToAdmin = {
      from: `"NervoVive Quiz Notification" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New quiz result from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Quiz:</strong> ${quizTitle}</p>
        <p><strong>Score:</strong> ${score}</p>
      `,
    };

    // Send emails
    await transporter.sendMail(mailToLead);
    await transporter.sendMail(mailToAdmin);

    return res.json({ success: true, message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
