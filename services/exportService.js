// services/exportService.js
import axios from "axios";
import { Parser } from "json2csv";
import logger from "../utils/logger.js";

const ACTIVE_CAMPAIGN_API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
const ACTIVE_CAMPAIGN_API_URL = process.env.ACTIVE_CAMPAIGN_API_URL;

const headers = {
  "Api-Token": ACTIVE_CAMPAIGN_API_KEY,
  "Content-Type": "application/json"
};

export async function exportLeadsByTag(tagId) {
  const allContacts = [];
  let offset = 0;
  const limit = 100;

  try {
    while (true) {
      const response = await axios.get(`${ACTIVE_CAMPAIGN_API_URL}/api/3/contacts`, {
        headers,
        params: {
          tagid: tagId,
          limit,
          offset
        }
      });

      const contacts = response.data.contacts;
      if (!contacts || contacts.length === 0) break;

      allContacts.push(...contacts);
      offset += limit;
    }

    logger.info(`📤 Exportados ${allContacts.length} contatos com tag ID: ${tagId}`);

    const formatted = allContacts.map(c => ({
      Name: c.firstName || "",
      Email: c.email,
      CreatedAt: c.created_timestamp || "",
      Tags: (c.tags || []).join(", ")
    }));

    const parser = new Parser();
    return parser.parse(formatted);

  } catch (error) {
    logger.error(`❌ Erro ao exportar contatos da tag ${tagId}: ${error.message}`);
    throw new Error("Erro ao exportar contatos");
  }
}
