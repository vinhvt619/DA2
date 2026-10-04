import { useEffect, useRef, useState } from "react";
import { createInterviewSpeech, speechSupport } from "../utils/interviewSpeech.js";

export default function useInterviewSpeech({ onText, disabled = false }) {
  const [support] = useState(() => speechSupport(window));
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [interim, setInterim] = useState("");
  const controller = useRef(null);

  useEffect(() => {
    if (!support.Recognition) return undefined;
    const speech = createInterviewSpeech({
      Recognition: support.Recognition,
      onText,
      onStatus: setStatus,
      onError: setError,
      onInterim: setInterim,
    });
    controller.current = speech;
    const handleHidden = () => { if (document.hidden) speech.stop(); };
    const handlePageHide = () => speech.stop();
    document.addEventListener("visibilitychange", handleHidden);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("visibilitychange", handleHidden);
      window.removeEventListener("pagehide", handlePageHide);
      controller.current = null;
      speech.destroy();
    };
  }, [support, onText]);

  useEffect(() => {
    if (disabled) controller.current?.stop();
  }, [disabled]);

  return {
    supported: Boolean(support.Recognition),
    unsupportedReason: support.reason,
    status,
    error,
    interim,
    busy: status !== "idle",
    start: (text) => {
      if (disabled || document.hidden) return;
      setError("");
      controller.current?.start(text);
    },
    stop: () => controller.current?.stop(),
  };
}
