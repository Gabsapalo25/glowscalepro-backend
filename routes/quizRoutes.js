import express from "express";
import { handleQuizResult } from "../controllers/quizController.js";
import { handleExportLeads } from "../controllers/exportController.js";
import logger from "../utils/logger.js";

const router = express.Router();

// ✅ Rota para enviar resultado do quiz
router.post("/send-result", (req, res, next) => {
  logger.info("📤 Recebendo resultado do quiz", { data: req.body });
  next();
}, handleQuizResult);

// ✅ Rota para exportar leads com autenticação
router.get("/export-leads/:tagId", (req, res, next) => {
  logger.info("📥 Solicitação de exportação de leads", { tagId: req.params.tagId });
  const token = req.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_EXPORT_TOKEN) {
    logger.warn("🚫 Acesso não autorizado à exportação", { token });
    return res.status(403).json({ error: "Unauthorized access" });
  }
  next();
}, handleExportLeads);

export default router;