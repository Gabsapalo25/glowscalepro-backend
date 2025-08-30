import { quizzesConfig } from "../../config/quizzesConfig.js";

export function generateEmailTemplate(quizId, leadData) {
  const quiz = quizzesConfig[quizId];

  if (!quiz) {
    throw new Error(`Quiz config not found for ID: ${quizId}`);
  }

  // Pega o template base do quiz
  let emailTemplate = quiz.emailTemplate;

  // Substitui placeholders pelos dados do lead
  if (leadData) {
    Object.keys(leadData).forEach((key) => {
      const placeholder = `{{${key}}}`;
      emailTemplate = emailTemplate.replace(
        new RegExp(placeholder, "g"),
        leadData[key]
      );
    });
  }

  return emailTemplate;
}
