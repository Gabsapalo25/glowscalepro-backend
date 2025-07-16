import axios from "axios";
import { Parser } from "json2csv";
import dotenv from "dotenv";

dotenv.config();

const ACTIVE_CAMPAIGN_API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
const ACTIVE_CAMPAIGN_API_URL = process.env.ACTIVE_CAMPAIGN_API_URL;

const headers = {
  "Api-Token": ACTIVE_CAMPAIGN_API_KEY,
  "Content-Type": "application/json"
};

// ✅ Corrigido: função nomeada conforme usada no quizController.js
export async function exportLeadsByTag(tagId) {
  const allContacts = [];
  let offset = 0;
  const limit = 100;

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

  const formatted = allContacts.map(c => ({
    Name: c.firstName || "",
    Email: c.email,
    CreatedAt: c.created_timestamp,
    Tags: (c.tags || []).join(", ")
  }));

  const parser = new Parser();
  return parser.parse(formatted);
}
