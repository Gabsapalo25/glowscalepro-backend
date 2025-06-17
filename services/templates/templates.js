const generateBaseEmail = (data, customContent) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject || 'Your Quiz Results'}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f7f9fc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .brand-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      padding: 10px 0;
    }
    .brand-logo {
      height: 18px;
      width: auto;
      max-width: 68px;
      object-fit: contain;
    }
    .content {
      padding: 30px;
    }
    .score-container {
      text-align: center;
      margin-bottom: 25px;
    }
    .score {
      font-size: 48px;
      font-weight: 700;
      color: #2c3e50;
      margin: 10px 0;
    }
    .total {
      font-size: 20px;
      color: #7f8c8d;
    }
    .insight {
      background-color: #f8f9fa;
      border-left: 4px solid #3498db;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .cta-container {
      text-align: center;
      margin: 40px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 15px 40px;
      border-radius: 30px;
      font-weight: 700;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }
    .cta-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 7px 20px rgba(0, 0, 0, 0.2);
    }
    .guarantee {
      font-size: 14px;
      color: #7f8c8d;
      margin-top: 10px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
    }
    .footer-links a {
      color: #3498db;
      text-decoration: none;
      margin: 0 10px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    @media (max-width: 600px) {
      .content {
        padding: 20px;
      }
      .score {
        font-size: 36px;
      }
      .brand-header {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-header">
        <img src="https://content.app-sources.com/s/406737170044669131/uploads/Images/2-removebg-preview-3444630.png" 
             alt="GlowscalePro Logo" class="brand-logo">
        <h1>${data.quizTitle || 'Quiz Results'}</h1>
      </div>
    </div>
    
    <div class="content">
      <p>Hello, ${data.name}!</p>
      
      <div class="score-container">
        <div class="score">${data.score}/${data.total}</div>
        <div class="total">Your Final Score</div>
      </div>
      
      ${customContent}
      
      ${data.q4 ? `
        <div class="insight">
          <strong>Your Key Insight:</strong> ${data.q4}
        </div>
      ` : ''}
      
      <div class="cta-container">
        <a href="${data.affiliateLink}" 
           class="cta-button" 
           style="background-color: ${data.ctaColor || '#3498db'}; 
                  color: ${getContrastColor(data.ctaColor || '#3498db')};">
          ${data.ctaText || 'Get Your Solution Now!'}
        </a>
        <p class="guarantee">Secure checkout · 30-day money-back guarantee</p>
      </div>
      
      <p>Best regards,<br>${data.quizTitle || 'Quiz'} Team</p>
    </div>
    
    <div class="footer">
      <p>${data.physicalAddress || '123 Business Street, Miami, FL 33101'}</p>
      <div class="footer-links">
        <a href="${data.privacyUrl || 'https://glowscalepro.com/privacy'}">Privacy Policy</a>
        <a href="${data.unsubscribeUrl || 'https://glowscalepro.com/unsubscribe'}">Unsubscribe</a>
        <a href="${data.contactUrl || 'https://glowscalepro.com/contact'}">Contact Us</a>
      </div>
      <p>© ${new Date().getFullYear()} ${data.quizTitle || 'GlowscalePro'}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

function getContrastColor(hexColor) {
  if (!hexColor) return '#ffffff';
  
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function generateTokmateEmailContent(data) {
  const customContent = `
    <p>Congratulations on completing the Tokmate Quiz! Based on your score of ${data.score}/${data.total}, 
    you're ready to take your TikTok game to the next level.</p>
    
    <p>Tokmate is the ultimate TikTok automation tool designed to help you:</p>
    <ul>
      <li>Grow your audience exponentially</li>
      <li>Schedule posts for optimal engagement</li>
      <li>Analyze performance with advanced metrics</li>
      <li>Go viral with AI-powered content suggestions</li>
    </ul>
  `;
  
  return generateBaseEmail({
    ...data,
    ctaText: "Get Tokmate Now!",
    ctaColor: data.ctaColor || "#f39c12"
  }, customContent);
}

export function generatePrimebiomeEmailContent(data) {
  const customContent = `
    <p>Your PrimeBiome Quiz results are in! With a score of ${data.score}/${data.total}, 
    you've shown great understanding of gut health importance.</p>
    
    <p>PrimeBiome is specially formulated to:</p>
    <ul>
      <li>Restore your gut microbiome balance</li>
      <li>Boost digestion and nutrient absorption</li>
      <li>Enhance immune system function</li>
      <li>Increase energy levels naturally</li>
    </ul>
  `;
  
  return generateBaseEmail({
    ...data,
    ctaText: "Balance Your Gut Health",
    ctaColor: data.ctaColor || "#2ecc71"
  }, customContent);
}

export function generateProdentimEmailContent(data) {
  const customContent = `
    <p>Thank you for completing the Prodentim Quiz! Your score of ${data.score}/${data.total} 
    shows you understand the importance of oral health.</p>
    
    <p>Prodentim's probiotic formula is designed to:</p>
    <ul>
      <li>Support healthy teeth and gums</li>
      <li>Balance oral microbiome</li>
      <li>Freshen breath naturally</li>
      <li>Strengthen tooth enamel</li>
    </ul>
  `;
  
  return generateBaseEmail({
    ...data,
    ctaText: "Improve Your Oral Health",
    ctaColor: data.ctaColor || "#3498db"
  }, customContent);
}

export function generateNervoviveEmailContent(data) {
  const customContent = `
    <p>Your NervoVive Quiz results are ready! Scoring ${data.score}/${data.total} 
    indicates you're ready to support your nerve health.</p>
    
    <p>NervoVive provides targeted support to:</p>
    <ul>
      <li>Relieve nerve discomfort</li>
      <li>Support nerve regeneration</li>
      <li>Reduce tingling and numbness</li>
      <li>Promote healthy nerve function</li>
    </ul>
  `;
  
  return generateBaseEmail({
    ...data,
    ctaText: "Support Your Nerve Health",
    ctaColor: data.ctaColor || "#3498db"
  }, customContent);
}

export function generateTotalControl24EmailContent(data) {
  const customContent = `
    <p>Congratulations on completing the Total Control 24 Quiz! With a score of ${data.score}/${data.total}, 
    you're ready to take control of your health.</p>
    
    <p>Total Control 24 helps you:</p>
    <ul>
      <li>Manage blood sugar levels</li>
      <li>Boost natural insulin sensitivity</li>
      <li>Reduce sugar cravings</li>
      <li>Support healthy weight management</li>
    </ul>
  `;
  
  return generateBaseEmail({
    ...data,
    ctaText: "Take Control Now",
    ctaColor: data.ctaColor || "#3498db"
  }, customContent);
}

export function generateGlucosShieldEmailContent(data) {
  const customContent = `
    <p>Your GlucoShield Quiz results are here! Scoring ${data.score}/${data.total} 
    shows you understand the importance of blood sugar management.</p>
    
    <p>GlucoShield is scientifically formulated to:</p>
    <ul>
      <li>Support healthy glucose metabolism</li>
      <li>Enhance insulin sensitivity</li>
      <li>Protect against oxidative stress</li>
      <li>Promote cardiovascular health</li>
    </ul>
  `;
  
  return generateBaseEmail({
    ...data,
    ctaText: "Support Healthy Glucose Levels",
    ctaColor: data.ctaColor || "#3498db"
  }, customContent);
}

export function generateProstadineEmailContent(data) {
  const customContent = `
    <p>Thank you for completing the Prostadine Quiz! Your score of ${data.score}/${data.total} 
    indicates you're ready to support your prostate health.</p>
    
    <p>Prostadine provides comprehensive support to:</p>
    <ul>
      <li>Maintain prostate health</li>
      <li>Support urinary function</li>
      <li>Reduce nighttime bathroom visits</li>
      <li>Promote healthy inflammation response</li>
    </ul>
  `;
  
  return generateBaseEmail({
    ...data,
    ctaText: "Support Prostate Health",
    ctaColor: data.ctaColor || "#3498db"
  }, customContent);
}