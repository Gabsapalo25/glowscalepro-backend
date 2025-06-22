// src/routes/quizzesRoutes.js
import express from 'express';
import { quizzesConfig } from '../config/quizzesConfig.js';
import activeCampaignService from '../services/activeCampaignService.js';

const router = express.Router();

// Rota POST para submeter um quiz
router.post('/submit-quiz', async (req, res) => {
    const { email, quizId } = req.body;

    console.log('Dados recebidos:', req.body);

    if (!email || !quizId) {
        return res.status(400).json({ success: false, error: 'Email e quizId são obrigatórios' });
    }

    const quiz = quizzesConfig.find(q => q.quizId === quizId);
    if (!quiz) {
        return res.status(404).json({ success: false, error: 'Quiz não encontrado' });
    }

    try {
        const contactId = await activeCampaignService.createOrUpdateContact(email, quiz.activeCampaignFields.scoreFieldId);
        await activeCampaignService.addTagToContact(contactId, quiz.leadTag);
        res.status(200).json({ success: true, message: 'Quiz submetido com sucesso', contactId });
    } catch (error) {
        console.error('Erro ao processar o quiz:', error);
        res.status(500).json({ success: false, error: 'Falha ao submeter o quiz' });
    }
});

// Exportação padrão para compatibilidade com index.js
export default router;