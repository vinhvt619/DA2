import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  ChartBarSquareIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  StopCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Header from "../Components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { showToast } from "../utils/toast.js";
import { requestAi } from "../utils/aiApi.js";
import useInterviewSpeech from "../hooks/useInterviewSpeech.js";
import { INTERVIEW_ANSWER_LIMIT } from "../utils/interviewSpeech.js";

const LEVEL_OPTIONS = [
  { value: "intern", label: "Thực tập sinh" },
  { value: "junior", label: "Junior" },
  { value: "middle", label: "Middle" },
  { value: "senior", label: "Senior" },
];

const TYPE_OPTIONS = [
  { value: "mixed", label: "Kết hợp" },
  { value: "general", label: "Tổng quan" },
  { value: "behavioral", label: "Hành vi" },
  { value: "technical", label: "Chuyên môn" },
];

const QUESTION_OPTIONS = [
  { value: 5, duration: "10–15 phút" },
  { value: 8, duration: "20–25 phút" },
  { value: 12, duration: "30–35 phút" },
];

const createMessage = (role, content, extras = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role,
  content,
  ...extras,
});

const getOptionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value;

const getQuestionOption = (value) =>
  QUESTION_OPTIONS.find((option) => option.value === value) ||
  QUESTION_OPTIONS[0];

function ScoreBadge({ score, large = false }) {
  const tone =
    score >= 80
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 60
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";

  return (
    <span
      className={`inline-flex items-center rounded-md font-black ring-1 ${tone} ${
        large ? "h-9 px-3 text-sm" : "h-7 px-2 text-xs"
      }`}
    >
      {score}/100
    </span>
  );
}

