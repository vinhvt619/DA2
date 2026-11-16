import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createInterviewSessionsRouter } from "../server/routes/interviewSessions.js";
import { AiRequestError } from "../server/services/aiService.js";
import { createPracticeState, normalizeGeneratedPracticeQuestions, normalizePracticeGrade, practiceContext } from "../server/utils/interviewSession.js";

const settings = { level: "junior", type: "technical", mode: "simulation", totalQuestions: 5 };
const employee = "62a000000000000000000010";
const other = "62a000000000000000000011";
const sessionId = "62a000000000000000000020";

function testStore() {
  let doc;
  function match(filter) {
    if (!doc) return false;
    return Object.entries(filter).every(([key, value]) => {
      if (key === "expiresAt") return doc.expiresAt > value.$gt;
      if (key === "grading.operationId") return doc.grading?.operationId === value;
      if (key === "state.context.jobId") return doc.state.context.jobId === value;
      return doc[key] === value;
    });
  }
  const query = (read) => ({ sort() { return this; }, async lean() { return structuredClone(read()); } });
  return {
    findOne: (filter) => query(() => match(filter) ? doc : null),
    async create(data) {
      doc = { revision: 0, operationIds: [], grading: null, ...structuredClone(data), _id: sessionId };
      return structuredClone(doc);
    },
    findOneAndUpdate: (filter, update) => query(() => {
      if (!match(filter)) return null;
      Object.assign(doc, structuredClone(update.$set));
      doc.revision += update.$inc.revision;
      if (update.$push) doc.operationIds.push(update.$push.operationIds);
      return doc;
    }),
    async deleteOne(filter) { if (match(filter)) doc = null; },
  };
}

test("technical questions use the selected job requirement and reject invented evidence", () => {
  const job = {
    _id: "62a000000000000000000009", status: "Active", approvalStatus: "Approved",
    title: "Chăm sóc khách hàng", requirements: ["Bàn giao khiếu nại", "Xử lý đơn giao trễ"],
  };
  const context = practiceContext({ kind: "job" }, job);
  const question = createPracticeState(settings, context, ["c2"]).questions[0];
  assert.equal(question.competency.excerpt, "Xử lý đơn giao trễ");
  assert.match(question.prompt, /Khách báo đơn giao trễ/);
  assert.throws(() => practiceContext({ kind: "job" }, { ...job, isAdminHidden: true }), { status: 410 });

  const frontend = createPracticeState(settings, practiceContext({ kind: "preset", preset: "frontend" }), ["c1"]).questions[0];
  assert.match(frontend.prompt, /Trang danh sách tải chậm/);
  assert.notEqual(frontend.prompt, question.prompt);
  const answer = "Tôi tra cứu mã đơn và hẹn thời gian cập nhật.";
  const ratings = question.criteria.map(({ id }) => ({ criterionId: id, rating: 3, explanation: "Có bước cụ thể.", evidence: "tra cứu mã đơn" }));
  assert.equal(normalizePracticeGrade({ ratings, improvement: "Nêu thêm phương án bàn giao." }, question, { answer }, false).feedback.score, 75);
  assert.equal(normalizePracticeGrade({ ratings: [{ ...ratings[0], evidence: "Giảm 30%" }, ...ratings.slice(1)] }, question, { answer }, false), null);
});

