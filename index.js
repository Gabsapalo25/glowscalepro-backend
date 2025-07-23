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

// ✅ CORS Configuration
const corsConfig = {
  origin: process.env.FRONTEND_URL || "https://glowscalepro.com",
  credentials: true,
  exposedHeaders: ["set-cookie"],
};
app.use(cors(corsConfig));

// ✅ CSRF Protection Configuration
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    key: "glowscalepro_csrf",
  },
});
app.use(cookieParser());
app.use(csrfProtection);

// ✅ Middlewares
app.use(express.json());
app.use(morgan("dev"));

// ✅ Logging Middleware Organizado
app.use((req, res, next) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    origin: req.get("Origin"),
    csrfToken: req.get("x-csrf-token"),
    cookies: req.cookies,
  };
  logger.info(`🔥 ${req.method} ${req.originalUrl}`, logData);
  if (process.env.NODE_ENV === "development") {
    logger.debug("🔍 Detalhes da requisição:", logData);
  }
  next();
});

// ✅ Endpoint para obter o token CSRF
app.get("/api/csrf-token", (req, res) => {
  const token = req.csrfToken();
  logger.info("🔐 Token CSRF gerado", { token });
  res.json({ csrfToken: token });
});

// ✅ Descadastro
app.post("/api/unsubscribe", handleUnsubscribe);

// ✅ Reinscrição (removido next() desnecessário)
app.post("/api/resubscribe", (req, res) => {
  logger.info("🧪 Requisição de resubscribe", { email: req.body.email });
  handleResubscribe(req, res);
});

// ✅ Rotas principais (quiz, leads)
app.use("/api", quizRoutes);

// ✅ Rota para logs frontend
app.use("/api/log", logRoute);

// ✅ Inicialização do servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor iniciado na porta ${PORT}`, {
    app: "GlowscalePro",
    version: "1.0.0",
    env: process.env.NODE_ENV,
  });
});

export default app;