import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const ACTIVE_CAMPAIGN_API_URL = process.env.ACTIVE_CAMPAIGN_API_URL;
const ACTIVE_CAMPAIGN_API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;

const LIST_ID = "5";
const TAG_ID_UNSUBSCRIBED = "20";

export async function checkUnsubscribedContactsAndTag() {
  try {
    const response = await axios.get(
      `${ACTIVE_CAMPAIGN_API_URL}/api/3/contactLists?list=${LIST_ID}&status=2&limit=100`,
      {
        headers: {
          "Api-Token": ACTIVE_CAMPAIGN_API_KEY,
        },
      }
    );

    const unsubscribedContacts = response.data.contactLists || [];

    for (const entry of unsubscribedContacts) {
      const contactId = entry.contact;

      // Verifica se já tem a tag de descadastro
      const tagCheck = await axios.get(
        `${ACTIVE_CAMPAIGN_API_URL}/api/3/contacts/${contactId}/contactTags`,
        {
          headers: {
            "Api-Token": ACTIVE_CAMPAIGN_API_KEY,
          },
        }
      );

      const hasUnsubTag = tagCheck.data.contactTags?.some(
        (tag) => tag.tag === TAG_ID_UNSUBSCRIBED
      );

      if (!hasUnsubTag) {
        // Aplica tag
        await axios.post(
          `${ACTIVE_CAMPAIGN_API_URL}/api/3/contactTags`,
          {
            contactTag: {
              contact: contactId,
              tag: TAG_ID_UNSUBSCRIBED,
            },
          },
          {
            headers: {
              "Api-Token": ACTIVE_CAMPAIGN_API_KEY,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`✅ Tag de descadastro aplicada ao contato ${contactId}`);
      }
    }

    return {
      success: true,
      checked: unsubscribedContacts.length,
    };
  } catch (error) {
    console.error("Erro ao verificar descadastrados:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
