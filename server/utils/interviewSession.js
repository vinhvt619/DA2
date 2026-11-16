import { cleanAiText } from "./aiDataSanitizer.js";
import { isJobUnavailable } from "./jobAvailability.js";
import { createPracticeQuestions, PRACTICE_MODES, PRACTICE_PRESETS } from "../../shared/interviewScenarios.js";
import { INTERVIEW_FORMATS, INTERVIEW_LEVELS, INTERVIEW_QUESTION_COUNTS, summarizeInterviewScores } from "../../shared/interviewPractice.js";
import { createHash } from "node:crypto";

export class PracticeError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const cleanPracticeText = (value, max = 1200) => cleanAiText(value, max)
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email đã ẩn]")
  .replace(/(?<!\d)(?:\+84|0)(?:[ .-]?\d){8,10}(?!\d)/g, "[số điện thoại đã ẩn]");

export const practiceContextVersion = (context) => createHash("sha256").update(JSON.stringify(context)).digest("hex");

export function normalizeGeneratedPracticeQuestions(result, questions) {
  if (!Array.isArray(result?.questions) || result.questions.length !== questions.length) return null;
  const seen = new Set();
  const normalized = questions.map((question) => {
    const candidate = result.questions.find((item) => item?.id === question.id);
    const prompt = cleanPracticeText(candidate?.prompt, 850);
    const key = prompt.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    if (candidate?.kind !== question.kind || candidate?.competencyId !== question.competency.id ||
      prompt.length < 20 || !prompt.includes("?") || seen.has(key)) return null;
    seen.add(key);
    return { ...question, prompt };
  });
  return normalized.every(Boolean) ? normalized : null;
}

function jobTrack(role) {
  const title = role.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (/front[\s-]?end/.test(title)) return "frontend";
  if (/back[\s-]?end/.test(title)) return "backend";
  if (/cham soc khach hang|customer (?:support|service)/.test(title)) return "support";
  return null;
}

export function practiceContext(source, job) {
  if (source?.kind === "preset" && Object.hasOwn(PRACTICE_PRESETS, source.preset)) {
    const preset = PRACTICE_PRESETS[source.preset];
    return {
      kind: "preset", track: source.preset, role: preset.role,
      competencies: preset.competencies.map((label, index) => ({ id: "c" + (index + 1), label, excerpt: "" })),
    };
  }
  if (source?.kind !== "job" && source?.kind !== "manual") throw new PracticeError("Hãy chọn tin tuyển dụng, mô tả công việc hoặc vị trí mẫu.");
  if (source.kind === "job" && isJobUnavailable(job)) throw new PracticeError("Tin tuyển dụng này không còn mở. Hãy chọn vị trí mẫu hoặc nhập mô tả khác.", 410);
  const role = cleanPracticeText(source.kind === "job" ? job.title : source.role, 160);
  const descriptions = source.kind === "job"
    ? [...(Array.isArray(job.requirements) ? job.requirements : []), String(job.description || "").slice(0, 9000)]
    : [String(source.description || "").slice(0, 6000)];
  const lines = descriptions.flatMap((entry) => String(entry).split(/\r?\n|<\/(?:li|p|div)>|<br\s*\/?>|[•;]|(?<=[.!?])\s+(?=\p{Lu})/iu))
    .map((entry) => cleanPracticeText(entry, 350).replace(/^(?:[-–—*]\s+|\d+[.)]\s+)/, ""))
    .filter((entry) => entry.length >= 8);
  const competencies = [...new Set(lines)].slice(0, 5).map((excerpt, index) => ({
    id: "c" + (index + 1), label: excerpt.slice(0, 160), excerpt,
  }));
  if (!role || !competencies.length) throw new PracticeError("Hãy nhập tên vị trí và ít nhất một yêu cầu công việc cụ thể hoặc chọn vị trí mẫu.");
  return {
    kind: source.kind, role, track: jobTrack(role), competencies,
    ...(source.kind === "job" ? { jobId: String(job._id), company: cleanPracticeText(job.company, 150) } : {}),
  };
}

export function createPracticeState(settings, context, selectedIds) {
  if (!Object.hasOwn(INTERVIEW_LEVELS, settings?.level) ||
    !Object.hasOwn(INTERVIEW_FORMATS, settings?.type) ||
    !Object.hasOwn(PRACTICE_MODES, settings?.mode) ||
    !INTERVIEW_QUESTION_COUNTS.includes(settings?.totalQuestions)) throw new PracticeError("Thiết lập buổi luyện không hợp lệ.");
  const competencies = context.competencies.filter(({ id }) => Array.isArray(selectedIds) && selectedIds.includes(id));
  if (!competencies.length) throw new PracticeError("Hãy xác nhận ít nhất một yêu cầu để luyện.");
  const snapshot = { ...context, competencies };
  const config = { level: settings.level, type: settings.type, mode: settings.mode, totalQuestions: settings.totalQuestions };
  return {
    context: snapshot, settings: config, status: "active", index: 0, questionSource: "template",
    questions: createPracticeQuestions(config, snapshot).map((question) => ({ ...question, status: "unanswered", attempts: [] })),
  };
}

