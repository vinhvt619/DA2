import { cleanAiText } from "./aiDataSanitizer.js";

const ACTIONS = new Set(["start", "answer", "finish"]);
const LEVELS = new Set(["intern", "junior", "middle", "senior"]);
const INTERVIEW_TYPES = new Set([
  "general",
  "behavioral",
  "technical",
  "mixed",
]);

const clampNumber = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, min), max)
    : fallback;
};

const cleanStringList = (items, maxItems = 4) =>
  (Array.isArray(items) ? items : [])
    .slice(0, maxItems)
    .map((item) => cleanAiText(item, 400))
    .filter(Boolean);

export const sanitizeInterviewRequest = (source = {}) => {
  const settings = source.settings || {};
  const messages = (Array.isArray(source.messages) ? source.messages : [])
    .slice(-26)
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      content: cleanAiText(message?.content, 1200),
    }))
    .filter((message) => message.content);

  return {
    action: ACTIONS.has(source.action) ? source.action : "answer",
    settings: {
      role: cleanAiText(settings.role, 160),
      level: LEVELS.has(settings.level) ? settings.level : "junior",
      type: INTERVIEW_TYPES.has(settings.type) ? settings.type : "mixed",
      totalQuestions: clampNumber(settings.totalQuestions, 3, 12, 5),
    },
    messages,
    answeredQuestions: messages.filter((message) => message.role === "user")
      .length,
  };
};

export const cleanInterviewResult = (result = {}, totalQuestions = 5) => {
  const isComplete = Boolean(result.isComplete);

  return {
    message: cleanAiText(result.message, 1600),
    questionNumber: clampNumber(
      result.questionNumber,
      1,
      totalQuestions,
      1,
    ),
    isComplete,
    feedback: {
      score: clampNumber(result.feedback?.score, 0, 100, 0),
      strengths: cleanStringList(result.feedback?.strengths),
      improvements: cleanStringList(result.feedback?.improvements),
    },
    finalSummary: {
      overallScore: isComplete
        ? clampNumber(result.finalSummary?.overallScore, 0, 100, 0)
        : 0,
      strengths: isComplete
        ? cleanStringList(result.finalSummary?.strengths, 6)
        : [],
      improvements: isComplete
        ? cleanStringList(result.finalSummary?.improvements, 6)
        : [],
      recommendation: isComplete
        ? cleanAiText(result.finalSummary?.recommendation, 1000)
        : "",
    },
  };
};
