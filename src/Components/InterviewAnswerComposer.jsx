import React from "react";
import { MicrophoneIcon, PaperAirplaneIcon, StopCircleIcon } from "@heroicons/react/24/outline";
import useInterviewSpeech from "../hooks/useInterviewSpeech.js";
import { INTERVIEW_ANSWER_LIMIT } from "../utils/interviewSpeech.js";

export default function AnswerComposer({
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
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button type="button" onClick={() => speech.busy ? speech.stop() : speech.start(answer)}
            disabled={isRequesting || !speech.supported || speech.status === "stopping" || (!speech.busy && answer.length >= INTERVIEW_ANSWER_LIMIT)}
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
        {speech.interim && <div className="mb-2 max-h-24 overflow-y-auto border-l-2 border-violet-300 pl-3 text-xs leading-5 text-slate-600">
          <p className="font-semibold text-slate-500">Đang nhận dạng…</p>
          <p className="break-words">{speech.interim}</p>
        </div>}
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
