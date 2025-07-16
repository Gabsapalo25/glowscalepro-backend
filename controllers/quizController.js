// controllers/quizController.js
import nodemailer from "nodemailer";
import quizzesConfig from "../config/quizzesConfig.js";
import fs from "fs";
import path from "path";
import {
  addContactToActiveCampaign,
  addTagToContact,
} from "../services/activeCampaignServices.js";

const dataPath = path.resolve("./config/data.json");

export const handleQuizResult = async (req, res) => {
  const { email, name, quizId, result, tagId } = req.body;

  try {
    const quiz = quizzesConfig[quizId];

    if (!quiz) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    // Adiciona o lead à ActiveCampaign
    const contact = await addContactToActiveCampaign({ email, name });

    // Adiciona a tag (se fornecida)
    if (tagId && contact && contact.id) {
      await addTagToContact(contact.id, tagId);
    }

    // Envia o e-mail com base no resultado do quiz
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"GlowScalePRO" <${process.env.SMTP_USER}>`,
      to: email,
      subject: quiz.emailSubject,
      html: quiz.emailTemplates[result] || quiz.defaultTemplate,
    };

    await transporter.sendMail(mailOptions);

    // Salva o lead no arquivo local (apenas como backup)
    const existingData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    existingData.push({ name, email, quizId, result, date: new Date().toISOString() });
    fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao processar resultado do quiz:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
