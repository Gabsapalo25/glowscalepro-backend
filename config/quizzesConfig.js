import { readFileSync } from 'fs';
import { join } from 'path';
import {
  generatePrimebiomeEmailContent,
  generateTokmateEmailContent,
  generateNervoviveEmailContent,
  generateProdentimEmailContent,
  generateTotalControl24EmailContent,
  generateGlucosShieldEmailContent,
  generateProstadineEmailContent
} from '../services/templates/templates.js';

const dataPath = join(process.cwd(), 'config', 'data.json');
const rawData = readFileSync(dataPath, 'utf-8');
const configData = JSON.parse(rawData);

if (!configData.quizzesConfig || !Array.isArray(configData.quizzesConfig)) {
  throw new Error('Estrutura inválida em data.json: quizzesConfig deve ser um array');
}

const quizzesRaw = configData.quizzesConfig;

const quizzesConfigMap = quizzesRaw.reduce((map, quiz) => {
  try {
    const key = quiz.quizId.toLowerCase();
    
    if (!key) {
      throw new Error('Quiz sem quizId definido');
    }
    
    const templateMap = {
      nervovive: generateNervoviveEmailContent,
      primebiome: generatePrimebiomeEmailContent,
      tokmate: generateTokmateEmailContent,
      prodentim: generateProdentimEmailContent,
      totalcontrol24: generateTotalControl24EmailContent,
      glucoshield: generateGlucosShieldEmailContent,
      prostadine: generateProstadineEmailContent
    };

    const templateFunction = templateMap[quiz.emailTemplate] || generateTokmateEmailContent;
    
    if (!quiz.affiliateLink) {
      console.warn(`⚠️ Aviso: Quiz ${key} sem affiliateLink definido!`);
    }
    
    if (!quiz.subject) {
      console.warn(`⚠️ Aviso: Quiz ${key} sem subject definido!`);
    }
    
    map[key] = {
      quizTitle: quiz.quizTitle || `Quiz ${key}`,
      affiliateLink: quiz.affiliateLink || '',
      subject: quiz.subject || 'Your Quiz Results',
      ctaColor: quiz.ctaColor || '#3498db',
      physicalAddress: quiz.physicalAddress,
      privacyUrl: quiz.privacyUrl,
      unsubscribeUrl: quiz.unsubscribeUrl,
      activeCampaignFields: {
        listId: quiz.activeCampaignFields?.listId || 0,
        scoreFieldId: quiz.activeCampaignFields?.scoreFieldId || 0,
        q4FieldId: quiz.activeCampaignFields?.q4FieldId || 0,
        whatsappFieldId: quiz.activeCampaignFields?.whatsappFieldId || 0
      },
      leadTagId: quiz.leadTagId || null,
      generateEmailContent: templateFunction
    };

    return map;
  } catch (error) {
    console.error(`❌ Erro processando quiz: ${error.message}`);
    return map;
  }
}, {});

console.log('✅ Quizzes carregados:');
Object.keys(quizzesConfigMap).forEach(key => {
  console.log(`- ${key}: ${quizzesConfigMap[key].quizTitle} (List ID: ${quizzesConfigMap[key].activeCampaignFields.listId})`);
});

export function getById(quizId) {
  if (!quizId || typeof quizId !== 'string') {
    throw new Error('ID de quiz inválido: deve ser uma string');
  }
  
  const normalizedId = quizId.toLowerCase();
  const config = quizzesConfigMap[normalizedId];
  
  if (!config) {
    console.error(`❌ Quiz não encontrado: ${quizId}`);
    throw new Error(`Configuração não encontrada para o quiz: ${quizId}`);
  }
  
  return config;
}

export const quizzesConfig = quizzesConfigMap;