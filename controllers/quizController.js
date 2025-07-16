// controllers/quizController.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createOrUpdateContact, applyTagToContact } from "../services/activeCampaign.js";

// Corrigindo __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do arquivo de dados
const dataPath = path.join(__dirname, "../data/data.json");

// Função principal para lidar com o resultado do quiz
export const handleQuizResult = async (req, res) => {
  try {
    const { name, email, tagId } = req.body;

    // Verifica se todos os campos estão presentes
    if (!name || !email || !tagId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Adiciona ou atualiza o contato no ActiveCampaign
    await createOrUpdateContact({ email, name });

    // Aplica a tag ao contato
    await applyTagToContact(email, tagId);

    // Salva no data.json local
    const newLead = { name, email, tagId, date: new Date().toISOString() };

    let data = [];
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, "utf-8");
      data = JSON.parse(fileContent);
    }

    data.push(newLead);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");

    res.status(200).json({ message: "Lead processed successfully" });
  } catch (error) {
    console.error("Error processing quiz result:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};