import { templates } from "../services/templates/templates.js";

export const quizzesConfig = {
  tokmate: {
    leadTag: 10,
    ctaColor: "#f59e0b",
    ctaText: "Start Growing on TikTok",
    subject: "Your TokMate Quiz Results",
    ebookUrl: "https://drive.google.com/file/d/1L9tg7rkanAWZEgxCds_u3equ6rG2TgYm/view?usp=drive_link",
    generateEmailHtml: templates.tokmate
  },
  primebiome: {
    leadTag: 11,
    ctaColor: "#10b981",
    ctaText: "Discover Your PrimeBiome Solution",
    subject: "Your PrimeBiome Quiz Results",
    ebookUrl: "https://drive.google.com/file/d/16IwQhvWPM3yxEt-5ToYmJYmf1wBOYGXq/view?usp=sharing", // Your Main Guide
    ebookUrl2: "https://drive.google.com/file/d/1-p_1JnsA8cSRG8IMwpbQ-amLP_tyFbJ7/view?usp=drive_link", // Skin Vitality Checklist
    generateEmailHtml: templates.primebiome
  },
  prodentim: {
    leadTag: 12,
    ctaColor: "#06b6d4",
    ctaText: "Unlock Your Oral Health Secrets",
    subject: "Your ProDentim Quiz Results",
    generateEmailHtml: templates.prodentim
  },
  nervovive: {
    leadTag: 1,
    ctaColor: "#6366f1",
    ctaText: "Find Your Calm",
    subject: "Your NervoVive Quiz Results",
    generateEmailHtml: templates.nervovive
  },
  totalcontrol24: {
    leadTag: 15,
    ctaColor: "#f97316",
    ctaText: "Gain Back Control",
    subject: "Your TotalControl24 Quiz Results",
    generateEmailHtml: templates.totalcontrol24
  },
  glucoshield: {
    leadTag: 13,
    ctaColor: "#ef4444",
    ctaText: "Stabilize Your Glucose",
    subject: "Your GlucoShield Quiz Results",
    generateEmailHtml: templates.glucoshield
  },
  prostadine: {
    leadTag: 14,
    ctaColor: "#84cc16",
    ctaText: "Support Your Prostate Health",
    subject: "Your Prostadine Quiz Results",
    generateEmailHtml: templates.prostadine
  }
};