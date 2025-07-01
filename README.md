GlowscalePro Backend
Backend Node.js responsável por:

Processar resultados de quizzes
Enviar e-mails automáticos (lead + administrador)
Integrar contatos com o ActiveCampaign via API
Gerenciar descadastro de leads
🛠️ Tecnologias Utilizadas
Node.js
Express.js
Nodemailer (via SMTP Zoho)
ActiveCampaign API v3
dotenv (variáveis de ambiente)
cors (CORS protegido)
csurf (proteção CSRF)
helmet (segurança HTTP)
express-rate-limit (proteção contra abuso)
morgan (logs de requisições)
📁 Estrutura de Pastas
bash


glowscalepro-backend/
├── controllers/  
│   ├── quizController.js         # Processa submissão de quizzes  
│   └── unsubscribeController.js  # Gerencia descadastro via link  
├── routes/  
│   ├── quizRoutes.js             # Rota POST /api/send-result  
│   └── unsubscribeRoutes.js      # Rota GET /api/unsubscribe  
├── services/  
│   ├── activeCampaignService.js  # Integração com ActiveCampaign  
│   ├── emailService.js           # Envio de e-mails via Nodemailer  
│   └── templates/  
│       └── templates.js          # Templates HTML para e-mails  
├── data/  
│   └── tagMappings.js            # Mapeamento de quizId → templateKey e TAGs  
├── .env.example                  # Modelo de variáveis de ambiente  
├── package.json  
└── index.js                      # Ponto de entrada da aplicação  
🧪 Funcionalidades Implementadas
Recebimento de dados de quizzes via API segura (CSRF protegida)
Envio de e-mails personalizados ao lead e ao administrador
Integração com ActiveCampaign :
Criação/atualização de contatos
Aplicação de TAGs por produto (quizId) e nível de consciência (awarenessLevel)
Sistema de descadastro funcional :
Link no e-mail redireciona para /api/unsubscribe?email=...
Aplica TAG descadastro-solicitado no ActiveCampaign