export const INTERVIEW_ANSWER_LIMIT = 1200;

export function speechSupport(scope) {
  if (!scope?.isSecureContext) return { reason: "Mic cần kết nối HTTPS hoặc localhost. Bạn vẫn có thể gõ câu trả lời." };
  const Recognition = scope.SpeechRecognition || scope.webkitSpeechRecognition;
  return Recognition
    ? { Recognition, reason: "" }
    : { reason: "Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Bạn vẫn có thể gõ câu trả lời." };
}

export function speechErrorMessage(code) {
  const messages = {
    "not-allowed": "Chưa được cấp quyền mic. Hãy cho phép mic trong cài đặt trang rồi thử lại, hoặc gõ câu trả lời.",
    "service-not-allowed": "Dịch vụ nhận dạng giọng nói bị chặn. Bạn có thể gõ câu trả lời.",
    "audio-capture": "Không tìm thấy mic khả dụng. Hãy kiểm tra thiết bị hoặc gõ câu trả lời.",
    "no-speech": "Chưa nhận được lời nói. Hãy thử nói lại hoặc gõ câu trả lời.",
    network: "Không kết nối được dịch vụ nhận dạng giọng nói. Văn bản đang có vẫn được giữ lại.",
    "language-not-supported": "Dịch vụ hiện không hỗ trợ nhận dạng tiếng Việt. Bạn có thể gõ câu trả lời.",
  };
  return messages[code] || "Không thể nhận dạng giọng nói lúc này. Hãy thử lại hoặc gõ câu trả lời.";
}

// Only transcribes into a draft. Never sends audio/text to the interview API.
export function createInterviewSpeech({ Recognition, onText, onStatus, onError, onInterim = () => {}, maxLength = INTERVIEW_ANSWER_LIMIT }) {
  let active = null;
  let destroyed = false;
  let stopping = false;
  let stopTimer;
  let sessionTimer;

  const detach = (recognition) => {
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
  };
  const release = ({ abort = false, notify = true } = {}) => {
    clearTimeout(stopTimer);
    clearTimeout(sessionTimer);
    const recognition = active;
    active = null;
    if (!destroyed) onInterim("");
    if (recognition) {
      detach(recognition);
      if (abort) {
        try { recognition.abort(); } catch { /* Already closed by the browser. */ }
      }
    }
    if (notify && !destroyed) onStatus("idle");
  };

  const stop = () => {
    if (!active || destroyed || stopping) return;
    stopping = true;
    onStatus("stopping");
    const recognition = active;
    // Some engines never deliver `end` after stop: always release the mic.
    stopTimer = setTimeout(() => {
      if (active === recognition) release({ abort: true });
    }, 5000);
    try { recognition.stop(); } catch { release({ abort: true }); }
  };

  const startRecognition = (prefix) => {
      try {
        const recognition = new Recognition();
        active = recognition;
        stopping = false;
        let finalTranscript = "";
        let interimTranscript = "";
        let limitReached = false;
        recognition.lang = "vi-VN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => {
          if (active !== recognition || destroyed || stopping) return;
          onStatus("listening");
          sessionTimer = setTimeout(stop, 120000);
        };
        recognition.onresult = (event) => {
          if (active !== recognition || destroyed || limitReached || !event.results) return;
          // Interim hypotheses can change or disappear. Only final results
          // belong in the answer; rebuild the cumulative list to avoid repeats.
          const results = Array.from(event.results);
          const textFor = (final) => results.filter((result) => result.isFinal === final)
            .map((result) => result[0]?.transcript || "").join(" ").replace(/\s+/g, " ").trim();
          interimTranscript = textFor(false);
          onInterim(interimTranscript);
          const transcript = textFor(true);
          if (!transcript || transcript === finalTranscript) return;
          finalTranscript = transcript;
          const draft = `${prefix}${prefix && !/\s$/.test(prefix) ? " " : ""}${finalTranscript}`;
          onText(draft.slice(0, maxLength));
          if (draft.length >= maxLength) {
            limitReached = true;
            onError(`Đã đạt ${maxLength} ký tự; mic đã dừng. Hãy kiểm tra phần văn bản được giữ lại trước khi gửi.`);
            stop();
          }
        };
        recognition.onerror = (event) => {
          if (active !== recognition || destroyed) return;
          if (event.error !== "aborted") onError(speechErrorMessage(event.error));
          release({ abort: true });
        };
        recognition.onend = () => {
          if (active !== recognition || destroyed) return;
          if (interimTranscript && !limitReached) {
            onError("Phần lời nói cuối chưa được nhận dạng hoàn tất nên chưa điền vào câu trả lời. Hãy bật mic để nói lại phần đó hoặc gõ bổ sung.");
          } else if (!finalTranscript && !limitReached) {
            onError(speechErrorMessage("no-speech"));
          }
          release();
        };
        onStatus("starting");
        recognition.start();
        return true;
      } catch (error) {
        release({ abort: true });
        onError(speechErrorMessage(["NotAllowedError", "SecurityError"].includes(error.name) ? "not-allowed" : "start-failed"));
        return false;
      }
  };

  return {
    start(baseText = "") {
      if (destroyed || active || !Recognition) return false;
      const prefix = String(baseText);
      if (prefix.length >= maxLength) {
        onError(`Câu trả lời đã đạt ${maxLength} ký tự. Hãy chỉnh sửa trước khi dùng mic.`);
        return false;
      }
      return startRecognition(prefix);
    },
    stop,
    destroy() {
      destroyed = true;
      release({ abort: true, notify: false });
    },
  };
}
