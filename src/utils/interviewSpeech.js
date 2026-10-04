export const INTERVIEW_ANSWER_LIMIT = 1200;

export function supportsMicrophoneSelection(scope) {
  const navigator = scope?.navigator;
  const ua = navigator?.userAgent || "";
  // Older engines silently ignore start(audioTrack). Restrict selection to
  // known desktop Chromium implementations rather than using the wrong mic.
  const chromium = ua.match(/(?:Chrome|Chromium)\/(\d+)/);
  return Boolean(scope?.isSecureContext && chromium && Number(chromium[1]) >= 135
    && !/Android|iPhone|iPad|iPod|Mobile/i.test(ua) && !navigator?.userAgentData?.mobile
    && navigator?.mediaDevices?.getUserMedia && navigator?.mediaDevices?.enumerateDevices);
}

export function microphoneErrorMessage(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") return speechErrorMessage("not-allowed");
  if (["NotFoundError", "OverconstrainedError"].includes(error?.name)) return "Mic đã chọn không còn khả dụng. Hãy tải lại danh sách và chọn mic khác; ứng dụng không tự chuyển sang mic khác.";
  if (error?.name === "NotReadableError") return "Không mở được mic đã chọn. Hãy kiểm tra kết nối hoặc ứng dụng khác đang sử dụng mic.";
  return "Không thể mở mic hoặc tải danh sách thiết bị. Hãy thử lại hoặc gõ câu trả lời.";
}

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
export function createInterviewSpeech({ Recognition, mediaDevices, onText, onStatus, onError, maxLength = INTERVIEW_ANSWER_LIMIT }) {
  let active = null;
  let pending = null;
  let stream = null;
  let removeTrackListener = () => {};
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
    pending = null;
    removeTrackListener();
    removeTrackListener = () => {};
    if (recognition) {
      detach(recognition);
      if (abort) {
        try { recognition.abort(); } catch { /* Already closed by the browser. */ }
      }
    }
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (notify && !destroyed) onStatus("idle");
  };

  const stop = () => {
    if (pending) { release({ abort: true }); return; }
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

  const startRecognition = (prefix, audioTrack) => {
      try {
        if (audioTrack && (audioTrack.kind !== "audio" || audioTrack.readyState !== "live")) {
          throw Object.assign(new Error("Microphone disconnected"), { name: "NotFoundError" });
        }
        const recognition = new Recognition();
        active = recognition;
        stopping = false;
        let heardSpeech = false;
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
          // Results are cumulative in a session. Rebuild instead of appending
          // on every event, otherwise interim revisions duplicate words.
          const transcript = Array.from(event.results)
            .map((result) => result[0]?.transcript || "").join(" ").replace(/\s+/g, " ").trim();
          if (!transcript) return;
          heardSpeech = true;
          const draft = `${prefix}${prefix && !/\s$/.test(prefix) ? " " : ""}${transcript}`;
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
          if (!heardSpeech) onError(speechErrorMessage("no-speech"));
          release();
        };
        if (audioTrack) {
          const handleEnded = () => {
            if (active !== recognition || destroyed) return;
            onError(microphoneErrorMessage({ name: "NotFoundError" }));
            release({ abort: true });
          };
          audioTrack.addEventListener("ended", handleEnded);
          removeTrackListener = () => audioTrack.removeEventListener("ended", handleEnded);
        }
        onStatus("starting");
        if (audioTrack) recognition.start(audioTrack);
        else recognition.start();
        return true;
      } catch (error) {
        release({ abort: true });
        onError(audioTrack ? microphoneErrorMessage(error) : speechErrorMessage(error.name === "NotAllowedError" ? "not-allowed" : "start-failed"));
        return false;
      }
  };

  return {
    start(baseText = "", deviceId = "") {
      if (destroyed || active || pending || !Recognition) return false;
      const prefix = String(baseText);
      if (prefix.length >= maxLength) {
        onError(`Câu trả lời đã đạt ${maxLength} ký tự. Hãy chỉnh sửa trước khi dùng mic.`);
        return false;
      }
      if (!deviceId) return startRecognition(prefix);
      const token = {};
      pending = token;
      onStatus("starting");
      return (async () => {
        let captured;
        try {
          captured = await mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } }, video: false });
          if (destroyed || pending !== token) {
            captured.getTracks().forEach((track) => track.stop());
            return false;
          }
          pending = null;
          stream = captured;
          const track = captured.getAudioTracks()[0];
          // Fail closed if a browser returns a different input.
          if (!track || track.getSettings().deviceId !== deviceId) {
            throw Object.assign(new Error("Wrong microphone"), { name: "NotFoundError" });
          }
          return startRecognition(prefix, track);
        } catch (error) {
          if (!destroyed && (pending === token || (captured && stream === captured))) {
            release({ abort: true });
            onError(microphoneErrorMessage(error));
          }
          return false;
        }
      })();
    },
    stop,
    destroy() {
      destroyed = true;
      release({ abort: true, notify: false });
    },
  };
}
