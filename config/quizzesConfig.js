// config/quizzesConfig.js - VERSÃO PROFISSIONAL FINAL

// Importa o módulo 'templates' usando a exportação padrão (default export).
// Certifique-se de que '../services/templates/templates.js' exporta 'templates' como 'export default templates;'.
import templates from '../services/templates/templates.js'; 

export const quizzesConfig = [
  {
    quizId: "tokmate",
    affiliateLink: "https://get.tokmate.com/?aid=1743057",
    ctaColor: "#f59e0b", 
    ctaText: "Start Growing on TikTok",
    subject: "Your TokMate Quiz Results",
    // ID numérico da tag "tokmate_lead" no ActiveCampaign (confirmado: tagid=10)
    leadTag: 10, 
    activeCampaignFields: {
      // Importante: Estes IDs devem ser os IDs numéricos dos seus campos personalizados no ActiveCampaign.
      // Valide-os na sua conta ActiveCampaign em 'Contatos > Gerenciar Campos'.
      scoreFieldId: "1", 
      q4FieldId: "2",    
      whatsappFieldId: "3", 
    },
    emailTemplateFunction: templates.tokmateEmailTemplate,
  },
  {
    quizId: "primebiome",
    affiliateLink: "https://get.primebiome.com/?aid=1743057",
    ctaColor: "#10b981", 
    ctaText: "Discover Your Gut Health Solution",
    subject: "Your PrimeBiome Quiz Results",
    // ID numérico da tag "primebiome_lead" no ActiveCampaign (confirmado: tagid=11)
    leadTag: 11, 
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
    // ID numérico da tag "prodentim_lead" no ActiveCampaign (confirmado: tagid=12)
    leadTag: 12, 
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
    // ID numérico da tag "nervovive_lead" no ActiveCampaign (confirmado: tagid=1)
    leadTag: 1, 
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
    // ID numérico da tag "totalcontrol24_lead" no ActiveCampaign (confirmado: tagid=15)
    leadTag: 15, 
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
    // ID numérico da tag "glucoshield_lead" no ActiveCampaign (confirmado: tagid=13)
    leadTag: 13, 
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
    // ID numérico TEMPORÁRIO da tag "prostadine_lead" no ActiveCampaign.
    // VOCÊ DEVE VERIFICAR O ID REAL DESSA TAG NO ACTIVE CAMPAIGN E ATUALIZAR ESTE VALOR.
    leadTag: 14, 
    activeCampaignFields: {
      scoreFieldId: "19", 
      q4FieldId: "20",
      whatsappFieldId: "21",
    },
    emailTemplateFunction: templates.prostadineEmailTemplate,
  },
];