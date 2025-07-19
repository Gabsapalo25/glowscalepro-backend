// services/templates/templates.js

import { quizzesConfig } from "../../config/quizzesConfig.js";

const LOGO_URL = "https://content.app-sources.com/s/406737170044669131/uploads/Images/1-removebg-preview-3444739.png";

function baseEmailTemplate({
  productName,
  headingColor,
  name,
  email,
  score,
  total,
  introText,
  bullets = [],
  affiliateLink,
  ctaText,
  ebookUrl
}) {
  const bulletsHtml = bullets.map(bullet => `<li>${bullet}</li>`).join("");
  const unsubscribeUrl = `https://glowscalepro-2.funnels.mastertools.com/unsubscribe?email=${encodeURIComponent(email)}`;

  return `
    <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:auto;">
      <div style="background-color:#1e3a8a;padding:24px 0;text-align:center;">
        <img src="${LOGO_URL}" alt="GlowscalePro Logo" style="max-width:220px;">
      </div>

      <h2 style="color:${headingColor};text-align:center;margin-bottom:12px;">${productName} Quiz</h2>
      <p style="margin:0 0 14px;">Hello, ${name}!</p>

      <p style="font-size:18px;font-weight:bold;margin:0 0 18px;">
        ${score}/${total}
        <br>
        <span style="font-size:15px;font-weight:400;">Your Final Score</span>
      </p>

      <p style="margin:0 0 20px;">${introText}</p>

      <ul style="padding-left:20px;margin:0 0 28px;">${bulletsHtml}</ul>

      ${ebookUrl ? `
        <div style="text-align:center;margin:24px 0;">
          <p style="font-size:16px;">🎁 Download your free eBook:</p>
          <a href="${ebookUrl}" target="_blank" style="display:inline-block;margin-top:8px;background:#2ecc71;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
            Download eBook
          </a>
        </div>
      ` : ""}

      <div style="text-align:center;margin:32px 0;">
        <a href="${affiliateLink}" aria-label="Call to action: ${ctaText}" style="background:${headingColor};color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
          ${ctaText}
        </a>
      </div>

      <p style="text-align:center;font-size:12px;color:#888;line-height:1.6;">
        Want to stop receiving these emails?<br>
        <a href="${unsubscribeUrl}" style="color:#e74c3c;text-decoration:underline;" target="_blank" rel="noopener noreferrer">Unsubscribe</a> |
        <a href="mailto:sac@glowscalepro.com" style="color:#6b7280;text-decoration:underline;">Contact us</a><br>
        &copy; 2025 GlowscalePro. All rights reserved.
      </p>
    </div>`;
}

// ========== TEMPLATES POR PRODUTO ==========

function tokmate({ name, email, score, total, affiliateLink }) {
  const { ebookUrl } = quizzesConfig.tokmate;

  return baseEmailTemplate({
    productName: "TokMate",
    headingColor: "#f59e0b",
    name,
    email,
    score,
    total,
    introText: `
      Hi ${name?.split(" ")[0] || "there"},<br><br>
      Congratulations on completing the TokMate Quiz! You scored <strong>${score}/${total}</strong> — an outstanding result.<br><br>
      Your answers reveal you're highly aligned with what it takes to grow on TikTok.
      That’s why we’ve tailored a powerful recommendation to match your stage — and as a bonus, you now have access to our exclusive guide: <strong>"TikTok In Veins 2025"</strong>.<br>
      It’s packed with practical strategies for explosive growth.
    `,
    bullets: [
      "Uncover AI-driven content strategies tailored to your niche",
      "Turn your views into real monetization opportunities",
      "Grow consistently using the newest viral trends"
    ],
    affiliateLink,
    ctaText: "See Your Personalized Growth Plan",
    ebookUrl
  });
}

function nervovive({ name, email, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "NervoVive",
    headingColor: "#9b59b6",
    name,
    email,
    score,
    total,
    introText: `
      Your score of ${score}/${total} suggests your nervous system may need support.<br><br>
      Discover how NervoVive can help soothe discomfort and promote balance from the inside out.
    `,
    bullets: [
      "Soothe burning or tingling sensations",
      "Support nerve regeneration",
      "Promote a calmer nervous system",
      "Comfort day and night"
    ],
    affiliateLink,
    ctaText: "Soothe Nerve Discomfort"
  });
}

function primebiome({ name, email, score, total, affiliateLink }) {
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
    ctaText: "Restore Your Gut Health"
  });
}

function prodentim({ name, email, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "ProDentim",
    headingColor: "#3498db",
    name,
    email,
    score,
    total,
    introText: `
      Your results show you're ready to invest in better oral health.<br><br>
      ProDentim delivers proven probiotic power to protect and restore your smile.
    `,
    bullets: [
      "Strengthen gums and teeth",
      "Fight bad breath at the root",
      "Rebuild oral bacteria balance",
      "Protect enamel naturally"
    ],
    affiliateLink,
    ctaText: "Improve Oral Health"
  });
}

function glucoshield({ name, email, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "GlucoShield Pro",
    headingColor: "#16a085",
    name,
    email,
    score,
    total,
    introText: `
      Based on your score of ${score}/${total}, it's time to take charge of your blood sugar health.<br><br>
      GlucoShield Pro provides powerful daily support to help you stay in control naturally.
    `,
    bullets: [
      "Stabilize blood sugar safely",
      "Protect cells from oxidative stress",
      "Boost metabolism and clarity",
      "Reduce inflammation at the source"
    ],
    affiliateLink,
    ctaText: "Stabilize Glucose Levels"
  });
}

function prostadine({ name, email, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "Prostadine",
    headingColor: "#c0392b",
    name,
    email,
    score,
    total,
    introText: `
      Your quiz score of ${score}/${total} indicates concern for prostate wellness — and you're not alone.<br><br>
      Prostadine can support healthy function, ease discomfort, and restore daily confidence.
    `,
    bullets: [
      "Support healthy prostate function",
      "Reduce urgency & frequency",
      "Promote restful sleep and confidence",
      "Balance inflammation response"
    ],
    affiliateLink,
    ctaText: "Protect Prostate Health"
  });
}

function totalcontrol24({ name, email, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "TotalControl24",
    headingColor: "#e67e22",
    name,
    email,
    score,
    total,
    introText: `
      Your score shows you're motivated to take control of your blood sugar and energy levels.<br><br>
      TotalControl24 empowers your body with consistent support throughout the day.
    `,
    bullets: [
      "Balance blood sugar naturally",
      "Improve insulin response",
      "Fight cravings and control appetite",
      "Support stable energy all day"
    ],
    affiliateLink,
    ctaText: "Control Blood Sugar Now"
  });
}

export const templates = {
  tokmate,
  nervovive,
  primebiome,
  prodentim,
  glucoshield,
  prostadine,
  totalcontrol24
};
