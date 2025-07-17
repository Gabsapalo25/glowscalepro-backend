export const handleQuizResult = async (req, res) => {
  try {
    const { name, email, quizId, phone, score, total, affiliateLink } = req.body;

    logger.info("📩 Received quiz result", { name, email, quizId, score });

    const config = quizzesConfig[quizId];
    if (!config) {
      return res.status(400).json({ success: false, message: "Invalid quiz ID" });
    }

    // 1️⃣ ActiveCampaign – Criação/atualização do contato
    const contact = await createOrUpdateContact({ name, email, phone });
    logger.info("🧠 ActiveCampaign contact created/updated", contact);

    // 2️⃣ Aplicar tag com base no score
    const tag = tagMappings[quizId]?.find(t => score >= t.min && score <= t.max);
    if (tag) {
      await applyTagToContact(contact.id, tag.tagId);
      logger.info(`🏷️ Tag "${tag.name}" applied to contact`, { email });
    }

    // 3️⃣ Enviar e-mail com resultado
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"${config.senderName}" <${config.senderEmail}>`,
      to: email,
      subject: config.emailSubject,
      html: config.generateEmailHtml({ name, score, total, affiliateLink })
    };

    await transporter.sendMail(mailOptions);
    logger.info("📧 Result email sent to contact", { to: email });

    // 4️⃣ Salvar lead localmente (opcional)
    const lead = { name, email, phone, score, total, quizId, date: new Date().toISOString() };
    const existingData = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, "utf-8"))
      : [];
    existingData.push(lead);
    fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
    logger.info("💾 Lead saved locally", lead);

    // 5️⃣ Retorno de sucesso
    res.status(200).json({ success: true });
  } catch (err) {
    logger.error("❌ Error handling quiz result", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
