// routes/quizRoutes.js
import express from "express";
import { handleQuizResult } from "../controllers/quizController.js"; // <- aqui está o fix
import { handleExportLeads } from "../controllers/exportController.js";

const router = express.Router();

router.post("/send-result", handleQuizResult);

router.get("/export-leads/:tagId", (req, res, next) => {
  const token = req.headers["x-admin-token"];
  if (token !== process.env.ADMIN_EXPORT_TOKEN) {
    return res.status(403).json({ error: "Unauthorized access" });
  }
  next();
}, handleExportLeads);

export default router;
