// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Limita cada IP a 30 requisições por minuto
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again in a minute."
  }
});

export default rateLimiter;
