import dotenv from 'dotenv';

dotenv.config();

// Define as origens permitidas, incluindo o frontend principal e fallback para desenvolvimento
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://glowscalepro-2.funnels.mastertools.com',
  process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined
].filter(Boolean);

export const corsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem origem (e.g., ferramentas como Postman) em desenvolvimento
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Verifica se a origem está na lista de permitidas
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origem ${origin} não permitida pelo CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN'],
  credentials: true,
  maxAge: 86400 // Cache de preflight por 24 horas
};