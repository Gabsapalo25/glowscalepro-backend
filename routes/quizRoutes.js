const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController'); // Caminho correto?

// Rota POST (exemplo mínimo)
router.post('/submit-quiz', 
  (req, res) => {
    console.log('Dados recebidos:', req.body);
    res.json({ success: true });
  }
);

module.exports = router;