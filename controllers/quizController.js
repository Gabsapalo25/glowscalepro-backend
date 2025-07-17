import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createOrUpdateContact, applyTagToContact } from "../services/activeCampaign.js";
import { createLogger, format, transports } from "winston";

// Corrigindo __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do logger para produção e desenvolvimento
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json(),
    format.errors({ stack: true }) // Inclui stack trace em erros
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...metadata }) => {
          const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : "";
          return `[${timestamp}] ${level}: ${message} ${meta}`;
        })
      ),
    }),
    ...(process.env.NODE_ENV === "production"
      ? [] // Evita escrita em arquivos no Render
      : [
          new transports.File({
            filename: path.join(__dirname, "../logs/error.log"),
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new transports.File({
            filename: path.join(__dirname, "../logs/combined.log"),
            maxsize: 5242880,
            maxFiles: 5,
          }),
        ]),
  ],
  exceptionHandlers: [
    new transports.Console(),
    ...(process.env.NODE_ENV === "production"
      ? []
      : [new transports.File({ filename: path.join(__dirname, "../logs/exceptions.log") })]),
  ],
  rejectionHandlers: [
    new transports.Console(),
    ...(process.env.NODE_ENV === "production"
      ? []
      : [new transports.File({ filename: path.join(__dirname, "../logs/rejections.log") })]),
  ],
});

// Caminho do arquivo de dados
const dataPath = path.join(__dirname, "../data/data.json");

// Função principal para lidar com o resultado do quiz
export const handleQuizResult = async (req, res) => {
  try {
    const { name, email, tagId } = req.body;

    // Validação
    if (!name || !email || !tagId) {
      logger.error("Campos obrigatórios ausentes", { name, email, tagId });
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.([^\s@]{2,})$/;
    if (!emailRegex.test(email)) {
      logger.error("Formato de email inválido", { email });
      return res.status(400).json({ error: "Formato de email inválido" });
    }

    logger.info("Processando resultado do quiz", { name, email, tagId });

    // Adiciona ou atualiza o contato no ActiveCampaign
    logger.debug("Criando/atualizando contato no ActiveCampaign", { email, name });
    const contact = await createOrUpdateContact({ email, name });

    // Aplica a tag ao contato
    logger.debug("Aplicando tag ao contato", { email, tagId });
    await applyTagToContact(email, tagId);

    // Salva no data.json local
    const newLead = { name, email, tagId, date: new Date().toISOString() };
    let data = [];
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, "utf-8");
      data = JSON.parse(fileContent);
    }

    data.push(newLead);
    try {
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
      logger.info("Lead salvo em data.json", { newLead });
    } catch (fileError) {
      logger.warn("Falha ao salvar em data.json", { error: fileError.message });
    }

    res.status(200).json({ message: "Lead processado com sucesso" });
  } catch (error) {
    logger.error("Erro ao processar resultado do quiz", { error: error.message, stack: error.stack });
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};