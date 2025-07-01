// config/env.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = dotenv.config({ path: resolve(__dirname, '../.env') });

if (result.error) {
  console.error('❌ Erro ao carregar .env:', result.error);
  process.exit(1);
}

console.log('✅ Variáveis .env carregadas com sucesso!');
