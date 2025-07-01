const tagMappings = {
  // 🔗 quizId → chave de template/email
  quizIdToTemplateKey: {
    tokmate: "tokmate",
    nervovive: "nervovive",
    primebiome: "primebiome",
    prodentim: "prodentim",
    glucoshield: "glucoshield",
    prostadine: "prostadine",
    totalcontrol24: "totalcontrol24",
  },

  // 🔗 quizId → Tag do produto
  quizIdToTagId: {
    tokmate: 10,
    nervovive: 1,
    primebiome: 11,
    prodentim: 12,
    glucoshield: 13,
    prostadine: 14,
    totalcontrol24: 15,
  },

  // 🔗 Nível de consciência → tagId
  awarenessLevelToTagId: {
    cold: 17, // GlowscalePro_level1
    warm: 18, // GlowscalePro_level2
    hot: 19,  // GlowscalePro_level3
  },

  // 🔗 Nível de consciência → nome
  awarenessLevelToTagName: {
    cold: "GlowscalePro_level1",
    warm: "GlowscalePro_level2",
    hot: "GlowscalePro_level3",
  },

  // 🧠 Score absoluto → faixa de consciência
  // score 0-4 = cold, 5-8 = warm, 9-12 = hot
  scoreToAwarenessLevel: {
    cold: { min: 0, max: 4 },
    warm: { min: 5, max: 8 },
    hot:  { min: 9, max: 12 }
  },

  // 📋 ID da lista única de leads
  MASTER_LIST_ID: 5,

  // 🚫 Tags especiais de descadastro
  specialTags: {
    unsubscribeRequested: {
      id: 16,
      name: "descadastro-solicitado"
    },
    unsubscribeConfirmed: {
      id: 20,
      name: "descadastro confirmado"
    }
  }
};

export default tagMappings;
