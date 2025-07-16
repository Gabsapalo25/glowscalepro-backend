import { applyTagToContact } from '../services/activeCampaignService.js';
import logger from '../utils/logger.js';

const TAG_UNSUBSCRIBE = 16; // ID da tag "descadastro-solicitado"

export async function handleUnsubscribe(req, res) {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    logger.warn('❌ E-mail inválido ou ausente no descadastro:', { email });
    return res.status(400).json({ message: 'Valid email is required.' });
  }

  try {
    logger.info(`📩 Solicitado descadastro para: ${email}`);

    // Aplica a tag de descadastro
    const result = await applyTagToContact(email, TAG_UNSUBSCRIBE);

    if (result.success) {
      logger.info(`✅ Tag de descadastro aplicada com sucesso para ${email}`);
      return res.status(200).json({ message: 'Successfully unsubscribed and tag applied.' });
    } else {
      logger.error(`❌ Falha ao aplicar tag de descadastro para ${email}`, result.error);
      return res.status(500).json({ message: 'Failed to apply unsubscribe tag.', error: result.error });
    }

  } catch (error) {
    logger.error('❌ Erro interno ao processar descadastro:', {
      message: error.message,
      stack: error.stack,
      email
    });
    return res.status(500).json({ message: 'Server error during unsubscribe.' });
  }
}
