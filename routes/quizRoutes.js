// routes/quizRoutes.js
import express from "express";
import { handleQuizSubmission } from "../controllers/quizController.js";
import { handleExportLeads } from "../controllers/exportController.js";

const router = express.Router();

// Rota para envio de resultado do quiz
router.post("/send-result", handleQuizSubmission);

// Rota protegida para exportar leads por tagId (ex: /export-leads/10)
router.get("/export-leads/:tagId", (req, res, next) => {
  const token = req.headers["x-admin-token"];
  if (token !== process.env.ADMIN_EXPORT_TOKEN) {
    return res.status(403).json({ error: "Unauthorized access" });
  }
  next();
}, handleExportLeads);

export default router;
