// routes/quizRoutes.js
import express from "express";
import { handleQuizSubmission } from "../controllers/quizController.js";
import { handleExportLeads } from "../controllers/exportController.js";

const router = express.Router();

// 🎯 Envio de resultado do quiz
router.post("/send-result", handleQuizSubmission);

// 🔐 Exportação protegida de leads via tagId
router.get("/export-leads/:tagId", (req, res, next) => {
  const token = req.headers["x-admin-token"];

  if (!token || token !== process.env.ADMIN_EXPORT_TOKEN) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  next();
}, handleExportLeads);

export default router;
