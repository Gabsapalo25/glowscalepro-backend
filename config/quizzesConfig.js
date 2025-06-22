// config/quizzesConfig.js
import { templates } from '../services/templates/templates.js'; // Certifique-se de que o caminho está correto

export const quizzesConfig = [
  {
    quizId: "tokmate",
    affiliateLink: "https://get.tokmate.com/?aid=1743057",
    ctaColor: "#f59e0b",
    ctaText: "Start Growing on TikTok",
    subject: "Your TokMate Quiz Results",
    leadTag: 10, // Confirmed from your URL: tagid=10
    // listId: 5, // OPCIONAL: Se todos os quizzes vão para a mesma lista principal (ID 5), não precisa repetir isso em cada quiz.
                 // Seu quizRoutes.js já usa req.app.locals.acListIdMastertoolsAll por padrão.
    activeCampaignFields: {
      scoreFieldId: "1", 
      q4FieldId: "2",
      whatsappFieldId: "3",
    },
    emailTemplateFunction: templates.tokmateEmailTemplate,
  },
  {
    quizId: "primebiome",
    // ... outros campos ...
    leadTag: 11, // Confirmed from your URL: tagid=11
    // listId: 5, // OPCIONAL
    activeCampaignFields: {
        scoreFieldId: "4", 
        q4FieldId: "5",
        whatsappFieldId: "6",
    },
    emailTemplateFunction: templates.primeBiomeEmailTemplate,
  },
  {
    quizId: "prodentim",
    // ... outros campos ...
    leadTag: 12, // Confirmed from your URL: tagid=12
    // listId: 5, // OPCIONAL
    activeCampaignFields: {
        scoreFieldId: "7", 
        q4FieldId: "8",
        whatsappFieldId: "9",
    },
    emailTemplateFunction: templates.prodentimEmailTemplate,
  },
  {
    quizId: "nervovive",
    // ... outros campos ...
    leadTag: 1, // Confirmed from your URL: tagid=1
    // listId: 5, // OPCIONAL
    activeCampaignFields: {
        scoreFieldId: "10", 
        q4FieldId: "11",
        whatsappFieldId: "12",
    },
    emailTemplateFunction: templates.nervoviveEmailTemplate,
  },
  {
    quizId: "totalcontrol24",
    // ... outros campos ...
    leadTag: 15, // Confirmed from your URL: tagid=15
    // listId: 5, // OPCIONAL
    activeCampaignFields: {
        scoreFieldId: "13", 
        q4FieldId: "14",
        whatsappFieldId: "15",
    },
    emailTemplateFunction: templates.totalcontrol24EmailTemplate,
  },
  {
    quizId: "glucoshield",
    // ... outros campos ...
    leadTag: 13, // Confirmed from your URL: tagid=13
    // listId: 5, // OPCIONAL
    activeCampaignFields: {
        scoreFieldId: "16", 
        q4FieldId: "17",
        whatsappFieldId: "18",
    },
    emailTemplateFunction: templates.glucoshieldEmailTemplate,
  },
  {
    quizId: "prostadine",
    // ... outros campos ...
    leadTag: /* COLOQUE O ID NUMÉRICO DO PROSTADINE AQUI */, // <-- SUBSTITUA ESTE COMENTÁRIO PELO ID REAL!
    // listId: 5, // OPCIONAL
    activeCampaignFields: {
        scoreFieldId: "19", 
        q4FieldId: "20",
        whatsappFieldId: "21",
    },
    emailTemplateFunction: templates.prostadineEmailTemplate,
  },
  // ... adicione outras configurações de quiz se houver
];