// campaignConfig.js

import { affiliateLinks } from '../services/affiliateLinks.js';

export const campaignConfig = {
  primebiome: {
    productName: 'PrimeBiome',
    listId: 5, // ✅ ID da lista no ActiveCampaign (não usar nome)
    tagId: 11, // ✅ ID da tag do produto PrimeBiome

    emails: [
      {
        subject: "Is Your Gut Secretly Destroying Your Skin? 😳",
        preheader: "96% of users saw visible skin & gut improvement in 30 days!",
        sendTime: "Tuesday 09:00", // Melhor horário para impacto inicial
        htmlTemplate: "primebiome_email1.html",
        link: affiliateLinks.primebiome,
      },
      {
        subject: "The $2.99/day Beauty Hack Dermatologists Swear By 👩‍⚕️✨",
        preheader: "No creams. No diets. Just 1 delicious gummy a day.",
        sendTime: "Thursday 13:00", // Follow-up persuasivo durante o horário de almoço
        htmlTemplate: "primebiome_email2.html",
        link: affiliateLinks.primebiome,
      },
      {
        subject: "Bloating, Acne, Cellulite? 🔥 Here's the Real Root Cause...",
        preheader: "How Anna reversed it all in just 30 days.",
        sendTime: "Sunday 21:00", // Momento emocional, introspectivo
        htmlTemplate: "primebiome_email3.html",
        link: affiliateLinks.primebiome,
      },
      {
        subject: "⏳Final Hours: 40% OFF + 2 FREE eBooks + Free Shipping!",
        preheader: "Your glow-up journey starts now – or never.",
        sendTime: "Wednesday 06:00", // Urgência e escassez
        htmlTemplate: "primebiome_email4.html",
        link: affiliateLinks.primebiome,
      },
    ],
  },

  // 🔄 Estrutura pronta para futuros produtos:
  /*
  tokmate: {
    productName: 'TokMate',
    listId: 5,
    tagId: 10,
    emails: [ ... ],
  },
  nervovive: {
    productName: 'NervoVive',
    listId: 5,
    tagId: 1,
    emails: [ ... ],
  },
  // etc...
  */
};
