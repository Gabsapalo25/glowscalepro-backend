import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';

// Caminho do arquivo com o status de follow-up por lead
const statusFile = path.resolve('data/emailFollowupStatus.json');

// 🔄 Carrega o arquivo JSON
function loadStatusData() {
  try {
    const content = fs.readFileSync(statusFile, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    logger.error('❌ Erro ao carregar emailFollowupStatus.json');
    return {};
  }
}

// 💾 Salva o status atualizado
function saveStatusData(data) {
  fs.writeFileSync(statusFile, JSON.stringify(data, null, 2));
}

// 🧠 Função principal
async function processFollowups() {
  logger.info('🔍 Iniciando verificação de follow-ups...');

  const data = loadStatusData();
  let totalSent = 0;

  for (const email in data) {
    const user = data[email];

    for (const product in user) {
      const record = user[product];

      const sentAt = DateTime.fromISO(record.sent_at);
      const now = DateTime.utc();
      const diffInHours = now.diff(sentAt, 'hours').hours;

      if (record.status === 'sent' && diffInHours >= 48 && diffInHours < 72) {
        logger.info(`⏰ Lead ${email} deve receber lembrete para produto "${product}" (48h sem abrir o Email 1).`);
        try {
          await emailService.sendReminderEmail(email, product);
          record.status = 'reminder_sent';
          record.reminder_sent_at = now.toISO();
          totalSent++;
          logger.info(`✅ Lembrete enviado para ${email}`);
        } catch (err) {
          logger.error(`❌ Falha ao enviar lembrete para ${email}`, { product, error: err.message });
        }
      }

      if (record.status === 'reminder_sent' && diffInHours >= 72) {
        logger.info(`⚠️ Última tentativa: enviar Email 3 para ${email} (produto: ${product}) após 72h sem abertura.`);
        try {
          await emailService.sendFinalReminderEmail(email, product);
          record.status = 'final_sent';
          record.final_sent_at = now.toISO();
          totalSent++;
          logger.info(`✅ Email 3 (final) enviado para ${email}`);
        } catch (err) {
          logger.error(`❌ Erro ao enviar Email 3 para ${email}`, { product, error: err.message });
        }
      }
    }
  }

  saveStatusData(data);
  logger.info(`✅ Verificação concluída. Lembretes enviados: ${totalSent}`);
}

// 🚀 Executa a função principal
processFollowups();
