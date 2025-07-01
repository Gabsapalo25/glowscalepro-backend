// data/tagMappings.js

const tagMappings = {
  // 🔗 quizId → chave usada para selecionar o template correto
  quizIdToTemplateKey: {
    tokmate: "tokmate",
    nervovive: "nervovive",
    primebiome: "primebiome",
    prodentim: "prodentim",
    glucoshield: "glucoshield",
    prostadine: "prostadine",
    totalcontrol24: "totalcontrol24",
  },

  // 🔗 quizId → ID da tag de produto no ActiveCampaign
  quizIdToTagId: {
    tokmate: 10,
    nervovive: 1,
    primebiome: 11,
    prodentim: 12,
    glucoshield: 13,
    prostadine: 14,
    totalcontrol24: 15,
  },

  // 🔗 Nível de consciência → ID da tag correspondente
  awarenessLevelToTagId: {
    cold: 17, // GlowscalePro_Level1
    warm: 18, // GlowscalePro_Level2
    hot: 19   // GlowscalePro_Level3
  },

  // 🔗 Nível de consciência → Nome amigável
  awarenessLevelToTagName: {
    cold: "GlowscalePro_level1",
    warm: "GlowscalePro_level2",
    hot: "GlowscalePro_level3"
  },

  // 🧠 Score absoluto → classificação por faixa de pontuação
  scoreToAwarenessLevel: {
    cold: { min: 0, max: 4 },
    warm: { min: 5, max: 8 },
    hot:  { min: 9, max: 12 }
  },

  // 📋 Lista única de leads (consistente com o .env)
  MASTER_LIST_ID: parseInt(process.env.MASTER_LIST_ID || "5"),

  // 🚫 Tags especiais usadas para descadastro
  specialTags: {
    unsubscribeRequested: {
      id: parseInt(process.env.UNSUBSCRIBE_TAG_ID || "16"),
      name: "descadastro-solicitado"
    },
    unsubscribeConfirmed: {
      id: 20, // Tag manualmente mapeada
      name: "descadastro confirmado"
    }
  }
};

export default tagMappings;
