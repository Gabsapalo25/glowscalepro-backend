// campaigns/sendCampaign.js

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import { campaignConfig } from './campaignConfig.js';
import logger from '../utils/logger.js';

dotenv.config();

// ✅ ActiveCampaign config
const AC_BASE_URL = `${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3`;
const API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!AC_BASE_URL || !API_KEY || !ADMIN_EMAIL) {
  logger.error("❌ ActiveCampaign não está corretamente configurado no .env");
  process.exit(1);
}

const headers = {
  'Api-Token': API_KEY,
  'Content-Type': 'application/json',
};

// 🛠️ Função principal
async function sendCampaign(productKey) {
  const config = campaignConfig[productKey];

  if (!config) {
    logger.error(`❌ Produto '${productKey}' não encontrado na campaignConfig.js`);
    return;
  }

  for (let i = 0; i < config.emails.length; i++) {
    const email = config.emails[i];

    try {
      // 📨 Carrega o HTML do email a partir da subpasta do produto
      const htmlPath = path.resolve('emailTemplates', productKey, email.htmlTemplate);
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');

      // 📤 Dados para criar campanha
      const campaignData = {
        campaign: {
          name: `${config.productName} - Email ${i + 1}`,
          type: 'single',
          status: 1, // 1 = draft
          public: 'false',
          subject: email.subject,
          fromName: 'GlowScalePro',
          fromEmail: ADMIN_EMAIL,
          reply2: ADMIN_EMAIL,
          html: htmlContent,
          list: config.listId, // Deve ser um número válido
        },
      };

      // ✅ Cria a campanha
      const createResp = await axios.post(`${AC_BASE_URL}/campaigns`, campaignData, { headers });
      const campaignId = createResp.data.campaign.id;

      logger.info(`📨 Campanha criada com sucesso [ID ${campaignId}]: "${email.subject}"`);

      // 🚀 Envio imediato da campanha
      await axios.post(`${AC_BASE_URL}/campaigns/${campaignId}/send`, {
        campaign: {}
      }, { headers });

      logger.info(`✅ Campanha enviada com sucesso: "${email.subject}"`);

    } catch (err) {
      logger.error(`❌ Falha ao enviar campanha "${email.subject}": ${err.message}`, {
        stack: err.stack,
      });
    }
  }
}

// 🚀 Execução CLI
const productArg = process.argv[2];

if (!productArg) {
  console.error('❌ Você precisa informar o nome do produto. Ex:');
  console.error('   node campaigns/sendCampaign.js primebiome');
  process.exit(1);
}

sendCampaign(productArg).catch(err => {
  logger.error(`❌ Erro inesperado: ${err.message}`, { stack: err.stack });
});
