import React, { useEffect, useRef, useState } from "react";
import Header from "./Header.jsx";
import AnswerComposer from "./InterviewAnswerComposer.jsx";
import { useConfirmDialog } from "../context/ConfirmDialogContext.jsx";
import { getInterviewPlan, INTERVIEW_FORMATS, INTERVIEW_LEVELS, INTERVIEW_QUESTION_COUNTS } from "../../shared/interviewPractice.js";
import { PRACTICE_MODES, PRACTICE_PRESETS } from "../../shared/interviewScenarios.js";

const button = "rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-violet-400 disabled:opacity-50";
const primary = "rounded-md bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50";
const field = "mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm";
const card = "rounded-xl border border-slate-200 bg-white p-4 sm:p-5";
const initialSettings = { level: "junior", type: "mixed", mode: "guided", totalQuestions: 5 };
const statusLabel = {
  unanswered: "Chưa trả lời", clarifying: "Chờ bổ sung", pending: "Chờ đánh giá",
  graded: "Đã đánh giá", skipped: "Đã bỏ qua",
};

async function api(path, { signal, method = "GET", body } = {}) {
  const response = await fetch("/api/ai/interview/sessions" + path, {
    signal, method, credentials: "include",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  if (response.status === 204) return {};
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.message || "Không thể xử lý buổi luyện."), { data });
  return data;
}

function readDraft(key) {
  try { return sessionStorage.getItem(key) || ""; } catch { return ""; }
}

function storeDraft(key, value) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch { /* The active input still works if storage is unavailable. */ }
}

function withTimeout(controller, duration) {
  return setTimeout(() => controller.abort("timeout"), duration);
}

function ContextPicker({ source, setSource, context, selected, setSelected, onPreview, busy }) {
  return <section className={card}>
    <h2 className="font-bold text-slate-950">1. Chọn công việc</h2>
    <label className="mt-3 block text-sm font-medium">Nguồn bài luyện
      <select className={field} disabled={busy} value={source.kind} onChange={(event) => setSource({ ...source, kind: event.target.value })}>
        {source.jobId && <option value="job">Tin tuyển dụng RabbitCV</option>}
        <option value="preset">Vị trí mẫu</option>
        <option value="manual">Dán mô tả công việc</option>
      </select>
    </label>
    {source.kind === "preset" && <label className="mt-3 block text-sm font-medium">Vị trí mẫu
      <select className={field} disabled={busy} value={source.preset} onChange={(event) => setSource({ ...source, preset: event.target.value })}>
        {Object.entries(PRACTICE_PRESETS).map(([id, preset]) => <option key={id} value={id}>{preset.role}</option>)}
      </select>
    </label>}
    {source.kind === "manual" && <div className="mt-3 space-y-3">
      <label className="block text-sm font-medium">Vị trí ứng tuyển
        <input className={field} maxLength={160} disabled={busy} value={source.role} onChange={(event) => setSource({ ...source, role: event.target.value })} />
      </label>
      <label className="block text-sm font-medium">Mô tả công việc
        <textarea className={field} rows={4} maxLength={6000} disabled={busy} value={source.description} onChange={(event) => setSource({ ...source, description: event.target.value })} placeholder="Mỗi trách nhiệm hoặc yêu cầu một dòng" />
      </label>
    </div>}
    <button className={button + " mt-3"} type="button" disabled={busy} onClick={onPreview}>Xem yêu cầu để luyện</button>
    {context && <fieldset className="mt-4 space-y-2" disabled={busy}>
      <legend className="font-semibold">{context.role}{context.company ? " · " + context.company : ""}</legend>
      <p className="text-sm text-slate-600">Chọn những yêu cầu bạn muốn đưa vào buổi luyện.</p>
      {context.competencies.map(({ id, label, excerpt }) => <label key={id} className="flex items-start gap-2 rounded-md border border-slate-200 p-2 text-sm">
        <input type="checkbox" className="mt-1" checked={selected.includes(id)} onChange={(event) => setSelected(event.target.checked ? [...selected, id] : selected.filter((value) => value !== id))} />
        <span>{label}{excerpt && excerpt !== label && <span className="mt-1 block text-xs text-slate-500">{excerpt}</span>}</span>
      </label>)}
    </fieldset>}
  </section>;
}

