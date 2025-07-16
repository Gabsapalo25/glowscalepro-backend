import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import csrf from "csurf";
import dotenv from "dotenv";
import morgan from "morgan";
import { handleResubscribe } from "./controllers/resubscribeController.js";
import { handleUnsubscribe } from "./controllers/unsubscribeController.js";
import quizRoutes from "./routes/quizRoutes.js";
import logRoute from "./routes/logRoute.js";
import logger from "./utils/logger.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// 🔓 CORS Configuration
const corsConfig = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  exposedHeaders: ["set-cookie"]
};

// 🛡️ CSRF Configuration
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    key: "glowscalepro_csrf"
  }
});

// ✅ Middlewares em ordem correta
app.use(cookieParser());
app.use(cors(corsConfig));
app.use(express.json());
app.use(csrfProtection);
app.use(morgan("dev"));

// 🔥 Log por request
app.use((req, res, next) => {
  logger.info(`🔥 ${req.method} ${req.originalUrl}`);
  logger.debug("🔍 Origin:", req.get("Origin"));
  logger.debug("🔐 x-csrf-token:", req.get("x-csrf-token"));
  logger.debug("🍪 Cookies:", req.cookies);
  next();
});

// ✅ Endpoint para obter o CSRF Token
app.get("/api/csrf-token", (req, res) => {
  const token = req.csrfToken();
  logger.debug("🔐 Token CSRF gerado:", token);
  res.json({ csrfToken: token });
});

// ✅ Endpoint para descadastro (unsubscribe)
app.post("/api/unsubscribe", handleUnsubscribe);

// ✅ Endpoint para reativação de subscrição
app.post("/api/resubscribe", (req, res, next) => {
  logger.debug("🧪 Requisição de resubscribe:", req.body);
  next();
}, handleResubscribe);

// ✅ Rotas principais (quiz, exportação de leads, etc.)
app.use("/api", quizRoutes);

// ✅ Rota para logs frontend
app.use("/api/log", logRoute);

// ✅ Inicialização do servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor iniciado na porta ${PORT}`, {
    app: "GlowscalePro",
    version: "1.0.0",
    env: process.env.NODE_ENV
  });
});
