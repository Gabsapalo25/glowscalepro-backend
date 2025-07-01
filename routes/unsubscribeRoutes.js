// routes/unsubscribeRoutes.js

import express from 'express';
import { applyTagToContact } from '../services/activeCampaignService.js';
import logger from '../utils/logger.js';

const router = express.Router();
const TAG_UNSUBSCRIBE = 16; // ID da tag "descadastro-solicitado"

// Rota POST /api/unsubscribe
router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    logger.warn(`❌ E-mail inválido recebido para descadastro: ${email}`);
    return res.status(400).json({ message: 'Valid email is required.' });
  }

  try {
    logger.info(`📩 Solicitação de descadastro recebida para: ${email}`);

    const result = await applyTagToContact(email, TAG_UNSUBSCRIBE);

    if (result?.success || result?.message === 'Tag já aplicada anteriormente.') {
      logger.info(`✅ Tag de descadastro aplicada com sucesso para ${email}`);
      return res.status(200).json({ message: 'Successfully unsubscribed.' });
    } else {
      logger.error(`❌ Falha ao aplicar tag de descadastro para ${email}`, result);
      return res.status(500).json({ message: 'Failed to apply unsubscribe tag.', error: result?.error });
    }

  } catch (error) {
    logger.error(`❌ Erro no endpoint /unsubscribe: ${error.message}`, { stack: error.stack });
    return res.status(500).json({ message: 'Server error during unsubscribe.' });
  }
});

export default router;
