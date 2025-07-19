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
          ${ctaTe
