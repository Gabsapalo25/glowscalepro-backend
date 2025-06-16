import pkg from 'express-validator';
const { body, validationResult } = pkg;

// Lista de IDs de quizzes válidos
const validQuizIds = [
  'nervovive', 
  'tokmate', 
  'primebiome', 
  'totalcontrol24', 
  'glucoshield', 
  'prostadine'
];

export const validateQuizPayload = [
  // Validação do nome
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .escape(),
  
  // Validação do email
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  
  // Validação da pontuação
  body('score')
    .isInt({ min: 0 })
    .withMessage('Pontuação deve ser um número inteiro não negativo'),
  
  // Validação do total de perguntas
  body('total')
    .isInt({ min: 1 })
    .withMessage('Total de perguntas deve ser pelo menos 1'),
  
  // Validação do ID do quiz (CAMPO CRÍTICO)
  body('quizId')
    .notEmpty()
    .withMessage('ID do quiz é obrigatório')
    .isString()
    .withMessage('ID do quiz deve ser texto')
    .isIn(validQuizIds)
    .withMessage('ID do quiz inválido'),
  
  // Validação opcional do código do país
  body('countryCode')
    .optional()
    .isString()
    .withMessage('Código de país deve ser texto'),
  
  // Validação opcional do WhatsApp
  body('whatsapp')
    .optional()
    .isString()
    .withMessage('WhatsApp deve ser texto'),
  
  // Validação opcional da resposta Q4
  body('q4')
    .optional()
    .isString()
    .withMessage('Resposta Q4 deve ser texto'),
  
  // Validação do consentimento
  body('consent')
    .isBoolean()
    .withMessage('Consentimento deve ser verdadeiro ou falso'),

  // Middleware de tratamento de erros
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: errorMessages 
      });
    }
    next();
  }
];