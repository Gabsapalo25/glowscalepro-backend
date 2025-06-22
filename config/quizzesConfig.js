// config/quizzesConfig.js — COMPLETO e ATUALIZADO (Sua Versão)

import {
  generateTokmateEmailContent,
  generatePrimeBiomeEmailContent,
  generateProdentimEmailContent,
  generateNervoViveEmailContent,
  generateTotalControlEmailContent,
  generateGlucoShieldEmailContent,
  generateProstadineEmailContent
} from "../services/templates/templates.js"; // Caminho corrigido para templates.js

export const quizzesConfig = [
  {
    quizId: "tokmate",
    emailTemplateFunction: generateTokmateEmailContent,
    affiliateLink: "https://get.tokmate.com/?aid=1743057",
    ctaColor: "#f59e0b",
    ctaText: "Start Growing on TikTok",
    subject: "Your TokMate Quiz Results",
    leadTag: "tokmate_lead", // Lembre-se, este deve ser o ID numérico da tag no AC
    activeCampaignFields: {
      scoreFieldId: "1",
      q4FieldId: "2",
      whatsappFieldId: "3"
    }
  },
  {
    quizId: "primebiome",
    emailTemplateFunction: generatePrimeBiomeEmailContent,
    affiliateLink: "https://primebiome24.com/text.php#aff=gabynos",
    ctaColor: "#27ae60",
    ctaText: "Restore Your Gut Health",
    subject: "Your PrimeBiome Quiz Results",
    leadTag: "primebiome_lead",
    activeCampaignFields: {
      scoreFieldId: "1",
      q4FieldId: "2",
      whatsappFieldId: "3"
    }
  },
  {
    quizId: "prodentim",
    emailTemplateFunction: generateProdentimEmailContent,
    affiliateLink: "https://prodentim24.com/text.php#aff=gabynos",
    ctaColor: "#3498db",
    ctaText: "Improve Oral Health",
    subject: "Your ProDentim Quiz Results",
    leadTag: "prodentim_lead",
    activeCampaignFields: {
      scoreFieldId: "1",
      q4FieldId: "2",
      whatsappFieldId: "3"
    }
  },
  {
    quizId: "nervovive",
    emailTemplateFunction: generateNervoViveEmailContent,
    affiliateLink: "https://nervovive24.com/text.php#aff=gabynos",
    ctaColor: "#9b59b6",
    ctaText: "Soothe Nerve Discomfort",
    subject: "Your NervoVive Quiz Results",
    leadTag: "nervovive_lead",
    activeCampaignFields: {
      scoreFieldId: "1",
      q4FieldId: "2",
      whatsappFieldId: "3"
    }
  },
  {
    quizId: "totalcontrol24",
    emailTemplateFunction: generateTotalControlEmailContent,
    affiliateLink: "https://buytc24.net/discovery#aff=gabynos",
    ctaColor: "#e67e22",
    ctaText: "Control Blood Sugar Now",
    subject: "Your TotalControl24 Quiz Results",
    leadTag: "totalcontrol24_lead",
    activeCampaignFields: {
      scoreFieldId: "1",
      q4FieldId: "2",
      whatsappFieldId: "3"
    }
  },
  {
    quizId: "glucoshield",
    emailTemplateFunction: generateGlucoShieldEmailContent,
    affiliateLink: "https://glucoshieldpro24.com/text.php#aff=gabynos",
    ctaColor: "#16a085",
    ctaText: "Stabilize Glucose Levels",
    subject: "Your GlucoShield Quiz Results",
    leadTag: "glucoshield_lead",
    activeCampaignFields: {
      scoreFieldId: "1",
      q4FieldId: "2",
      whatsappFieldId: "3"
    }
  },
  {
    quizId: "prostadine",
    emailTemplateFunction: generateProstadineEmailContent,
    affiliateLink: "https://prostadine24.com/text.php#aff=gabynos&cam=CAMPAIGNKEY",
    ctaColor: "#c0392b",
    ctaText: "Protect Prostate Health",
    subject: "Your Prostadine Quiz Results",
    leadTag: "prostadine_lead",
    activeCampaignFields: {
      scoreFieldId: "1",
      q4FieldId: "2",
      whatsappFieldId: "3"
    }
  }
];