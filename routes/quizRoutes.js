import express from 'express';
import { sendResult, getCsrfToken } from '../controllers/quizController.js';

const router = express.Router();

router.post('/submit-quiz', sendResult);
router.get('/csrf-token', getCsrfToken);

export default router;