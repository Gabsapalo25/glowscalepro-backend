import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// 🔐 Rota para log do frontend (ex: erros, eventos)
router.post('/', (req, res) => {
  const { level = 'info', message = '', context = {} } = req.body;

  try {
    // Validação mínima
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required and must be a string' });
    }

    const allowedLevels = ['debug', 'info', 'warn', 'error'];
    const logLevel = allowedLevels.includes(level) ? level : 'info';

    logger[logLevel](`[FRONTEND] ${message}`, context);
    res.status(200).json({ success: true });
  } catch (err) {
    logger.error('[FRONTEND_LOG] ❌ Falha ao registrar log', {
      error: err.message,
      stack: err.stack,
      originalPayload: req.body
    });
    res.status(500).json({ success: false });
  }
});

export default router;
