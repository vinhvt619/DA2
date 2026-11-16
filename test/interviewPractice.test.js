import assert from "node:assert/strict";
import test from "node:test";
import { getInterviewPlan, summarizeInterviewScores } from "../shared/interviewPractice.js";
import { cleanInterviewResult, prepareInterviewTurn, sanitizeInterviewRequest } from "../server/utils/interviewDataSanitizer.js";

const settings = { role: "Frontend Developer", level: "intern", type: "mixed", totalQuestions: 5 };
const firstPair = [
  { role: "assistant", content: "Kinh nghiệm nào chuẩn bị cho bạn tốt nhất?" },
  { role: "user", content: "Tôi đã làm trang danh sách cho một dự án nhóm." },
];
const firstRatings = [
  { criterionId: "relevance", rating: 4, explanation: "Dự án có trang danh sách." },
  { criterionId: "evidence", rating: 2, explanation: "Chưa nêu phần việc cá nhân." },
  { criterionId: "clarity", rating: 3, explanation: "Trả lời trực tiếp bằng ví dụ." },
];

test("mixed plans have three distinct phases and the exact selected length", () => {
  for (const [total, counts] of [[5, [1, 2, 2]], [8, [2, 3, 3]], [12, [2, 5, 5]]]) {
    assert.deepEqual(getInterviewPlan("mixed", total).map(({ kind }) => kind), [
      ...Array(counts[0]).fill("general"),
      ...Array(counts[1]).fill("technical"),
      ...Array(counts[2]).fill("behavioral"),
    ]);
  }
  for (const type of ["general", "technical", "behavioral"]) {
    const plan = getInterviewPlan(type, 12);
    assert.ok(plan.every(({ kind }) => kind === type));
    assert.equal(new Set(plan.map(({ focus }) => focus)).size, 12);
  }
});

test("turn validation rejects invalid settings and transcripts before spending AI quota", () => {
  for (const body of [
    { action: "start", settings: { ...settings, totalQuestions: 4 }, messages: [] },
    { action: "start", settings: { ...settings, type: "constructor" }, messages: [] },
    { action: "start", settings, messages: firstPair },
    { action: "answer", settings, messages: [firstPair[1]] },
    { action: "answer", settings, messages: [firstPair[0], { ...firstPair[1], content: " " }] },
    { action: "finish", settings, messages: [firstPair[0]] },
  ]) assert.equal(sanitizeInterviewRequest(body), null);
});

test("scoring uses the preceding question's criteria and progression ignores model flags", () => {
  const turn = prepareInterviewTurn(sanitizeInterviewRequest({ action: "answer", settings, messages: firstPair }));
  assert.equal(turn.input.evaluation.kind, "general");
  assert.equal(turn.input.nextQuestion.kind, "technical");
  assert.match(turn.input.level.expectation, /dự án cá nhân/);
  const model = {
    question: "Bạn kiểm tra nguyên nhân trang tải chậm thế nào?",
    ratings: firstRatings,
    isComplete: true,
    questionNumber: 12,
    overallScore: 100,
  };
  const result = cleanInterviewResult(model, turn);
  assert.equal(result.isComplete, false);
  assert.equal(result.questionNumber, 2);
  assert.equal(result.feedback.score, 75);
  assert.equal(result.feedback.criteria[0].label, "Liên hệ với vị trí");
  assert.equal(result.finalSummary, null);
  assert.equal(cleanInterviewResult({ ...model, question: firstPair[0].content }, turn), null);
  assert.equal(cleanInterviewResult({ ...model, ratings: firstRatings.slice(1) }, turn), null);
  assert.equal(cleanInterviewResult({ ...model, ratings: [firstRatings[0], firstRatings[0], firstRatings[2]] }, turn), null);
  assert.equal(cleanInterviewResult({ ...model, ratings: [{ ...firstRatings[0], rating: 5 }, ...firstRatings.slice(1)] }, turn), null);
});

test("completion after the last answer and early finish report only answered questions", () => {
  const pendingQuestion = { role: "assistant", content: "Câu hỏi chưa trả lời?" };
  const early = prepareInterviewTurn(sanitizeInterviewRequest({ action: "finish", settings, messages: [...firstPair, pendingQuestion] }));
  assert.equal(early.input.answered.length, 1);
  assert.equal(early.input.nextQuestion, null);
  const summary = { summaryImprovements: ["Nêu rõ vai trò cá nhân."], recommendation: "Luyện lại với một ví dụ cụ thể." };
  assert.equal(cleanInterviewResult(summary, early).answeredQuestions, 1);
  assert.equal(cleanInterviewResult(summary, early).feedback, null);
  assert.equal(cleanInterviewResult({}, early), null);

  const final = prepareInterviewTurn(sanitizeInterviewRequest({
    action: "answer", settings, messages: Array.from({ length: 5 }, () => firstPair).flat(),
  }));
  assert.equal(final.shouldComplete, true);
  assert.equal(final.questionNumber, 5);
  assert.equal(final.current.kind, "behavioral");
  assert.equal(final.input.nextQuestion, null);
  assert.deepEqual(summarizeInterviewScores([
    { kind: "general", score: 75 }, { kind: "technical", score: 50 }, { kind: "technical", score: 80 },
  ]), {
    overallScore: 68,
    byKind: [{ kind: "general", count: 1, score: 75 }, { kind: "technical", count: 2, score: 65 }],
  });
});
