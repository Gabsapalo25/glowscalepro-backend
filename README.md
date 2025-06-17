
# GlowscalePro Backend

Backend Node.js responsável por receber os dados dos quizzes da GlowscalePro, enviar os resultados por e-mail e integrar com o ActiveCampaign.

## 🚀 Tecnologias Utilizadas

- Node.js
- Express
- Nodemailer (SMTP Zoho Mail)
- dotenv
- ActiveCampaign API
- CORS
- body-parser

## 📁 Estrutura de Pastas

```
glowscalepro-backend/
│
├── config/               # Configurações globais
├── controllers/          # Funções principais de controle (ex: enviar resultado)
├── data/                 # Armazenamento temporário, mock ou arquivos de apoio
├── middleware/           # Middlewares (ex: autenticação)
├── public/               # Recursos públicos, como favicon
├── routes/               # Definições de rotas (ex: /send-result)
├── services/             # Serviços externos (ActiveCampaign, SMTP etc)
├── test/                 # Testes
├── utils/                # Funções utilitárias
├── .env                  # Variáveis de ambiente (NÃO versionar)
├── .env.example          # Exemplo de variáveis de ambiente (versionar)
├── .gitignore
├── index.js              # Arquivo principal do servidor
└── package.json
```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` com base no `.env.example` e preencha com suas credenciais reais.

## ▶️ Executando o Projeto Localmente

```bash
npm install
npm start
```

O servidor iniciará em `http://localhost:10000` (ou a porta definida na variável `PORT`).

## 📬 Endpoints

### `POST /send-result`

Envia o resultado do quiz por e-mail e integra com o ActiveCampaign.

#### Exemplo de payload:

```json
{
  "name": "Gabriel",
  "email": "gabriel@example.com",
  "score": 7,
  "quiz": "NervoVive"
}
```

## 🔐 Segurança

- A rota `GET /` (usada para teste de disponibilidade) é protegida com a variável `DEV_API_KEY` no ambiente de desenvolvimento.

## 📦 Deploy

O projeto pode ser hospedado gratuitamente no [Render](https://render.com). Configure as variáveis de ambiente no painel da aplicação.

## 🧪 Testes

Rodar testes (se existirem):
```bash
npm test
```

---

© 2025 GlowscalePro. Todos os direitos reservados.
