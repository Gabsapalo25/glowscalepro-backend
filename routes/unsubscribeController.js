import { applyTagToContact } from '../services/activeCampaignService.js';

const TAG_UNSUBSCRIBE = 16; // ID da tag "descadastro-solicitado"

export async function handleUnsubscribe(req, res) {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: 'Valid email is required.' });
    }

    // Aplica a tag de descadastro (ID: 16) no ActiveCampaign
    const result = await applyTagToContact(email, TAG_UNSUBSCRIBE);

    if (result.success) {
      return res.status(200).json({ message: 'Successfully unsubscribed and tag applied.' });
    } else {
      return res.status(500).json({ message: 'Failed to apply unsubscribe tag.', error: result.error });
    }

  } catch (error) {
    console.error('Error in unsubscribe handler:', error);
    return res.status(500).json({ message: 'Server error during unsubscribe.' });
  }
}
