import { templates } from '../services/templates/templates.js';

export const quizzes = [
  {
    quizId: "tokmate",
    affiliateLink: "https://get.tokmate.com/?aid=1743057",
    ctaColor: "#f59e0b",
    ctaText: "Start Growing on TikTok",
    subject: "Your TokMate Quiz Results",
    leadTag: 10,
    activeCampaignFields: {
      scoreFieldId: "1",
      q4FieldId: "2",
      whatsappFieldId: "3",
      listId: "5"
    },
    emailTemplateFunction: templates.tokmateEmailTemplate,
  },
  {
    quizId: "primebiome",
    affiliateLink: "https://get.primebiome.com/?aid=1743057",
    ctaColor: "#27ae60",
    ctaText: "Restore Your Gut Health",
    subject: "Your PrimeBiome Quiz Results",
    leadTag: 11,
    activeCampaignFields: {
      scoreFieldId: "4",
      q4FieldId: "5",
      whatsappFieldId: "6",
      listId: "5"
    },
    emailTemplateFunction: templates.primeBiomeEmailTemplate,
  },
  {
    quizId: "prodentim",
    affiliateLink: "https://get.prodentim.com/?aid=1743057",
    ctaColor: "#3498db",
    ctaText: "Improve Oral Health",
    subject: "Your ProDentim Quiz Results",
    leadTag: 12,
    activeCampaignFields: {
      scoreFieldId: "7",
      q4FieldId: "8",
      whatsappFieldId: "9",
      listId: "5"
    },
    emailTemplateFunction: templates.prodentimEmailTemplate,
  },
  {
    quizId: "nervovive",
    affiliateLink: "https://get.nervovive.com/?aid=1743057",
    ctaColor: "#9b59b6",
    ctaText: "Soothe Nerve Discomfort",
    subject: "Your NervoVive Quiz Results",
    leadTag: 13,
    activeCampaignFields: {
      scoreFieldId: "10",
      q4FieldId: "11",
      whatsappFieldId: "12",
      listId: "5"
    },
    emailTemplateFunction: templates.nervoviveEmailTemplate,
  },
  {
    quizId: "totalcontrol24",
    affiliateLink: "https://get.totalcontrol24.com/?aid=1743057",
    ctaColor: "#e67e22",
    ctaText: "Control Blood Sugar Now",
    subject: "Your TotalControl24 Quiz Results",
    leadTag: 15,
    activeCampaignFields: {
      scoreFieldId: "13",
      q4FieldId: "14",
      whatsappFieldId: "15",
      listId: "5"
    },
    emailTemplateFunction: templates.totalcontrol24EmailTemplate,
  },
  {
    quizId: "glucoshield",
    affiliateLink: "https://get.glucoshield.com/?aid=1743057",
    ctaColor: "#16a085",
    ctaText: "Stabilize Glucose Levels",
    subject: "Your GlucoShield Quiz Results",
    leadTag: 16,
    activeCampaignFields: {
      scoreFieldId: "16",
      q4FieldId: "17",
      whatsappFieldId: "18",
      listId: "5"
    },
    emailTemplateFunction: templates.glucoshieldEmailTemplate,
  },
  {
    quizId: "prostadine",
    affiliateLink: "https://get.prostadine.com/?aid=1743057",
    ctaColor: "#84cc16",
    ctaText: "Support Your Prostate Health",
    subject: "Your Prostadine Quiz Results",
    leadTag: 14,
    activeCampaignFields: {
      scoreFieldId: "19",
      q4FieldId: "20",
      whatsappFieldId: "21",
      listId: "5"
    },
    emailTemplateFunction: templates.prostadineEmailTemplate,
  },
];

export const getQuizConfig = (quizId) => {
  return quizzes.find((quiz) => quiz.quizId === quizId);
};