test("session routes enforce ownership and revision, retry a saved answer, and hide simulation grades", async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = { id: req.headers["x-test-user"] || employee, role: "employee" }; next(); });
  let calls = 0;
  app.use(createInterviewSessionsRouter({
    Session: testStore(),
    runAi: async ({ feature, input }) => {
      if (feature === "interview_session_questions") throw new AiRequestError("test provider unavailable", 503, "AI_NOT_CONFIGURED");
      calls++;
      if (calls === 1) throw new AiRequestError("test interruption", 502);
      return { result: {
        ratings: input.question.criteria.map(({ id }) => ({ criterionId: id, rating: 2, explanation: "Đã tra cứu.", evidence: "tra cứu" })),
        improvement: "Nêu cách theo dõi kết quả.",
      } };
    },
  }));
  const server = await new Promise((resolve) => { const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); });
  const root = "http://127.0.0.1:" + server.address().port;
  const post = async (path, body) => {
    const res = await fetch(root + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: res.status, data: await res.json() };
  };
  try {
    const source = { kind: "preset", preset: "support" };
    const { data: preview } = await post("/context", { source });
    const start = { source, settings, version: preview.version, competencyIds: ["c1"], startKey: "start-operation-0001" };
    const { status, data: { session } } = await post("/", start);
    assert.equal(status, 201);
    assert.equal((await post("/", start)).data.session.id, session.id);
    assert.equal((await fetch(root + "/" + session.id, { headers: { "x-test-user": other } })).status, 404);
    const url = "/" + session.id + "/actions";
    const action = { operationId: "answer-operation-0001", revision: session.revision, action: "answer", questionId: "q1", answer: "Tôi tra cứu mã đơn." };
    const saved = await post(url, action);
    assert.equal(saved.data.session.questions[0].status, "pending");
    assert.equal(saved.data.session.questions[0].attempts[0].answer, action.answer);
    assert.equal((await post(url, action)).data.session.revision, saved.data.session.revision);
    assert.equal(calls, 1);
    assert.equal((await post(url, { ...action, operationId: "answer-operation-0002" })).status, 409);

    const retried = await post(url, { operationId: "retry-operation-00001", revision: saved.data.session.revision, action: "retry", questionId: "q1" });
    assert.equal(retried.data.session.index, 1);
    assert.equal(retried.data.session.questions[0].attempts[0].feedback, undefined);
    assert.equal(retried.data.session.scores, undefined);
    assert.equal(calls, 2);
    const finished = await post(url, { operationId: "finish-operation-0001", revision: retried.data.session.revision, action: "finish" });
    assert.equal(finished.data.session.status, "ended_early");
    assert.equal(finished.data.session.scores.overallScore, 50);
    assert.equal(finished.data.session.questions[0].attempts[0].feedback.criteria[0].evidence, "tra cứu");
    assert.equal((await fetch(root + "/" + session.id, { method: "DELETE" })).status, 204);
    assert.equal((await fetch(root + "/" + session.id)).status, 404);
    const manual = { kind: "manual", role: "Kế toán", description: "Đối chiếu sao kê ngân hàng" };
    const { data: manualPreview } = await post("/context", { source: manual });
    const manualStart = await post("/", { ...start, source: manual, version: manualPreview.version, startKey: "start-manual-000001" });
    assert.equal(manualStart.status, 201);
    assert.equal(manualStart.data.session.questionSource, "template");
    assert.equal(manualStart.data.session.busy, false);
    assert.match(manualStart.data.session.questions[0].prompt, /Đối chiếu sao kê ngân hàng/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("personalized question generation cannot change the agreed plan or repeat a question", () => {
  const context = practiceContext({ kind: "manual", role: "Kế toán", description: "Đối chiếu sao kê ngân hàng\nLập báo cáo công nợ" });
  const state = createPracticeState({ ...settings, type: "mixed" }, context, ["c1", "c2"]);
  const questions = state.questions.map((question, index) => ({
    id: question.id, kind: question.kind, competencyId: question.competency.id,
    prompt: "Bạn xử lý yêu cầu " + (index + 1) + " của công việc này như thế nào?",
  }));
  assert.deepEqual(normalizeGeneratedPracticeQuestions({ questions }, state.questions).map(({ kind }) => kind), [
    "general", "technical", "technical", "behavioral", "behavioral",
  ]);
  assert.equal(normalizeGeneratedPracticeQuestions({ questions: [{ ...questions[0], kind: "technical" }, ...questions.slice(1)] }, state.questions), null);
  assert.equal(normalizeGeneratedPracticeQuestions({ questions: [{ ...questions[0], prompt: questions[1].prompt }, ...questions.slice(1)] }, state.questions), null);
  assert.equal(normalizeGeneratedPracticeQuestions({ questions: questions.slice(1) }, state.questions), null);
});
