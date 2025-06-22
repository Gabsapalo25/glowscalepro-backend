// quizzesConfig.js — atualizado com links corretos e campos ActiveCampaign
// ============================================================

import {
  generateTokmateEmailContent,
  generatePrimeBiomeEmailContent,
  generateProdentimEmailContent,
  generateNervoViveEmailContent,
  generateTotalControlEmailContent,
  generateGlucoShieldEmailContent,
  generateProstadineEmailContent
} from '../services/templates/templates.js';

export const quizzesConfig = [
  {
    quizId: "tokmate",
    emailTemplateFunction: generateTokmateEmailContent,
    affiliateLink: "https://get.tokmate.com/?aid=1743057",
    ctaColor: "#8B5CF6",
    ctaText: "Start Growing on TikTok",
    subject: "Your TokMate Quiz Results",
    leadTag: "tokmate_lead",
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
    ctaColor: "#10B981",
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
    ctaColor: "#3B82F6",
    ctaText: "Get ProDentim Now",
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
    ctaColor: "#F59E0B",
    ctaText: "Buy NervoVive Now",
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
    ctaColor: "#EF4444",
    ctaText: "Reclaim Control Today",
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
    ctaColor: "#6366F1",
    ctaText: "Support Healthy Glucose",
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
    ctaColor: "#D97706",
    ctaText: "Protect Your Prostate Now",
    subject: "Your Prostadine Quiz Results",
    leadTag: "prostadine_lead",
    activeCampaignFields: {
      scoreFieldId: "1",
      q4FieldId: "2",
      whatsappFieldId: "3"
    }
  }
];
