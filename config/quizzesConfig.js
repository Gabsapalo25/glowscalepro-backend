// config/quizzesConfig.js

function generateDefaultEmailHtml({ name, score, total, affiliateLink }) {
  const percentage = Math.round((score / total) * 100);
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">Hi ${name}!</h2>
      <p>Thanks for completing the quiz. Your score is <strong>${score}/${total}</strong> (${percentage}%).</p>
      <p>Based on your answers, we believe you could benefit from our powerful natural solution.</p>
      <a href="${affiliateLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px;">
        Reveal Your Personalized Recommendation
      </a>
      <p style="margin-top: 30px;">To your health,<br>The GlowscalePro Team</p>
    </div>
  `;
}

export const quizzesConfig = {
  tokmate: {
    leadTag: 10,
    ctaColor: "#f59e0b",
    ctaText: "Start Growing on TikTok",
    subject: "Your TokMate Quiz Results",
    generateEmailHtml: generateDefaultEmailHtml
  },
  primebiome: {
    leadTag: 11,
    ctaColor: "#10b981",
    ctaText: "Discover Your Gut Health Solution",
    subject: "Your PrimeBiome Quiz Results",
    generateEmailHtml: generateDefaultEmailHtml
  },
  prodentim: {
    leadTag: 12,
    ctaColor: "#06b6d4",
    ctaText: "Unlock Your Oral Health Secrets",
    subject: "Your ProDentim Quiz Results",
    generateEmailHtml: generateDefaultEmailHtml
  },
  nervovive: {
    leadTag: 1,
    ctaColor: "#6366f1",
    ctaText: "Find Your Calm",
    subject: "Your NervoVive Quiz Results",
    generateEmailHtml: generateDefaultEmailHtml
  },
  totalcontrol24: {
    leadTag: 15,
    ctaColor: "#f97316",
    ctaText: "Gain Back Control",
    subject: "Your TotalControl24 Quiz Results",
    generateEmailHtml: generateDefaultEmailHtml
  },
  glucoshield: {
    leadTag: 13,
    ctaColor: "#ef4444",
    ctaText: "Stabilize Your Glucose",
    subject: "Your GlucoShield Quiz Results",
    generateEmailHtml: generateDefaultEmailHtml
  },
  prostadine: {
    leadTag: 14,
    ctaColor: "#84cc16",
    ctaText: "Support Your Prostate Health",
    subject: "Your Prostadine Quiz Results",
    generateEmailHtml: generateDefaultEmailHtml
  },
};