export function publicPracticeSession(doc, now = Date.now()) {
  const { state } = doc;
  const active = state.status === "active";
  const reveal = !active || state.settings.mode === "guided";
  const questions = state.questions.map((question, index) => {
    const { criteria, prompt, attempts, ...rest } = question;
    if (active && index > state.index) return { id: rest.id, number: rest.number, kind: rest.kind, status: rest.status };
    return {
      ...rest, prompt,
      criteria: criteria.map(({ id, label, description }) => ({ id, label, description })),
      attempts: attempts.map(({ feedback, ...attempt }) => ({ ...attempt, ...(reveal && feedback ? { feedback } : {}) })),
    };
  });
  const originalReviews = state.questions.flatMap((question) => question.attempts[0]?.feedback || []);
  const covered = new Set(state.questions.filter((question) => question.attempts[0]?.feedback).map((question) => question.competency.id));
  return {
    id: String(doc._id), revision: doc.revision, expiresAt: doc.expiresAt,
    busy: Boolean(doc.grading && new Date(doc.grading.until).getTime() > now),
    context: state.context, settings: state.settings, status: state.status, index: state.index, questions,
    questionSource: state.questionSource,
    ...(reveal ? { scores: summarizeInterviewScores(originalReviews), coverage: covered.size } : {}),
  };
}

function advance(state) {
  state.index += 1;
  if (state.index === state.questions.length) state.status = "complete";
}

export function applyPracticeAction(state, input) {
  const next = structuredClone(state);
  const { action, questionId } = input;
  const active = next.status === "active";
  const question = active ? next.questions[next.index] : next.questions.find((item) => item.id === questionId);
  const answer = cleanPracticeText(input.answer).slice(0, 1200);
  if (active && action === "finish") {
    next.status = "ended_early";
    return { state: next, grade: null };
  }
  if (!question || question.id !== questionId) throw new PracticeError("Câu hỏi đã thay đổi. Hãy tải trạng thái mới.", 409);
  const attempt = question.attempts.at(-1);
  if (active && action === "defer" && question.status === "pending") {
    advance(next);
    return { state: next, grade: null };
  }
  if (active && action === "skip" && ["unanswered", "clarifying"].includes(question.status)) {
    question.status = "skipped";
    advance(next);
    return { state: next, grade: null };
  }
  if (active && action === "answer" && question.status === "unanswered" && answer) {
    question.attempts.push({ answer });
    question.status = "pending";
  } else if (active && action === "clarify" && question.status === "clarifying" && answer) {
    attempt.clarification = answer;
    question.status = "pending";
  } else if (active && action === "finish_question" && question.status === "clarifying") {
    attempt.clarification = "";
    question.status = "pending";
  } else if (!active && action === "practice_again" && question.attempts[0]?.feedback && attempt?.feedback && answer) {
    if (question.attempts.length >= 6) throw new PracticeError("Câu này đã có 5 lượt luyện lại. Hãy bắt đầu buổi mới nếu muốn tiếp tục.");
    question.attempts.push({ answer });
  } else if (action !== "retry" || (active && question.status !== "pending") || !attempt || attempt.feedback || (!active && question.status === "skipped")) {
    throw new PracticeError("Thao tác chưa phù hợp với trạng thái câu hỏi. Hãy kiểm tra câu trả lời và thử lại.", 409);
  }
  return { state: next, grade: { questionId, attemptIndex: question.attempts.length - 1, allowFollowUp: active && !question.attempts.at(-1).followUp } };
}

export function normalizePracticeGrade(raw, question, attempt, allowFollowUp) {
  if (!raw || typeof raw !== "object") return null;
  const followUp = cleanAiText(raw.followUp, 500);
  if (allowFollowUp && followUp && Array.isArray(raw.ratings) && !raw.ratings.length) return { followUp };
  if (!Array.isArray(raw.ratings) || raw.ratings.length !== question.criteria.length) return null;
  const evidenceSources = [attempt.answer, attempt.clarification].filter(Boolean);
  const criteria = question.criteria.map(({ id, label }) => {
    const rating = raw.ratings.find((item) => item?.criterionId === id);
    const explanation = cleanAiText(rating?.explanation, 400);
    const requestedEvidence = cleanAiText(rating?.evidence, 220);
    const source = evidenceSources.find((text) => text.toLowerCase().includes(requestedEvidence.toLowerCase()));
    const index = source?.toLowerCase().indexOf(requestedEvidence.toLowerCase());
    const evidence = source && requestedEvidence ? source.slice(index, index + requestedEvidence.length) : "";
    if (!Number.isInteger(rating?.rating) || rating.rating < 0 || rating.rating > 4 || !explanation) return null;
    if (requestedEvidence && !evidence) return null;
    if (rating.rating > 0 && !evidence) return null;
    return { id, label, rating: rating.rating, explanation, evidence };
  });
  const improvement = cleanAiText(raw.improvement, 500);
  if (criteria.some((item) => !item) || !improvement) return null;
  const score = Math.round(100 * criteria.reduce((sum, item) => sum + item.rating, 0) / (4 * criteria.length));
  return { feedback: { kind: question.kind, focus: question.focus, score, criteria, improvement } };
}

export function applyPracticeGrade(state, target, result) {
  const next = structuredClone(state);
  const question = next.questions.find(({ id }) => id === target.questionId);
  const attempt = question.attempts[target.attemptIndex];
  if (result.followUp) {
    attempt.followUp = result.followUp;
    question.status = "clarifying";
  } else {
    attempt.feedback = result.feedback;
    if (target.attemptIndex === 0) {
      question.status = "graded";
      if (next.status === "active") advance(next);
    }
  }
  return next;
}
