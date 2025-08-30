// services/templates/templates.js
import { quizzesConfig } from "../config/quizzesConfig.js";

const baseEmailTemplate = ({
  productName,
  headingColor,
  name,
  email,
  score,
  total,
  introText,
  bullets,
  affiliateLink,
  ctaText,
  ebookUrl,
  extraContent = "",
}) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${productName} Quiz Results</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: ${headingColor}; color: white; padding: 10px; text-align: center; }
      .content { padding: 20px; }
      .cta { display: inline-block; background: ${headingColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      .bullet-list { list-style-type: none; padding-left: 0; }
      .bullet-list li { margin: 10px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${productName} Quiz Results</h1>
      </div>
      <div class="content">
        <p>Hi ${name},</p>
        <p>${introText}</p>
        <p>Your score: <strong>${score}/${total}</strong></p>
        <ul class="bullet-list">
          ${bullets.map(bullet => `<li>${bullet}</li>`).join('')}
        </ul>
        <div style="text-align:center;margin:24px 0;">
          <a href="${affiliateLink}" class="cta">${ctaText}</a>
        </div>
        ${ebookUrl ? `
          <div style="text-align:center;margin:24px 0;">
            <p style="font-size:16px;">🎁 Download your bonus eBook:</p>
            <a href="${ebookUrl}" target="_blank" style="display:inline-block;margin-top:8px;background:${headingColor};color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
              Download eBook
            </a>
          </div>
        ` : ''}
        ${extraContent}
      </div>
    </div>
  </body>
  </html>
`;

export const templates = {
  tokmate: ({ name, email, score, total, affiliateLink }) => {
    const { ebookUrl } = quizzesConfig.tokmate;
    return baseEmailTemplate({
      productName: "TokMate",
      headingColor: "#f59e0b",
      name,
      email,
      score,
      total,
      introText: `
        A score of ${score}/${total} shows your TikTok potential!<br><br>
        TokMate helps you grow your audience with proven strategies.
      `,
      bullets: [
        "Boost your TikTok followers",
        "Master viral content creation",
        "Increase engagement rates",
        "Grow your brand fast"
      ],
      affiliateLink,
      ctaText: "Start Growing on TikTok",
      ebookUrl
    });
  },
  primebiome: ({ name, email, score, total, affiliateLink }) => {
    const { ebookUrl, ebookUrl2 } = quizzesConfig.primebiome;

    return baseEmailTemplate({
      productName: "PrimeBiome",
      headingColor: "#27ae60",
      name,
      email,
      score,
      total,
      introText: `
        A score of ${score}/${total} means your gut health is ready for a reset.<br><br>
        PrimeBiome offers natural, research-backed solutions to restore your microbiome and energize your life.
      `,
      bullets: [
        "Balance your microbiome naturally",
        "Support digestion and immune function",
        "Feel energized and lighter",
        "Eliminate bloating and discomfort"
      ],
      affiliateLink,
      ctaText: "Restore Your Gut Health",
      ebookUrl, // Your Main Guide
      extraContent: ebookUrl2 && ebookUrl !== ebookUrl2 ? `
        <div style="text-align:center;margin:24px 0;">
          <p style="font-size:16px;">🎁 Download your second bonus eBook:</p>
          <a href="${ebookUrl2}" target="_blank" style="display:inline-block;margin-top:8px;background:#2ecc71;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
            Download Second eBook
          </a>
        </div>
      ` : "" // Skin Vitality Checklist, apenas se diferente
    });
  },
  prodentim: ({ name, email, score, total, affiliateLink }) => {
    const { ebookUrl } = quizzesConfig.prodentim;
    return baseEmailTemplate({
      productName: "ProDentim",
      headingColor: "#06b6d4",
      name,
      email,
      score,
      total,
      introText: `
        A score of ${score}/${total} reveals your oral health needs attention!<br><br>
        ProDentim supports a healthier smile naturally.
      `,
      bullets: [
        "Strengthen your teeth and gums",
        "Reduce plaque and bacteria",
        "Freshen your breath naturally",
        "Support long-term oral health"
      ],
      affiliateLink,
      ctaText: "Unlock Your Oral Health Secrets",
      ebookUrl
    });
  },
  nervovive: ({ name, email, score, total, affiliateLink }) => {
    const { ebookUrl } = quizzesConfig.nervovive;
    return baseEmailTemplate({
      productName: "NervoVive",
      headingColor: "#6366f1",
      name,
      email,
      score,
      total,
      introText: `
        A score of ${score}/${total} suggests nerve support is needed!<br><br>
        NervoVive helps calm and restore your nervous system.
      `,
      bullets: [
        "Reduce nerve discomfort",
        "Promote relaxation",
        "Support healthy nerve function",
        "Enhance overall well-being"
      ],
      affiliateLink,
      ctaText: "Find Your Calm",
      ebookUrl
    });
  },
  totalcontrol24: ({ name, email, score, total, affiliateLink }) => {
    const { ebookUrl } = quizzesConfig.totalcontrol24;
    return baseEmailTemplate({
      productName: "TotalControl24",
      headingColor: "#f97316",
      name,
      email,
      score,
      total,
      introText: `
        A score of ${score}/${total} indicates control is within reach!<br><br>
        TotalControl24 empowers your daily routine.
      `,
      bullets: [
        "Regain focus and energy",
        "Support weight management",
        "Boost metabolism",
        "Enhance daily performance"
      ],
      affiliateLink,
      ctaText: "Gain Back Control",
      ebookUrl
    });
  },
  glucoshield: ({ name, email, score, total, affiliateLink }) => {
    const { ebookUrl } = quizzesConfig.glucoshield;
    return baseEmailTemplate({
      productName: "GlucoShield",
      headingColor: "#ef4444",
      name,
      email,
      score,
      total,
      introText: `
        A score of ${score}/${total} shows glucose balance is key!<br><br>
        GlucoShield supports stable blood sugar naturally.
      `,
      bullets: [
        "Maintain healthy glucose levels",
        "Reduce sugar cravings",
        "Support energy stability",
        "Promote overall health"
      ],
      affiliateLink,
      ctaText: "Stabilize Your Glucose",
      ebookUrl
    });
  },
  prostadine: ({ name, email, score, total, affiliateLink }) => {
    const { ebookUrl } = quizzesConfig.prostadine;
    return baseEmailTemplate({
      productName: "Prostadine",
      headingColor: "#84cc16",
      name,
      email,
      score,
      total,
      introText: `
        A score of ${score}/${total} highlights prostate health needs!<br><br>
        Prostadine supports optimal prostate function.
      `,
      bullets: [
        "Support prostate health",
        "Improve urinary flow",
        "Reduce discomfort",
        "Enhance vitality"
      ],
      affiliateLink,
      ctaText: "Support Your Prostate Health",
      ebookUrl
    });
  }
};

export default templates;