function PracticeSetup({ settings, setSettings, canStart, busy, onStart }) {
  const format = INTERVIEW_FORMATS[settings.type];
  const plan = getInterviewPlan(settings.type, settings.totalQuestions);
  const select = (key, label, options) => <label className="block text-sm font-medium">{label}
    <select className={field} disabled={busy} value={settings[key]} onChange={(event) => setSettings({ ...settings, [key]: key === "totalQuestions" ? Number(event.target.value) : event.target.value })}>
      {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select>
  </label>;
  return <section className={card}>
    <h2 className="font-bold text-slate-950">2. Thiết lập buổi luyện</h2>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {select("type", "Nội dung luyện", Object.entries(INTERVIEW_FORMATS).map(([id, value]) => [id, value.label]))}
      {select("mode", "Cách luyện", Object.entries(PRACTICE_MODES).map(([id, value]) => [id, value.label]))}
      {select("level", "Cấp độ", Object.entries(INTERVIEW_LEVELS).map(([id, value]) => [id, value.label]))}
      {select("totalQuestions", "Số câu chính", INTERVIEW_QUESTION_COUNTS.map((count) => [count, count + " câu"]))}
    </div>
    <div className="mt-4 space-y-2 rounded-lg bg-violet-50 p-3 text-sm leading-6 text-slate-800">
      <p>{format.description}</p>
      {format.example && <p>Ví dụ: {format.example}</p>}
      {format.criteria && <p>Tiêu chí: {format.criteria.map(({ label }) => label).join(", ")}.</p>}
      {settings.type === "mixed" && <p>{["general", "technical", "behavioral"].map((kind) => INTERVIEW_FORMATS[kind].label + " · " + plan.filter((item) => item.kind === kind).length + " câu").join("  /  ")}</p>}
      <p>{PRACTICE_MODES[settings.mode].description}</p>
      <p>{INTERVIEW_LEVELS[settings.level].expectation}</p>
    </div>
    <button className={primary + " mt-4"} disabled={!canStart || busy} onClick={onStart}>Bắt đầu phỏng vấn</button>
  </section>;
}

function Feedback({ feedback }) {
  if (!feedback) return null;
  return <section className="mt-3 space-y-3" aria-label="Điểm theo tiêu chí">
    <p className="font-semibold text-violet-800">{feedback.score}/100</p>
    <ul className="space-y-2">
      {feedback.criteria.map(({ id, label, rating, evidence, explanation }) => <li key={id} className="rounded-lg border border-slate-200 p-3 text-sm">
        <p className="font-semibold">{label} · {rating}/4</p>
        {evidence && <blockquote className="my-1 border-l-2 border-violet-300 pl-2 text-slate-700">“{evidence}”</blockquote>}
        <p className="text-slate-600">{explanation}</p>
      </li>)}
    </ul>
    <p className="text-sm"><strong>Việc nên sửa:</strong> {feedback.improvement}</p>
  </section>;
}

function Attempt({ attempt, number }) {
  return <section className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
    <h4 className="font-semibold">{number === 0 ? "Câu trả lời ban đầu" : "Lượt luyện lại " + number}</h4>
    <p className="mt-1 whitespace-pre-wrap break-words">{attempt.answer}</p>
    {attempt.followUp && <p className="mt-2 font-medium">Hỏi thêm: {attempt.followUp}</p>}
    {attempt.clarification && <p className="mt-1 break-words">{attempt.clarification}</p>}
    <Feedback feedback={attempt.feedback} />
  </section>;
}

function PracticeReport({ session, onAction, busy, draftPrefix }) {
  const [practiceId, setPracticeId] = useState(null);
  const [answer, setAnswer] = useState("");
  const counts = session.questions.reduce((result, { status }) => ({ ...result, [status]: (result[status] || 0) + 1 }), {});
  const lowest = session.questions
    .filter((question) => question.attempts[0]?.feedback)
    .reduce((current, question) => !current || question.attempts[0].feedback.score < current.attempts[0].feedback.score ? question : current, null);
  const openPractice = (id) => { setPracticeId(id); setAnswer(readDraft(draftPrefix + id)); };
  const submit = async () => {
    if (!answer.trim()) return;
    const updated = await onAction("practice_again", practiceId, answer);
    if (updated) {
      storeDraft(draftPrefix + practiceId, "");
      setPracticeId(null);
      setAnswer("");
    }
  };
  return <section className={card}>
    <h2 className="text-xl font-bold">Kết quả buổi phỏng vấn</h2>
    <p className="mt-1 text-sm text-slate-700">{session.status === "ended_early" ? "Đã kết thúc sớm" : "Đã hoàn thành"} · Đã đánh giá {counts.graded || 0}/{session.questions.length} câu · Bỏ qua {counts.skipped || 0} · Chờ đánh giá {(counts.pending || 0) + (counts.clarifying || 0)} · Chưa trả lời {counts.unanswered || 0}</p>
    <p className="mt-2 text-sm">Điểm luyện tập: <strong>{session.scores ? session.scores.overallScore + "/100" : "Chưa có điểm"}</strong> · Đã đánh giá {session.coverage || 0}/{session.context.competencies.length} yêu cầu.</p>
    {session.scores?.byKind.map(({ kind, count, score }) => <p key={kind} className="text-sm">{INTERVIEW_FORMATS[kind].label} ({count} câu) · {score}/100</p>)}
    <p className="mt-2 text-sm text-slate-600">Điểm là trung bình các câu đã đánh giá trong lượt đầu và dùng để tự luyện.</p>
    {lowest && <p className="mt-3 rounded-md bg-violet-50 p-3 text-sm"><strong>Nên luyện lại câu {lowest.number}:</strong> {lowest.attempts[0].feedback.improvement}</p>}
    <div className="mt-4 space-y-3">
      {session.questions.map((question) => {
        const latest = question.attempts.at(-1);
        const original = question.attempts[0]?.feedback;
        const pending = Boolean(latest && !latest.feedback && question.status !== "skipped");
        return <details key={question.id} className="rounded-lg border border-slate-200 p-3">
          <summary className="cursor-pointer font-semibold">Câu {question.number} · {INTERVIEW_FORMATS[question.kind].label} · {statusLabel[question.status]}</summary>
          <p className="mt-2 text-sm">{question.prompt}</p>
          {question.attempts.map((attempt, index) => <Attempt key={index} attempt={attempt} number={index} />)}
          {original && latest?.feedback && latest.feedback !== original && <ul className="mt-2 space-y-1 text-sm" aria-label="So sánh điểm với lượt đầu">
            {original.criteria.map(({ id, label, rating }) => <li key={id}>{label}: {rating}/4 → {latest.feedback.criteria.find((criterion) => criterion.id === id)?.rating}/4</li>)}
          </ul>}
          {pending && <button type="button" className={button + " mt-3"} disabled={busy} onClick={() => onAction("retry", question.id)}>Chấm lại câu đã lưu</button>}
          {original && !pending && practiceId !== question.id && question.attempts.length < 6 && <button type="button" className={button + " mt-3"} disabled={busy} onClick={() => openPractice(question.id)}>Luyện lại câu này</button>}
          {practiceId === question.id && <div className="mt-3">
            <label className="text-sm font-medium">Câu trả lời luyện lại<textarea className={field} maxLength={1200} rows={4} disabled={busy} value={answer} onChange={(event) => { setAnswer(event.target.value); storeDraft(draftPrefix + question.id, event.target.value); }} /></label>
            <button className={primary} disabled={busy || !answer.trim()} onClick={submit}>Gửi lượt luyện lại</button>
            <button className={button + " ml-2"} disabled={busy} onClick={() => setPracticeId(null)}>Đóng</button>
          </div>}
        </details>;
      })}
    </div>
  </section>;
}

function ActivePractice({ session, onAction, busy, draftPrefix }) {
  const question = session.questions[session.index];
  const attempt = question.attempts.at(-1);
  const clarifying = question.status === "clarifying";
  const pending = question.status === "pending";
  const key = draftPrefix + question.id + (clarifying ? ":clarify" : ":answer");
  const [answer, setAnswer] = useState(() => readDraft(key));
  const updateDraft = React.useCallback((value) => {
    setAnswer(value);
    storeDraft(key, value);
  }, [key]);
  const submit = async () => {
    const updated = await onAction(clarifying ? "clarify" : "answer", question.id, answer);
    if (updated) storeDraft(key, "");
  };
  return <>
    <section className={card}>
      <p className="text-sm font-semibold text-violet-800">Câu {question.number}/{session.questions.length} · {INTERVIEW_FORMATS[question.kind].label} · {question.focus}</p>
      <h2 className="mt-2 text-lg font-bold">{question.prompt}</h2>
      <p className="mt-2 text-sm text-slate-600">Năng lực: {question.competency.label}</p>
      {attempt && <Attempt attempt={attempt} number={0} />}
      {pending ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={button} disabled={busy} onClick={() => onAction("retry", question.id)}>Chấm lại câu đã lưu</button>
          <button className={button} disabled={busy} onClick={() => onAction("defer", question.id)}>Tiếp tục và chấm sau</button>
        </div>
      ) : (
        <>
          <div className="mt-3">
            <AnswerComposer answer={answer} setAnswer={updateDraft} onSubmit={submit} isRequesting={busy} questionNumber={question.number} />
          </div>
          <button className={button + " mt-2"} disabled={busy} onClick={() => onAction(clarifying ? "finish_question" : "skip", question.id)}>
            {clarifying ? "Chấm theo câu trả lời hiện có" : "Bỏ qua câu này"}
          </button>
        </>
      )}
    </section>
    {session.settings.mode === "guided" && session.questions.slice(0, session.index).some((item) => item.attempts?.[0]?.feedback) && <section className={card}>
      <h2 className="font-semibold">Nhận xét các câu đã trả lời</h2>
      {session.questions.slice(0, session.index).filter((item) => item.attempts?.[0]?.feedback).map((item, index, graded) => <details key={item.id} open={index === graded.length - 1} className="mt-3 rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-semibold">Câu {item.number} · {INTERVIEW_FORMATS[item.kind].label}</summary>
        <p className="mt-2 text-sm">{item.prompt}</p>
        <Attempt attempt={item.attempts[0]} number={0} />
      </details>)}
    </section>}
  </>;
}

