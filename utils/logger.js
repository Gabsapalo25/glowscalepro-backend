// utils/logger.js
import pino from 'pino';
import path from 'path'; // Para ajudar a encontrar o package.json
import fs from 'fs'; // Para ler o package.json
import { fileURLToPath } from 'url'; // Para __dirname em módulos ES

// Para obter __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let appVersion = 'unknown';
try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    appVersion = packageJson.version;
} catch (error) {
    // Ignora erros se package.json não puder ser lido, a versão será 'unknown'
}

const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    // Adiciona contexto base para todos os logs
    base: {
        app: 'GlowscalePro Backend',
        version: appVersion,
        env: process.env.NODE_ENV || 'development',
    },
    // Configuração do transport condicional para pino-pretty
    ...(process.env.NODE_ENV !== 'production' && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname,app,version,env', // Ignora campos que já adicionamos no formatador
                translateTime: 'SYS:HH:MM:ss Z', // Timestamp legível
                // customColors: 'info:green,warn:yellow,error:red,debug:blue', // Exemplo de cores personalizadas
                messageFormat: '[{app} v{version}] [{env}] {msg}', // Formato da mensagem
            },
        },
    }),
    // Formatador para logs em produção (JSON)
    formatters: {
        level: (label) => ({ level: label }), // Mantém o nível como string (info, error, etc.)
        log: (obj) => {
            if (process.env.NODE_ENV === 'production' && obj.time) {
                obj.timestamp = new Date(obj.time).toISOString(); // Adiciona timestamp ISO para JSON
            }
            return obj;
        }
    },
});

// Middleware para adicionar requestId (opcional, se você quiser logar IDs de requisição)
export const addRequestId = (req, res, next) => {
    req.requestId = Math.random().toString(36).substring(2, 9); // ID único curto
    // Adiciona o requestId ao contexto do logger para esta requisição
    req.log = logger.child({ requestId: req.requestId });
    next();
};

export default logger;