function FeedbackBlock({ feedback, compact = false }) {
  if (!feedback || (!feedback.strengths?.length && !feedback.improvements?.length)) {
    return null;
  }

  return (
    <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
      <section>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
          <h3 className="text-xs font-black text-slate-800">Điểm tốt</h3>
        </div>
        <ul className="mt-2 space-y-2">
          {feedback.strengths.map((item) => (
            <li
              key={item}
              className="border-l-2 border-emerald-200 pl-2.5 text-xs leading-5 text-slate-600"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <ChartBarSquareIcon className="h-4 w-4 text-violet-600" />
          <h3 className="text-xs font-black text-slate-800">Cần cải thiện</h3>
        </div>
        <ul className="mt-2 space-y-2">
          {feedback.improvements.map((item) => (
            <li
              key={item}
              className="border-l-2 border-violet-200 pl-2.5 text-xs leading-5 text-slate-600"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SummaryPanel({ summary, onRestart, mobile = false }) {
  return (
    <aside
      className={
        mobile
          ? "rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          : "h-full overflow-y-auto border-l border-slate-200 bg-white p-4 custom-scrollbar"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-violet-600">Tổng kết</p>
          <h2 className="mt-1 text-base font-black text-slate-950">
            Kết quả buổi phỏng vấn
          </h2>
        </div>
        <ScoreBadge score={summary.overallScore || 0} large />
      </div>

      <div className="mt-5 space-y-5">
        <section>
          <h3 className="text-xs font-black uppercase text-emerald-700">
            Điểm mạnh
          </h3>
          <ul className="mt-3 space-y-2.5">
            {summary.strengths?.map((item) => (
              <li
                key={item}
                className="border-l-2 border-emerald-200 pl-3 text-sm leading-6 text-slate-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase text-violet-700">
            Cần luyện thêm
          </h3>
          <ul className="mt-3 space-y-2.5">
            {summary.improvements?.map((item) => (
              <li
                key={item}
                className="border-l-2 border-violet-200 pl-3 text-sm leading-6 text-slate-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        {summary.recommendation && (
          <section className="border-t border-slate-200 pt-5">
            <h3 className="text-xs font-black uppercase text-slate-500">
              Bước tiếp theo
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {summary.recommendation}
            </p>
          </section>
        )}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-5 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition-colors duration-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
      >
        <ArrowPathIcon className="h-4 w-4" />
        Phỏng vấn lại
      </button>
    </aside>
  );
}

function SetupInterview({
  settings,
  setSettings,
  onRoleChange,
  onSubmit,
  isRequesting,
  displayName,
}) {
  const updateSetting = (key, value) => {
    if (key === "role") {
      onRoleChange(value);
      return;
    }
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="mx-auto w-full max-w-[980px] px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-violet-600 text-white shadow-sm">
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-violet-600">RabbitCV Practice</p>
          <h1 className="mt-0.5 text-2xl font-black text-slate-950">
            Phỏng vấn với AI
          </h1>
        </div>
      </header>

      <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-black text-slate-950">
              Thiết lập buổi luyện tập
            </h2>
          </div>

          <div className="space-y-4 p-4 sm:p-[18px]">
            <label className="block text-xs font-bold text-slate-700">
              Vị trí ứng tuyển
              <span className="ml-1 text-rose-500">*</span>
              <div className="relative mt-1.5">
                <BriefcaseIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={settings.role}
                  onChange={(event) => updateSetting("role", event.target.value)}
                  placeholder="Ví dụ: Frontend Developer"
                  maxLength={160}
                  autoFocus
                  className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-xs outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <fieldset>
                <legend className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <AcademicCapIcon className="h-4 w-4 text-slate-400" />
                  Cấp độ
                </legend>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-4">
                  {LEVEL_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex h-9 cursor-pointer items-center justify-center rounded-md border px-1.5 text-center text-[11px] font-bold transition-colors duration-200 ${
                        settings.level === option.value
                          ? "border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="interview-level"
                        value={option.value}
                        checked={settings.level === option.value}
                        onChange={() => updateSetting("level", option.value)}
                        className="sr-only"
                      />
                      {option.value === "intern" ? "Thực tập" : option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <AdjustmentsHorizontalIcon className="h-4 w-4 text-slate-400" />
                  Hình thức
                </legend>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-4">
                  {TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex h-9 cursor-pointer items-center justify-center rounded-md border px-1.5 text-center text-[11px] font-bold transition-colors duration-200 ${
                        settings.type === option.value
                          ? "border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="interview-type"
                        value={option.value}
                        checked={settings.type === option.value}
                        onChange={() => updateSetting("type", option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <fieldset>
              <legend className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <ClockIcon className="h-4 w-4 text-slate-400" />
                Độ dài buổi phỏng vấn
              </legend>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {QUESTION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex h-10 cursor-pointer items-center justify-between gap-2 rounded-md border px-3 text-xs font-bold transition-colors duration-200 ${
                      settings.totalQuestions === option.value
                        ? "border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="question-count"
                      value={option.value}
                      checked={settings.totalQuestions === option.value}
                      onChange={() => updateSetting("totalQuestions", option.value)}
                      className="sr-only"
                    />
                    <span>{option.value} câu hỏi</span>
                    <span className="hidden text-[10px] font-medium text-slate-400 sm:inline">
                      {option.duration}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-2.5 border-t border-slate-200 bg-slate-50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="truncate text-[10px] text-slate-500">
              Ứng viên: <span className="font-bold text-slate-700">{displayName}</span>
            </p>
            <button
              type="submit"
              disabled={isRequesting}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-xs font-bold text-white transition-colors duration-200 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-44"
            >
              <SparklesIcon
                className={`h-4 w-4 ${isRequesting ? "animate-pulse" : ""}`}
              />
              {isRequesting ? "Đang chuẩn bị..." : "Bắt đầu phỏng vấn"}
              {!isRequesting && <ChevronRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-white">
              <SparklesIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500">Phỏng vấn viên</p>
              <h2 className="truncate text-xs font-black text-slate-950">
                RabbitCV Interviewer
              </h2>
            </div>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
          </div>

          <dl className="mt-4 space-y-3.5">
            <div>
              <dt className="text-[10px] font-medium text-slate-500">Vị trí</dt>
              <dd className="mt-1 truncate text-xs font-bold text-slate-800">
                {settings.role.trim() || "Chưa thiết lập"}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[10px] font-medium text-slate-500">Cấp độ</dt>
                <dd className="mt-1 text-xs font-bold text-slate-800">
                  {getOptionLabel(LEVEL_OPTIONS, settings.level)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium text-slate-500">Hình thức</dt>
                <dd className="mt-1 text-xs font-bold text-slate-800">
                  {getOptionLabel(TYPE_OPTIONS, settings.type)}
                </dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[10px] font-medium text-slate-500">Số câu</dt>
                <dd className="mt-1 text-xs font-bold text-slate-800">
                  {settings.totalQuestions} câu
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium text-slate-500">Thời lượng</dt>
                <dd className="mt-1 text-xs font-bold text-slate-800">
                  {getQuestionOption(settings.totalQuestions).duration}
                </dd>
              </div>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}

function SessionSidebar({
  settings,
  answeredCount,
  questionNumber,
  displayName,
  selectedQuestion,
  onSelectQuestion,
  phase,
  onShowSummary,
}) {
  const progress = Math.round((answeredCount / settings.totalQuestions) * 100);

  return (
    <aside className="hidden min-h-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-3.5 custom-scrollbar xl:flex">
      <div className="border-b border-slate-200 pb-3.5">
        <p className="text-[10px] font-bold uppercase text-slate-400">
          Buổi phỏng vấn
        </p>
        <h2 className="mt-1 truncate text-[13px] font-black text-slate-950">
          {settings.role}
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          {getOptionLabel(LEVEL_OPTIONS, settings.level)} ·{" "}
          {getOptionLabel(TYPE_OPTIONS, settings.type)}
        </p>
      </div>

      <div className="py-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-slate-700">Tiến độ</h3>
          <span className="text-[11px] font-bold text-violet-600">
            {answeredCount}/{settings.totalQuestions}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-violet-600 transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-3 space-y-0.5">
          {Array.from({ length: settings.totalQuestions }, (_, index) => {
            const number = index + 1;
            const isDone = number <= answeredCount;
            const isCurrent = number === Math.min(questionNumber, settings.totalQuestions);
            const isSelected = number === selectedQuestion;
            const canSelect = isDone || isCurrent;

            return (
              <li key={number}>
                <button
                  type="button"
                  onClick={() => onSelectQuestion(number)}
                  disabled={!canSelect}
                  aria-pressed={isSelected}
                  title={canSelect ? `Xem đánh giá câu ${number}` : "Câu hỏi chưa được trả lời"}
                  className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[11px] font-bold transition-colors duration-200 ${
                    isSelected
                      ? "cursor-pointer bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                      : isCurrent
                        ? "cursor-pointer bg-violet-50 text-violet-700"
                        : isDone
                          ? "cursor-pointer text-emerald-700 hover:bg-emerald-50"
                          : "cursor-not-allowed text-slate-400"
                  }`}
                >
                  <span
                    className={`grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full text-[9px] ${
                      isSelected || isCurrent
                        ? "bg-violet-600 text-white"
                        : isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                    ) : (
                      number
                    )}
                  </span>
                  <span className="truncate">Câu hỏi {number}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {phase === "complete" && (
          <button
            type="button"
            onClick={onShowSummary}
            className="mt-3 inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 text-[11px] font-bold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          >
            <ChartBarSquareIcon className="h-4 w-4" />
            Xem tổng kết
          </button>
        )}
      </div>

      <div className="mt-auto border-t border-slate-200 pt-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500">Ứng viên</p>
            <p className="truncate text-[13px] font-bold text-slate-800">
              {displayName}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function InterviewHeader({
  settings,
  questionNumber,
  answeredCount,
  phase,
  isRequesting,
  onFinish,
}) {
  const progress = Math.round((answeredCount / settings.totalQuestions) * 100);

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-[18px] py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                phase === "complete" ? "bg-slate-400" : "bg-emerald-500"
              }`}
            />
            <p className="text-[11px] font-bold text-slate-500">
              {phase === "complete" ? "Đã hoàn thành" : "Đang phỏng vấn"}
            </p>
          </div>
          <h1 className="mt-0.5 truncate text-sm font-black text-slate-950 sm:text-[15px]">
            {settings.role}
          </h1>
        </div>

        <div className="ml-auto hidden w-52 sm:block xl:hidden">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-500">
              Câu {Math.min(questionNumber, settings.totalQuestions)}/
              {settings.totalQuestions}
            </span>
            <span className="font-bold text-slate-700">{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-violet-600 transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {phase === "active" && (
          <button
            type="button"
            onClick={onFinish}
            disabled={isRequesting || answeredCount === 0}
            title="Kết thúc phỏng vấn"
            aria-label="Kết thúc phỏng vấn"
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 text-[11px] font-bold text-slate-700 transition-colors duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <StopCircleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Kết thúc</span>
          </button>
        )}
      </div>

      <div className="mt-2 sm:hidden">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            Câu {Math.min(questionNumber, settings.totalQuestions)}/
            {settings.totalQuestions}
          </span>
          <span className="font-bold text-slate-700">{progress}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-violet-600 transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </header>
  );
}

function InterviewMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <article className={`flex items-end gap-2.5 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-600 text-white shadow-sm">
          <SparklesIcon className="h-4 w-4" />
        </span>
      )}

      <div className="max-w-[86%] sm:max-w-[78%]">
        <p
          className={`mb-1 text-[11px] font-bold ${
            isUser ? "text-right text-slate-500" : "text-slate-600"
          }`}
        >
          {isUser ? "Bạn" : "Nhà tuyển dụng AI"}
        </p>
        <div
          className={`rounded-lg px-3.5 py-3 ${
            isUser
              ? "bg-slate-950 text-white shadow-sm"
              : "border border-violet-100 bg-violet-50/70 text-slate-800"
          }`}
        >
          <p className="whitespace-pre-wrap text-[13px] leading-[1.6]">
            {message.content}
          </p>
        </div>

        {message.feedback && (
          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black text-slate-800">Đánh giá câu trả lời</p>
              <ScoreBadge score={message.feedback.score || 0} />
            </div>
            <FeedbackBlock feedback={message.feedback} />
          </div>
        )}
      </div>

      {isUser && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-700">
          <UserIcon className="h-4 w-4" />
        </span>
      )}
    </article>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5" aria-live="polite">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-600 text-white shadow-sm">
        <SparklesIcon className="h-4 w-4 animate-pulse" />
      </span>
      <div>
        <p className="mb-1 text-[11px] font-bold text-slate-600">
          Nhà tuyển dụng AI
        </p>
        <div className="flex h-10 items-center gap-1 rounded-lg border border-violet-100 bg-violet-50/70 px-3.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 motion-reduce:animate-none" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:120ms] motion-reduce:animate-none" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:240ms] motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}

function AnswerComposer({
  answer,
  setAnswer,
  onSubmit,
  isRequesting,
  questionNumber,
}) {
  const speech = useInterviewSpeech({ onText: setAnswer, disabled: isRequesting });
  const sendAnswer = () => {
    if (!speech.busy && !isRequesting) void onSubmit();
  };
  const speechStatus = speech.status === "starting" ? "Đang mở mic…"
    : speech.status === "listening" ? "Đang nghe tiếng Việt… Bấm Dừng mic khi trả lời xong."
      : speech.status === "stopping" ? "Đang dừng mic và hoàn tất bản chép lời…"
        : "Kiểm tra, chỉnh sửa bản chép lời rồi bấm Gửi. Mic tự dừng sau 2 phút.";
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:px-5">
      <div className="w-full">
        {speech.canSelectMicrophone ? <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="interview-microphone" className="shrink-0 text-xs font-semibold text-slate-700">Microphone</label>
          <select id="interview-microphone" value={speech.deviceId} onChange={(event) => speech.selectDevice(event.target.value)}
            disabled={isRequesting || speech.busy || speech.loadingDevices} aria-describedby="interview-microphone-help"
            className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:bg-slate-50 disabled:opacity-60">
            <option value="">Mic mặc định của trình duyệt</option>
            {speech.deviceId && !speech.devices.some((device) => device.deviceId === speech.deviceId) && <option value={speech.deviceId}>Mic đã ngắt kết nối — chọn mic khác</option>}
            {speech.devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}
          </select>
          <button type="button" onClick={() => void speech.refreshDevices()} disabled={isRequesting || speech.busy || speech.loadingDevices}
            className="min-h-11 shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50">
            {speech.loadingDevices ? "Đang tải mic…" : "Tải danh sách mic"}
          </button>
        </div> : null}
        {speech.supported && <p id="interview-microphone-help" className="mb-2 text-[11px] leading-4 text-slate-600" role="status" aria-live="polite">
          {speech.canSelectMicrophone ? "Bấm Tải danh sách mic và cấp quyền để xem tên thiết bị. Chọn mic trước khi bắt đầu nói."
            : "Trình duyệt này dùng mic mặc định. Muốn đổi mic, hãy đổi trong cài đặt trình duyệt/hệ điều hành, hoặc dùng Chrome/Edge 135+ trên máy tính để chọn tại đây."}
        </p>}
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button type="button" onClick={() => speech.busy ? speech.stop() : speech.start(answer)}
            disabled={isRequesting || !speech.supported || speech.loadingDevices || speech.status === "stopping" || (!speech.busy && answer.length >= INTERVIEW_ANSWER_LIMIT)}
            aria-label={speech.busy ? "Dừng mic" : "Trả lời bằng mic"}
            aria-pressed={speech.busy} aria-describedby="interview-speech-status interview-speech-privacy"
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${speech.busy ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
            {speech.busy ? <StopCircleIcon className="h-4 w-4" /> : <MicrophoneIcon className="h-4 w-4" />}
            {speech.busy ? "Dừng mic" : "Trả lời bằng mic"}
          </button>
          <p id="interview-speech-status" role="status" aria-live="polite" className="min-w-0 flex-1 text-[11px] leading-4 text-slate-600">
            {speech.supported ? speechStatus : speech.unsupportedReason}
          </p>
        </div>
        {speech.error && <p role="alert" className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{speech.error}</p>}
        <div className="flex items-end gap-3 rounded-lg border border-slate-300 bg-white p-2.5 shadow-sm transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
          <label htmlFor="interview-answer" className="sr-only">
            Câu trả lời phỏng vấn
          </label>
          <textarea
            id="interview-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                sendAnswer();
              }
            }}
            placeholder={`Viết câu trả lời cho câu ${Math.min(
              questionNumber,
              12,
            )}...`}
            maxLength={INTERVIEW_ANSWER_LIMIT}
            rows={2}
            disabled={isRequesting || speech.busy}
            aria-describedby="interview-speech-status"
            className="block min-h-[58px] min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-[13px] leading-5 text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-50"
          />
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="text-[10px] tabular-nums text-slate-400">
              {answer.length}/{INTERVIEW_ANSWER_LIMIT}
            </span>
            <button
              type="button"
              onClick={sendAnswer}
              disabled={!answer.trim() || isRequesting || speech.busy}
              title="Gửi câu trả lời"
              aria-label="Gửi câu trả lời"
              className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-md bg-violet-600 text-white transition-colors duration-200 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:bg-violet-300"
            >
              <PaperAirplaneIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
        <p id="interview-speech-privacy" className="mt-2 text-[10px] leading-4 text-slate-500">
          Mic chỉ mở khi bạn bấm nút. Trình duyệt có thể gửi âm thanh đến dịch vụ nhận dạng. Chỉ văn bản bạn bấm Gửi mới được gửi cho AI phỏng vấn.
        </p>
      </div>
    </div>
  );
}

function FeedbackSidebar({
  questionNumber,
  feedback,
  answeredCount,
  phase,
  onShowSummary,
}) {
  const isAnswered = questionNumber <= answeredCount;

  return (
    <aside className="hidden min-h-0 overflow-y-auto border-l border-slate-200 bg-white p-[18px] custom-scrollbar lg:block">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChartBarSquareIcon className="h-[18px] w-[18px] text-violet-600" />
          <h2 className="text-[13px] font-black text-slate-950">
            Đánh giá câu {questionNumber}
          </h2>
        </div>
        {phase === "complete" && (
          <button
            type="button"
            onClick={onShowSummary}
            className="shrink-0 cursor-pointer text-[11px] font-bold text-violet-600 hover:text-violet-800"
          >
            Tổng kết
          </button>
        )}
      </div>

      {feedback ? (
        <div className="mt-[18px]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
            <p className="text-[11px] font-medium text-slate-500">
              Điểm câu trả lời
            </p>
            <ScoreBadge score={feedback.score || 0} large />
          </div>
          <div className="mt-[18px]">
            <FeedbackBlock feedback={feedback} compact />
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-slate-400">
            <ChartBarSquareIcon className="h-[18px] w-[18px]" />
          </div>
          <p className="mt-3.5 text-[13px] font-bold text-slate-700">
            Chưa có đánh giá
          </p>
          <p className="mt-1 text-[13px] leading-5 text-slate-500">
            {isAnswered
              ? "Đánh giá cho câu trả lời này chưa sẵn sàng."
              : "Câu hỏi này chưa được trả lời."}
          </p>
        </div>
      )}
    </aside>
  );
}

export default function AiInterview() {
  const { currentUser, isAuthChecked } = useAuth();
  const messagesEndRef = useRef(null);
  const roleEditedRef = useRef(false);
  const initialRole = currentUser?.experiences?.[0]?.position || "";
  const displayName =
    currentUser?.fullName || currentUser?.username || "Ứng viên RabbitCV";
  const [settings, setSettings] = useState({
    role: initialRole,
    level: "junior",
    type: "mixed",
    totalQuestions: 5,
  });
  const [phase, setPhase] = useState("setup");
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [summary, setSummary] = useState(null);
  const [selectedReviewQuestion, setSelectedReviewQuestion] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRequesting]);

  useEffect(() => {
    const accountRole = currentUser?.experiences?.[0]?.position?.trim();
    if (accountRole && !roleEditedRef.current && !settings.role && phase === "setup") {
      setSettings((current) => ({ ...current, role: accountRole }));
    }
  }, [currentUser, phase, settings.role]);

  const answeredCount = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages],
  );

  const feedbackByQuestion = useMemo(() => {
    const feedback = {};
    let answeredQuestion = 0;

    for (const message of messages) {
      if (message.role === "user") {
        answeredQuestion += 1;
      } else if (
        message.role === "assistant" &&
        message.feedback &&
        answeredQuestion > 0
      ) {
        feedback[answeredQuestion] = message.feedback;
      }
    }

    return feedback;
  }, [messages]);

  const displayedReviewQuestion =
    selectedReviewQuestion ?? Math.max(1, answeredCount || questionNumber);
  const displayedFeedback =
    feedbackByQuestion[displayedReviewQuestion] || null;

  useEffect(() => {
    const currentQuestion = Math.min(
      questionNumber,
      settings.totalQuestions,
    );

    setSelectedReviewQuestion((selected) => {
      if (
        selected === null ||
        selected <= answeredCount ||
        selected === currentQuestion
      ) {
        return selected;
      }

      return currentQuestion;
    });
  }, [answeredCount, questionNumber, settings.totalQuestions]);

  if (!isAuthChecked) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--page-background)]">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-600 border-t-transparent motion-reduce:animate-none" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const runInterviewTurn = async (action, conversation) => {
    const data = await requestAi("/interview/turn", {
      action,
      settings,
      messages: conversation.map(({ role, content }) => ({ role, content })),
    });
    return data.result;
  };

  const startInterview = async (event) => {
    event.preventDefault();
    if (!settings.role.trim()) {
      showToast("Hãy nhập vị trí muốn luyện phỏng vấn.", "error");
      return;
    }

    setIsRequesting(true);
    setMessages([]);
    setSummary(null);
    setSelectedReviewQuestion(null);
    try {
      const result = await runInterviewTurn("start", []);
      setMessages([createMessage("assistant", result.message)]);
      setQuestionNumber(result.questionNumber || 1);
      setPhase("active");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const submitAnswer = async () => {
    const content = answer.trim();
    if (!content || isRequesting || phase !== "active") return;

    const userMessage = createMessage("user", content);
    const nextConversation = [...messages, userMessage];
    const answeredQuestionNumber = nextConversation.filter(
      (message) => message.role === "user",
    ).length;
    setMessages(nextConversation);
    setAnswer("");
    setIsRequesting(true);
    try {
      const result = await runInterviewTurn("answer", nextConversation);
      const assistantMessage = createMessage("assistant", result.message, {
        feedback: result.feedback,
      });
      setMessages((current) => [...current, assistantMessage]);
      setQuestionNumber(result.questionNumber || questionNumber);
      setSelectedReviewQuestion(answeredQuestionNumber);
      if (result.isComplete) {
        setSummary(result.finalSummary);
        setPhase("complete");
        setSelectedReviewQuestion(null);
      }
    } catch (error) {
      setMessages(messages);
      setAnswer(content);
      showToast(error.message, "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const finishInterview = async () => {
    if (isRequesting || answeredCount === 0) return;

    setIsRequesting(true);
    try {
      const result = await runInterviewTurn("finish", messages);
      setMessages((current) => [
        ...current,
        createMessage("assistant", result.message),
      ]);
      setSummary(result.finalSummary);
      setPhase("complete");
      setSelectedReviewQuestion(null);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const restartInterview = () => {
    setPhase("setup");
    setMessages([]);
    setAnswer("");
    setSummary(null);
    setQuestionNumber(1);
    setSelectedReviewQuestion(null);
  };

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-950 antialiased page-transition motion-reduce:animate-none">
      <Header />

      {phase === "setup" ? (
        <SetupInterview
          settings={settings}
          setSettings={setSettings}
          onRoleChange={(role) => {
            roleEditedRef.current = true;
            setSettings((current) => ({ ...current, role }));
          }}
          onSubmit={startInterview}
          isRequesting={isRequesting}
          displayName={displayName}
        />
      ) : (
        <main className="mx-auto flex h-[calc(100vh-64px)] max-w-[1536px] min-h-0 flex-col overflow-hidden border-x border-slate-200 bg-white">
          <InterviewHeader
            settings={settings}
            questionNumber={questionNumber}
            answeredCount={answeredCount}
            phase={phase}
            isRequesting={isRequesting}
            onFinish={finishInterview}
          />

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[240px_minmax(0,1fr)_320px]">
            <SessionSidebar
              settings={settings}
              answeredCount={answeredCount}
              questionNumber={questionNumber}
              displayName={displayName}
              selectedQuestion={
                phase === "complete" && selectedReviewQuestion === null
                  ? null
                  : displayedReviewQuestion
              }
              onSelectQuestion={setSelectedReviewQuestion}
              phase={phase}
              onShowSummary={() => setSelectedReviewQuestion(null)}
            />

            <section className="flex min-h-0 flex-col bg-slate-50/60">
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 custom-scrollbar sm:px-6 sm:py-5">
                <div className="w-full space-y-5">
                  {messages.map((message) => (
                    <InterviewMessage key={message.id} message={message} />
                  ))}
                  {isRequesting && <TypingIndicator />}

                  {phase === "complete" && summary && (
                    <div className="pt-2 lg:hidden">
                      <SummaryPanel
                        summary={summary}
                        onRestart={restartInterview}
                        mobile
                      />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {phase === "active" && (
                <AnswerComposer
                  answer={answer}
                  setAnswer={setAnswer}
                  onSubmit={submitAnswer}
                  isRequesting={isRequesting}
                  questionNumber={questionNumber}
                />
              )}
            </section>

            {phase === "complete" &&
            summary &&
            selectedReviewQuestion === null ? (
              <div className="hidden min-h-0 lg:block">
                <SummaryPanel summary={summary} onRestart={restartInterview} />
              </div>
            ) : (
              <FeedbackSidebar
                questionNumber={displayedReviewQuestion}
                feedback={displayedFeedback}
                answeredCount={answeredCount}
                phase={phase}
                onShowSummary={() => setSelectedReviewQuestion(null)}
              />
            )}
          </div>
        </main>
      )}
    </div>
  );
}