export default function InterviewPractice({ userId, jobId }) {
  const confirm = useConfirmDialog();
  const [source, setSource] = useState({ kind: jobId ? "job" : "preset", jobId, preset: "frontend", role: "", description: "" });
  const [settings, setSettings] = useState(initialSettings);
  const [context, setContext] = useState(null);
  const [selected, setSelected] = useState([]);
  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [loadingJob, setLoadingJob] = useState(Boolean(jobId));
  const requestRef = useRef(null);
  const startKey = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = withTimeout(controller, 15_000);
    api("/current" + (jobId ? "?jobId=" + encodeURIComponent(jobId) : ""), { signal: controller.signal }).then(({ session: latest }) => {
      setCurrent(latest);
      if (latest && (!jobId || latest.context.jobId === jobId)) setSession(latest);
    }).catch(() => {
      if (!controller.signal.aborted || controller.signal.reason === "timeout") setNotice("Chưa tải được buổi gần nhất. Hãy tải lại trang nếu muốn tiếp tục phiên cũ.");
    }).finally(() => {
      clearTimeout(timeout);
      if (!controller.signal.aborted || controller.signal.reason === "timeout") setLoadingCurrent(false);
    });
    return () => { clearTimeout(timeout); controller.abort(); requestRef.current?.abort(); };
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    const controller = new AbortController();
    const timeout = withTimeout(controller, 15_000);
    api("/context", { method: "POST", body: { source: { kind: "job", jobId } }, signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      setContext(data);
      setSelected(data.context.competencies.map(({ id }) => id));
    }).catch((error) => {
      if (!controller.signal.aborted || controller.signal.reason === "timeout") setNotice(controller.signal.aborted ? "Chưa tải được tin tuyển dụng. Bạn có thể chọn vị trí mẫu." : error.message);
    }).finally(() => {
      clearTimeout(timeout);
      if (!controller.signal.aborted || controller.signal.reason === "timeout") setLoadingJob(false);
    });
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [jobId]);

  useEffect(() => {
    if (!session?.busy || busy) return;
    const controller = new AbortController();
    const refresh = setTimeout(() => {
      api("/" + session.id, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) }).then(({ session: latest }) => {
        setSession(latest);
        setCurrent(latest);
      }).catch((error) => {
        if (!controller.signal.aborted) setNotice(error.message + " Hãy tải lại trang để đồng bộ.");
      });
    }, 3000);
    return () => { clearTimeout(refresh); controller.abort(); };
  }, [session, busy]);

  const run = async (task) => {
    if (requestRef.current) return null;
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = withTimeout(controller, 100_000);
    setBusy(true);
    setNotice("");
    try { return await task(controller.signal); }
    catch (error) {
      if (controller.signal.reason === "timeout") {
        setNotice("Phản hồi mất quá lâu. Hãy tải lại để kiểm tra câu trả lời đã lưu trước khi gửi lại.");
      } else if (!controller.signal.aborted) {
        if (error.data?.session) { setSession(error.data.session); setCurrent(error.data.session); }
        setNotice(error.message);
      }
      return null;
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) {
        requestRef.current = null;
        if (!controller.signal.aborted || controller.signal.reason === "timeout") setBusy(false);
      }
    }
  };

  const preview = () => run(async (signal) => {
    const data = await api("/context", { signal, method: "POST", body: { source } });
    setContext(data);
    setSelected(data.context.competencies.map(({ id }) => id));
  });
  const acceptSession = (data) => {
    setSession(data.session);
    setCurrent(data.session);
    if (data.message) setNotice(data.message);
    return data.session;
  };
  const start = () => run(async (signal) => {
    startKey.current ||= crypto.randomUUID();
    return acceptSession(await api("", {
      signal, method: "POST",
      body: { source, settings, competencyIds: selected, version: context.version, startKey: startKey.current },
    }));
  });
  const action = (action, questionId, answer) => run(async (signal) => acceptSession(await api("/" + session.id + "/actions", {
    signal, method: "POST", body: { action, questionId, answer, revision: session.revision, operationId: crypto.randomUUID() },
  })));
  const draftPrefix = "rabbitcv:practice:" + userId + ":" + session?.id + ":";
  const deleteSession = async () => {
    if (!await confirm("Xóa buổi luyện, câu trả lời và báo cáo của phiên này?")) return;
    await run(async (signal) => {
      await api("/" + session.id, { signal, method: "DELETE" });
      session.questions.forEach(({ id }) => [id + ":answer", id + ":clarify", "retry:" + id].forEach((key) => storeDraft(draftPrefix + key, "")));
      setCurrent(null);
      setSession(null);
      startKey.current = null;
    });
  };
  const inProgress = busy || Boolean(session?.busy) || (!session && (loadingJob || loadingCurrent));
  const question = session?.questions[session.index];

  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <Header />
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Luyện tập phỏng vấn AI</h1>
      {notice && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm" role="alert">{notice}</p>}
      {inProgress && <p className="text-sm text-violet-800" role="status">{session ? "Đang xử lý lượt luyện…" : "Đang chuẩn bị…"}</p>}
      {!session ? <>
        {current && <button type="button" className={button} disabled={inProgress} onClick={() => setSession(current)}>{current.status === "active" ? "Tiếp tục buổi gần nhất" : "Xem kết quả buổi gần nhất"}</button>}
        <div className="grid gap-4 lg:grid-cols-2">
          <ContextPicker source={source} setSource={(value) => { setSource(value); setContext(null); startKey.current = null; }} context={context?.context?.kind === source.kind ? context.context : null} selected={selected} setSelected={(value) => { setSelected(value); startKey.current = null; }} onPreview={preview} busy={inProgress} />
          <PracticeSetup settings={settings} setSettings={(value) => { setSettings(value); startKey.current = null; }} canStart={Boolean(context?.context?.kind === source.kind && selected.length)} busy={inProgress} onStart={start} />
        </div>
      </> : <>
        <div className={card + " flex flex-wrap items-center justify-between gap-3"}>
          <div><p className="font-bold">{session.context.role}</p><p className="text-sm text-slate-600">{INTERVIEW_LEVELS[session.settings.level].label} · {INTERVIEW_FORMATS[session.settings.type].label} · {PRACTICE_MODES[session.settings.mode].label}</p>
            <p className="text-xs text-slate-600">{session.questionSource === "ai" ? "Câu hỏi được soạn theo mô tả công việc" : "Câu hỏi mẫu theo yêu cầu đã chọn"}</p></div>
          <div className="flex flex-wrap gap-2">
            {session.status === "active" && <button className={button} disabled={inProgress} onClick={async () => { if (await confirm("Kết thúc sớm và xem các câu đã đánh giá?")) void action("finish"); }}>Kết thúc sớm</button>}
            <button className={button} disabled={inProgress} onClick={() => { setSession(null); startKey.current = null; }}>Buổi mới</button>
            <button className={button} disabled={inProgress} onClick={deleteSession}>Xóa buổi luyện</button>
          </div>
        </div>
        {session.status === "active"
          ? <ActivePractice key={session.id + ":" + question.id + ":" + question.status} session={session} onAction={action} busy={inProgress} draftPrefix={draftPrefix} />
          : <PracticeReport key={session.id} session={session} onAction={action} busy={inProgress} draftPrefix={draftPrefix + "retry:"} />}
      </>}
    </main>
  </div>;
}
