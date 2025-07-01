// index.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import csrf from "csurf";
import dotenv from "dotenv";
import morgan from "morgan";
import { handleResubscribe } from "./controllers/resubscribeController.js";
import { handleUnsubscribe } from "./controllers/unsubscribeController.js";
import quizRoutes from "./routes/quizRoutes.js"; // ✅ Importação das rotas do quiz
import logger from "./utils/logger.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// 🔓 CORS Middleware
const corsConfig = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  exposedHeaders: ["set-cookie"]
};

// 🛡️ CSRF Middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    key: "glowscalepro_csrf"
  }
});

// ✅ Ordem dos Middlewares
app.use(cookieParser());
app.use(cors(corsConfig));
app.use(express.json());
app.use(csrfProtection);
app.use(morgan("dev"));

// 🔥 Log global por request
app.use((req, res, next) => {
  logger.info(`🔥 Request recebida: ${req.method} ${req.originalUrl}`);
  logger.debug("🔍 Origin:", req.get("Origin"));
  logger.debug("🔐 Header Token:", req.get("x-csrf-token"));
  logger.debug("🍪 Cookies:", req.cookies);
  next();
});

// 🔐 Rota para obter CSRF Token
app.get("/api/csrf-token", (req, res) => {
  const token = req.csrfToken();
  logger.debug("🔐 Generated CSRF Token:", token);
  res.json({ csrfToken: token });
});

// ✅ Rota para descadastro (unsubscribe)
app.post("/api/unsubscribe", handleUnsubscribe);

// ✅ Rota para reativar subscrição
app.post("/api/resubscribe", (req, res, next) => {
  logger.debug("🧪 BODY recebido:", req.body);
  next();
}, handleResubscribe);

// ✅ Rotas dos quizzes e exportação de leads
app.use("/api", quizRoutes); // ⬅️ ESSENCIAL: conecta /api/send-result e /api/export-leads/:tagId

// ✅ Inicialização do servidor
app.listen(PORT, () => {
  logger.info("🚀 Server running on port " + PORT, {
    app: "GlowscalePro",
    version: "1.0.0",
    env: process.env.NODE_ENV
  });
});
