// services/templates/templates.js

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
  ctaText
}) {
  const bulletsHtml = bullets.map(bullet => `<li>${bullet}</li>`).join("");
  const unsubscribeUrl = `https://glowscalepro-2.funnels.mastertools.com/unsubscribe?email=${encodeURIComponent(email)}`;

  return `
    <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:auto;">
      <!-- Header com logo -->
      <div style="background-color:#1e3a8a;padding:24px 0;text-align:center;">
        <img src="${LOGO_URL}" alt="GlowscalePro Logo" style="max-width:220px;">
      </div>

      <!-- Título do produto -->
      <h2 style="color:${headingColor};text-align:center;margin-bottom:12px;">${productName} Quiz</h2>

      <!-- Saudação -->
      <p style="margin:0 0 14px;">Hello, ${name}!</p>

      <!-- Resultado do quiz -->
      <p style="font-size:18px;font-weight:bold;margin:0 0 18px;">
        ${score}/${total}
        <br>
        <span style="font-size:15px;font-weight:400;">Your Final Score</span>
      </p>

      <!-- Introdução -->
      <p style="margin:0 0 20px;">${introText}</p>

      <!-- Lista de benefícios -->
      <ul style="padding-left:20px;margin:0 0 28px;">${bulletsHtml}</ul>

      <!-- Botão de CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${affiliateLink}" aria-label="Call to action: ${ctaText}" style="background:${headingColor};color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
          ${ctaText}
        </a>
      </div>

      <!-- Rodapé -->
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
  return baseEmailTemplate({
    productName: "TokMate",
    headingColor: "#f59e0b",
    name,
    email,
    score,
    total,
    introText: "You're closer than ever to unlocking viral growth on TikTok. Based on your answers, we believe you're ready to take the next step.",
    bullets: [
      "Boost your TikTok growth intelligently",
      "AI‑driven content ideas",
      "Monetization made easier"
    ],
    affiliateLink,
    ctaText: "Start Growing on TikTok"
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
    introText: `Your nerves deserve relief — and your quiz score of ${score}/${total} shows you're ready.`,
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
    introText: `Your gut health matters — and with a score of ${score}/${total}, it's clear you're on the right track.`,
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
    introText: "Great score! Your oral health journey starts here — ProDentim is packed with probiotics to help.",
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
    introText: "You're informed — now protect your body with GlucoShield Pro.",
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
    introText: `Your result (${score}/${total}) shows you care about men's health — Prostadine can make a real difference.`,
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
    introText: "Great score! You're serious about your health — Total Control 24 is your next step.",
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

// ========== EXPORTAÇÃO FINAL ==========

export const templates = {
  tokmate,
  nervovive,
  primebiome,
  prodentim,
  glucoshield,
  prostadine,
  totalcontrol24
};
