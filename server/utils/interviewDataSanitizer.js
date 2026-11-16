import {
  getInterviewPlan,
  INTERVIEW_FORMATS,
  INTERVIEW_LEVELS,
  INTERVIEW_QUESTION_COUNTS,
  INTERVIEW_RATING_SCALE,
} from "../../shared/interviewPractice.js";
import { cleanAiText } from "./aiDataSanitizer.js";

const cleanStringList = (items, maxItems = 4) =>
  (Array.isArray(items) ? items : [])
    .slice(0, maxItems)
    .map((item) => cleanAiText(item, 400))
    .filter(Boolean);

export function sanitizeInterviewRequest(source) {
  const { action, settings, messages } = source || {};
  const role = cleanAiText(settings?.role, 160);
  const level = settings?.level;
  const type = settings?.type;
  const totalQuestions = settings?.totalQuestions;
  if (!["start", "answer", "finish"].includes(action) || !role ||
    !Object.hasOwn(INTERVIEW_LEVELS, level) || !Object.hasOwn(INTERVIEW_FORMATS, type) ||
    !INTERVIEW_QUESTION_COUNTS.includes(totalQuestions) || !Array.isArray(messages) ||
    messages.length > totalQuestions * 2) return null;

  const transcript = messages.map((message, index) => {
    const expectedRole = index % 2 === 0 ? "assistant" : "user";
    if (message?.role !== expectedRole) return null;
    const content = cleanAiText(message.content, expectedRole === "assistant" ? 1600 : 1200);
    return content ? { role: expectedRole, content } : null;
  });
  if (transcript.some((message) => !message)) return null;
  if (action === "start" && transcript.length !== 0) return null;
  if (action === "answer" && (!transcript.length || transcript.length % 2 !== 0)) return null;
  if (action === "finish" && (transcript.length < 3 || transcript.length % 2 !== 1)) return null;

  return { action, settings: { role, level, type, totalQuestions }, messages: transcript };
}

export function prepareInterviewTurn({ action, settings, messages }) {
  const plan = getInterviewPlan(settings.type, settings.totalQuestions);
  const answeredQuestions = Math.floor(messages.length / 2);
  const current = action === "answer" ? plan[answeredQuestions - 1] : null;
  const next = action !== "finish" ? plan[answeredQuestions] : null;
  const answered = Array.from({ length: answeredQuestions }, (_, index) => ({
    ...plan[index],
    question: messages[index * 2].content,
    answer: messages[index * 2 + 1].content,
  }));
  return {
    action,
    settings,
    answeredQuestions,
    current,
    next,
    questionNumber: next ? answeredQuestions + 1 : answeredQuestions,
    shouldComplete: !next,
    input: {
      action,
      role: settings.role,
      level: INTERVIEW_LEVELS[settings.level],
      answered,
      evaluation: current ? { ...current, criteria: INTERVIEW_FORMATS[current.kind].criteria } : null,
      nextQuestion: next ? {
        ...next,
        guidance: INTERVIEW_FORMATS[next.kind].questionGuidance,
      } : null,
      ratingScale: INTERVIEW_RATING_SCALE,
      needsSummary: !next,
    },
  };
}

export function cleanInterviewResult(result, turn) {
  if (!result || typeof result !== "object" || Array.isArray(result)) return null;
  let feedback = null;
  if (turn.current) {
    const ratings = result?.ratings;
    const criteria = INTERVIEW_FORMATS[turn.current.kind].criteria;
    if (!Array.isArray(ratings) || ratings.length !== criteria.length) return null;
    const assessment = criteria.map(({ id, label }) => {
      const rating = ratings.find((item) => item?.criterionId === id);
      const explanation = cleanAiText(rating?.explanation, 400);
      if (!Number.isInteger(rating?.rating) || rating.rating < 0 || rating.rating > 4 || !explanation) return null;
      return { id, label, rating: rating.rating, explanation };
    });
    if (assessment.some((item) => !item)) return null;
    feedback = {
      kind: turn.current.kind,
      focus: turn.current.focus,
      score: Math.round(100 * assessment.reduce((sum, item) => sum + item.rating, 0) / (4 * assessment.length)),
      criteria: assessment,
      strengths: cleanStringList(result.strengths),
      improvements: cleanStringList(result.improvements),
    };
  }

  const message = turn.next ? cleanAiText(result?.question, 1600) : "Buổi luyện tập đã kết thúc. Bạn có thể xem kết quả và nhận xét từng câu.";
  if (!message) return null;
  if (turn.next && turn.input.answered.some(({ question }) => question.toLowerCase() === message.toLowerCase())) return null;

  const finalSummary = turn.shouldComplete ? {
    strengths: cleanStringList(result.summaryStrengths, 6),
    improvements: cleanStringList(result.summaryImprovements, 6),
    recommendation: cleanAiText(result.recommendation, 1000),
  } : null;
  if (finalSummary && (!finalSummary.improvements.length || !finalSummary.recommendation)) return null;
  return {
    message,
    questionNumber: turn.questionNumber,
    questionKind: turn.next?.kind ?? null,
    questionFocus: turn.next?.focus ?? null,
    isComplete: turn.shouldComplete,
    answeredQuestions: turn.answeredQuestions,
    totalQuestions: turn.settings.totalQuestions,
    feedback,
    finalSummary,
  };
}
