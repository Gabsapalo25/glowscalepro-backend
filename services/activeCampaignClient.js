// services/activeCampaignClient.js
import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
const API_URL = `${process.env.ACTIVE_CAMPAIGN_API_URL}/api/3`;

if (!API_KEY || !API_URL) {
  throw new Error("❌ ACTIVE_CAMPAIGN_API_KEY ou ACTIVE_CAMPAIGN_API_URL não está definido no .env");
}

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Api-Token': API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Log de erro mais informativo
client.interceptors.response.use(
  res => res,
  error => {
    logger.error("❌ ActiveCampaign API Error:", {
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default client;
