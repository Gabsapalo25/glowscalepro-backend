import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true'
    }
});

const mailOptions = {
    from: `"GlowScalePro Test" <${process.env.SMTP_USER}>`,
    to: "gabsapalo@gmail.com",
    bcc: process.env.ADMIN_EMAIL,
    subject: "🔍 Teste de Envio SMTP via Node.js",
    html: "<p>Este é um <strong>teste de envio SMTP</strong> feito manualmente.</p>"
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('❌ Erro ao enviar:', error);
    } else {
        console.log('✅ E-mail enviado com sucesso:', info.response);
    }
});
