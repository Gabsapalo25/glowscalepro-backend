// templates.js — COMPLETO e **ATUALIZADO**
// ============================================================================
// • Mantém identidade única para cada produto
// • Corrige logo (agora servidor MasterTools) — fundo azul #19265b com altura 220px
// • Inclui "Unsubscribe" com link clicável para https://glowscalepro-2.funnels.mastertools.com/unsubscribe?email={{email}}
// ============================================================================

const LOGO_URL =
  "https://content.app-sources.com/s/406737170044669131/uploads/Images/1-removebg-preview-3444739.png";

// ————————————————————————————————————————————————————————————
function baseEmailTemplate({
  productName,
  headingColor,
  name,
  score,
  total,
  introText,
  bullets = [],
  affiliateLink,
  ctaText
}) {
  const bulletsHtml = bullets.map(b => `<li>${b}</li>`).join("\n");

  return `
  <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:auto;">
    <div style="background-color:#19265b;padding:24px 0;text-align:center;">
      <img src="${LOGO_URL}" alt="GlowscalePro Logo" style="max-width:220px;">
    </div>

    <h2 style="color:${headingColor};text-align:center;margin-bottom:12px;">${productName} Quiz</h2>

    <p style="margin:0 0 14px;">Hello, ${name}!</p>
    <p style="font-size:18px;font-weight:bold;margin:0 0 18px;">${score}/${total}<br><span style="font-size:15px;font-weight:400;">Your Final Score</span></p>

    <p style="margin:0 0 20px;">${introText}</p>

    <ul style="padding-left:20px;margin:0 0 28px;">${bulletsHtml}</ul>

    <div style="text-align:center;margin:32px 0;">
      <a href="${affiliateLink}" style="background:${headingColor};color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">${ctaText}</a>
    </div>

    <p style="text-align:center;font-size:12px;color:#888;line-height:1.6;">
      Want to stop receiving these emails? | <a href="mailto:sac@glowscalepro.com" style="color:#6b7280;text-decoration:underline;">Contact us</a> | <a href="https://glowscalepro-2.funnels.mastertools.com/unsubscribe?email={{email}}" style="color:#e74c3c;text-decoration:underline;">Unsubscribe</a><br>
      © 2025 GlowscalePro. All rights reserved.
    </p>
  </div>`;
}

// ============================== TOKMATE =====================================
export function generateTokmateEmailContent({ name, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "TokMate",
    headingColor: "#f59e0b",
    name,
    score,
    total,
    introText:
      "You're closer than ever to unlocking viral growth on TikTok. Based on your answers, we believe you're ready to take the next step.",
    bullets: [
      "Boost your TikTok growth intelligently",
      "AI‑driven content ideas",
      "Monetization made easier"
    ],
    affiliateLink,
    ctaText: "Start Growing on TikTok"
  });
}

// ============================ PRIME BIOME ===================================
export function generatePrimeBiomeEmailContent({ name, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "PrimeBiome",
    headingColor: "#27ae60",
    name,
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

// ============================= PRODENTIM ====================================
export function generateProdentimEmailContent({ name, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "ProDentim",
    headingColor: "#3498db",
    name,
    score,
    total,
    introText:
      "Great score! Your oral health journey starts here — ProDentim is packed with probiotics to help.",
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

// ============================= NERVOVIVE ====================================
export function generateNervoViveEmailContent({ name, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "NervoVive",
    headingColor: "#9b59b6",
    name,
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

// =========================== TOTAL CONTROL 24 ===============================
export function generateTotalControlEmailContent({ name, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "TotalControl24",
    headingColor: "#e67e22",
    name,
    score,
    total,
    introText:
      "Great score! You're serious about your health — Total Control 24 is your next step.",
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

// ============================ GLUCOSHIELD ===================================
export function generateGlucoShieldEmailContent({ name, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "GlucoShield Pro",
    headingColor: "#16a085",
    name,
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

// ============================== PROSTADINE ==================================
export function generateProstadineEmailContent({ name, score, total, affiliateLink }) {
  return baseEmailTemplate({
    productName: "Prostadine",
    headingColor: "#c0392b",
    name,
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
// ============================================================================
// Fim do arquivo templates.js