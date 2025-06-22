// config/quizzesConfig.js - VERSÃO FINAL E CORRIGIDA
import { templates } from '../services/templates/templates.js'; 

export const quizzesConfig = [
  {
    quizId: "tokmate",
    affiliateLink: "https://get.tokmate.com/?aid=1743057",
    ctaColor: "#f59e0b", // Cor para o botão CTA
    ctaText: "Start Growing on TikTok",
    subject: "Your TokMate Quiz Results",
    leadTag: 10, // ID numérico da tag "tokmate_lead" no ActiveCampaign
    activeCampaignFields: {
      scoreFieldId: "1", // Exemplo: ID do campo personalizado para a pontuação do quiz
      q4FieldId: "2",    // Exemplo: ID do campo personalizado para a resposta da Q4
      whatsappFieldId: "3", // Exemplo: ID do campo personalizado para o WhatsApp
    },
    emailTemplateFunction: templates.tokmateEmailTemplate,
  },
  {
    quizId: "primebiome",
    affiliateLink: "https://get.primebiome.com/?aid=1743057",
    ctaColor: "#10b981", 
    ctaText: "Discover Your Gut Health Solution",
    subject: "Your PrimeBiome Quiz Results",
    leadTag: 11, // ID numérico da tag "primebiome_lead" no ActiveCampaign
    activeCampaignFields: {
      scoreFieldId: "4", 
      q4FieldId: "5",
      whatsappFieldId: "6",
    },
    emailTemplateFunction: templates.primeBiomeEmailTemplate,
  },
  {
    quizId: "prodentim",
    affiliateLink: "https://get.prodentim.com/?aid=1743057",
    ctaColor: "#06b6d4", 
    ctaText: "Unlock Your Oral Health Secrets",
    subject: "Your ProDentim Quiz Results",
    leadTag: 12, // ID numérico da tag "prodentim_lead" no ActiveCampaign
    activeCampaignFields: {
      scoreFieldId: "7", 
      q4FieldId: "8",
      whatsappFieldId: "9",
    },
    emailTemplateFunction: templates.prodentimEmailTemplate,
  },
  {
    quizId: "nervovive",
    affiliateLink: "https://get.nervovive.com/?aid=1743057",
    ctaColor: "#6366f1", 
    ctaText: "Find Your Calm",
    subject: "Your NervoVive Quiz Results",
    leadTag: 1, // ID numérico da tag "nervovive_lead" no ActiveCampaign
    activeCampaignFields: {
      scoreFieldId: "10", 
      q4FieldId: "11",
      whatsappFieldId: "12",
    },
    emailTemplateFunction: templates.nervoviveEmailTemplate,
  },
  {
    quizId: "totalcontrol24",
    affiliateLink: "https://get.totalcontrol24.com/?aid=1743057",
    ctaColor: "#f97316", 
    ctaText: "Gain Back Control",
    subject: "Your TotalControl24 Quiz Results",
    leadTag: 15, // ID numérico da tag "totalcontrol24_lead" no ActiveCampaign
    activeCampaignFields: {
      scoreFieldId: "13", 
      q4FieldId: "14",
      whatsappFieldId: "15",
    },
    emailTemplateFunction: templates.totalcontrol24EmailTemplate,
  },
  {
    quizId: "glucoshield",
    affiliateLink: "https://get.glucoshield.com/?aid=1743057",
    ctaColor: "#ef4444", 
    ctaText: "Stabilize Your Glucose",
    subject: "Your GlucoShield Quiz Results",
    leadTag: 13, // ID numérico da tag "glucoshield_lead" no ActiveCampaign
    activeCampaignFields: {
      scoreFieldId: "16", 
      q4FieldId: "17",
      whatsappFieldId: "18",
    },
    emailTemplateFunction: templates.glucoshieldEmailTemplate,
  },
  {
    quizId: "prostadine",
    affiliateLink: "https://get.prostadine.com/?aid=1743057",
    ctaColor: "#84cc16", 
    ctaText: "Support Your Prostate Health",
    subject: "Your Prostadine Quiz Results",
    leadTag: 14, // ID numérico TEMPORÁRIO da tag "prostadine_lead" no ActiveCampaign.
                // LEMBRE-SE DE VERIFICAR E ATUALIZAR ESTE ID REAL NO ACTIVE CAMPAIGN!
    activeCampaignFields: {
      scoreFieldId: "19", 
      q4FieldId: "20",
      whatsappFieldId: "21",
    },
    emailTemplateFunction: templates.prostadineEmailTemplate,
  },
];