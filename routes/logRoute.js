// routes/logRoute.js
import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { level = 'info', message = '', context = {} } = req.body;

  try {
    if (typeof logger[level] !== 'function') {
      return res.status(400).json({ success: false, error: 'Invalid log level' });
    }

    logger[level](`[FRONTEND] ${message}`, context);
    res.status(200).json({ success: true });
  } catch (err) {
    logger.error('[FRONTEND_LOG] ❌ Falha ao registrar log', { err, originalPayload: req.body });
    res.status(500).json({ success: false });
  }
});

export default router;
