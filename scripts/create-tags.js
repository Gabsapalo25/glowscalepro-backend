require('dotenv').config();
const axios = require('axios');

const api = axios.create({
  baseURL: process.env.AC_API_URL + '/api/3',
  headers: {
    'Api-Token': process.env.AC_API_KEY,
    'Content-Type': 'application/json'
  }
});

const tagsToCreate = [
  { tag: 'nervovive_lead', description: 'Lead gerado pelo quiz NervoVive' },
  { tag: 'tokmate_lead', description: 'Lead gerado pelo quiz Tokmate' },
  { tag: 'primebiome_lead', description: 'Lead gerado pelo quiz PrimeBiome' },
  { tag: 'prodentim_lead', description: 'Lead gerado pelo quiz ProDentim' },
  { tag: 'glucoshield_lead', description: 'Lead gerado pelo quiz GlucoShield' },
  { tag: 'prostadine_lead', description: 'Lead gerado pelo quiz Prostadine' },
  { tag: 'totalcontrol24_lead', description: 'Lead gerado pelo quiz TotalControl24' }
];

async function tagExists(tagName) {
  try {
    const res = await api.get('/tags', { params: { search: tagName } });
    return res.data.tags.some(tag => tag.tag === tagName);
  } catch (err) {
    console.error('Erro ao verificar tag:', tagName, err.message);
    return false;
  }
}

async function createTag({ tag, description }) {
  const exists = await tagExists(tag);
  if (exists) {
    console.log(`✅ Tag já existe: ${tag}`);
    return;
  }

  try {
    await api.post('/tags', {
      tag: {
        tag,
        tagType: 'contact',
        description
      }
    });
    console.log(`🎉 Tag criada com sucesso: ${tag}`);
  } catch (err) {
    console.error(`❌ Erro ao criar tag ${tag}:`, err.response?.data || err.message);
  }
}

async function run() {
  for (const tagInfo of tagsToCreate) {
    await createTag(tagInfo);
  }
}

run();
