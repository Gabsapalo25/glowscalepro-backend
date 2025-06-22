// routes/quizRoutes.js - VERSÃO FINAL E CORRIGIDA
import express from 'express';
import pino from 'pino';

// Importações com caminhos corrigidos para a sua estrutura original (na raiz do projeto)
import activeCampaignService from '../services/activeCampaignService.js'; 
import sendEmail from '../services/emailService.js'; // Importa a função default do seu emailService
import { quizzesConfig } from '../config/quizzesConfig.js'; 

const router = express.Router();

const logger = pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
});

// Rota de teste para verificar se as rotas de quiz estão funcionando
router.get('/quizzes-status', (req, res) => {
    res.status(200).send('Quizzes route is initialized and ready to process.');
});

// Rota principal para submissão de quiz
router.post('/submit-quiz', async (req, res) => {
    logger.info('Recebida solicitação POST para /api/submit-quiz');
    const { email, quizId, score, answers, whatsapp } = req.body;

    // Validação básica dos dados
    if (!email || !quizId || score === undefined || !answers) {
        logger.warn('Dados do quiz incompletos. Corpo da requisição: %o', req.body);
        return res.status(400).json({ error: 'Dados do quiz incompletos.' });
    }

    logger.info('Dados recebidos: Email=%s, QuizID=%s, Score=%d, WhatsApp=%s', email, quizId, score, whatsapp);

    try {
        // Encontra a configuração específica do quiz
        const quizConfig = quizzesConfig.find(q => q.quizId === quizId);

        if (!quizConfig) {
            logger.error('Configuração do quiz não encontrada para quizId: %s', quizId);
            return res.status(404).json({ error: 'Quiz não encontrado.' });
        }

        logger.info('Configuração do quiz encontrada para %s: %o', quizId, quizConfig);

        // Usa o AC_LIST_ID_MASTERTOOLS_ALL padrão das variáveis de ambiente
        // ou um listId específico definido no quizConfig, se existir.
        const listId = quizConfig.listId || req.app.locals.acListIdMastertoolsAll; 
        
        if (!listId) {
            logger.error('ID da lista ActiveCampaign não definido para o quiz %s.', quizId);
            return res.status(500).json({ error: 'Configuração de lista do ActiveCampaign faltando.' });
        }
        logger.info('Utilizando List ID: %d para o quiz %s', listId, quizId);

        // 1. Criar ou Atualizar Contato no ActiveCampaign
        const contactId = await activeCampaignService.createOrUpdateContact(email, listId);
        if (!contactId) {
            logger.error('Falha ao criar ou atualizar contato no ActiveCampaign para %s.', email);
            return res.status(500).json({ error: 'Erro ao processar contato no ActiveCampaign.' });
        }
        logger.info('Contato %s processado com ID: %d', email, contactId);

        // 2. Adicionar Tag de Lead Específica do Quiz
        if (quizConfig.leadTag) {
            // Se quizConfig.leadTag for o ID numérico da tag no ActiveCampaign:
            const tagId = quizConfig.leadTag; 
            await activeCampaignService.addTagToContact(contactId, tagId);
            logger.info('Tag "%s" adicionada ao contato %d.', tagId, contactId);
        } else {
            logger.warn('Nenhuma tag de lead especificada para o quiz %s.', quizId);
        }

        // 3. Atualizar Campos Personalizados no ActiveCampaign
        if (quizConfig.activeCampaignFields) {
            const customFieldsToUpdate = [];
            // Adicionar o score
            if (quizConfig.activeCampaignFields.scoreFieldId) {
                customFieldsToUpdate.push({
                    id: quizConfig.activeCampaignFields.scoreFieldId,
                    value: String(score) 
                });
                logger.info('Adicionado scoreFieldId: %s com valor: %s', quizConfig.activeCampaignFields.scoreFieldId, String(score));
            }

            // Adicionar a resposta da Q4 (se houver e for relevante)
            if (quizConfig.activeCampaignFields.q4FieldId && answers.q4) {
                customFieldsToUpdate.push({
                    id: quizConfig.activeCampaignFields.q4FieldId,
                    value: String(answers.q4)
                });
                logger.info('Adicionado q4FieldId: %s com valor: %s', quizConfig.activeCampaignFields.q4FieldId, String(answers.q4));
            }

            // Adicionar o número do WhatsApp
            if (quizConfig.activeCampaignFields.whatsappFieldId && whatsapp) {
                customFieldsToUpdate.push({
                    id: quizConfig.activeCampaignFields.whatsappFieldId,
                    value: String(whatsapp)
                });
                logger.info('Adicionado whatsappFieldId: %s com valor: %s', quizConfig.activeCampaignFields.whatsappFieldId, String(whatsapp));
            }

            if (customFieldsToUpdate.length > 0) {
                await activeCampaignService.updateCustomFields(contactId, customFieldsToUpdate);
                logger.info('Campos personalizados atualizados para o contato %d.', contactId);
            } else {
                logger.info('Nenhum campo personalizado para atualizar para o quiz %s.', quizId);
            }
        } else {
            logger.warn('Nenhuma configuração de activeCampaignFields encontrada para o quiz %s.', quizId);
        }

        // 4. Enviar E-mail de Resultados do Quiz
        const emailContent = quizConfig.emailTemplateFunction({
            score,
            answers,
            affiliateLink: quizConfig.affiliateLink,
            ctaColor: quizConfig.ctaColor,
            ctaText: quizConfig.ctaText
        });

        // Chama a função sendEmail do emailService.js
        await sendEmail({
            to: email,
            subject: quizConfig.subject,
            html: emailContent
        }); 

        logger.info('E-mail de resultados enviado com sucesso para %s.', email);

        res.status(200).json({ message: 'Quiz enviado e e-mail enviado com sucesso!', contactId });

    } catch (error) {
        logger.error('Erro ao processar submissão do quiz para %s: %s', email, error.message);
        res.status(500).json({ error: 'Erro interno do servidor ao processar o quiz.' });
    }
});

export default router;