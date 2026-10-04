import { useEffect, useRef, useState } from "react";
import { createInterviewSpeech, microphoneErrorMessage, speechSupport, supportsMicrophoneSelection } from "../utils/interviewSpeech.js";

export default function useInterviewSpeech({ onText, disabled = false }) {
  const [support] = useState(() => speechSupport(window));
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [canSelectMicrophone] = useState(() => supportsMicrophoneSelection(window));
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [loadingDevices, setLoadingDevices] = useState(false);
  const refreshing = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const controller = useRef(null);

  useEffect(() => {
    if (!support.Recognition) return undefined;
    const speech = createInterviewSpeech({
      Recognition: support.Recognition,
      mediaDevices: canSelectMicrophone ? navigator.mediaDevices : undefined,
      onText,
      onStatus: setStatus,
      onError: setError,
    });
    controller.current = speech;
    let alive = true;
    let deviceRevision = 0;
    const updateDevices = async () => {
      const revision = ++deviceRevision;
      try {
        const available = await navigator.mediaDevices.enumerateDevices();
        if (alive && revision === deviceRevision) setDevices(available.filter((device) => device.kind === "audioinput" && device.deviceId && device.deviceId !== "default"));
      } catch { /* Explicit refresh reports errors; devicechange is best-effort. */ }
    };
    if (canSelectMicrophone) {
      void updateDevices();
      navigator.mediaDevices.addEventListener?.("devicechange", updateDevices);
    }
    const handleHidden = () => { if (document.hidden) speech.stop(); };
    const handlePageHide = () => speech.stop();
    document.addEventListener("visibilitychange", handleHidden);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      alive = false;
      if (canSelectMicrophone) navigator.mediaDevices.removeEventListener?.("devicechange", updateDevices);
      document.removeEventListener("visibilitychange", handleHidden);
      window.removeEventListener("pagehide", handlePageHide);
      controller.current = null;
      speech.destroy();
    };
  }, [support, onText, canSelectMicrophone]);

  useEffect(() => {
    if (disabled) controller.current?.stop();
  }, [disabled]);

  return {
    supported: Boolean(support.Recognition),
    unsupportedReason: support.reason,
    status,
    error,
    busy: status !== "idle",
    canSelectMicrophone: Boolean(support.Recognition && canSelectMicrophone),
    devices,
    deviceId,
    loadingDevices,
    selectDevice: (id) => {
      if (disabled || status !== "idle" || refreshing.current) return;
      setError("");
      setDeviceId(id);
    },
    refreshDevices: async () => {
      if (!canSelectMicrophone || disabled || status !== "idle" || refreshing.current) return;
      const current = controller.current;
      if (!current) return;
      refreshing.current = true;
      setLoadingDevices(true);
      setError("");
      try {
        // Labels are hidden until permission is granted. Open only on this
        // explicit click and close immediately, before enumerating devices.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getTracks().forEach((track) => track.stop());
        if (controller.current !== current || disabledRef.current || document.hidden) return;
        const available = await navigator.mediaDevices.enumerateDevices();
        if (controller.current !== current || disabledRef.current) return;
        const inputs = available.filter((device) => device.kind === "audioinput" && device.deviceId && device.deviceId !== "default");
        setDevices(inputs);
        if (!inputs.length) setError("Không tìm thấy microphone. Hãy kiểm tra kết nối thiết bị.");
      } catch (error) {
        if (controller.current === current && !disabledRef.current) setError(microphoneErrorMessage(error));
      } finally {
        refreshing.current = false;
        if (controller.current === current) setLoadingDevices(false);
      }
    },
    start: (text) => {
      if (disabled || refreshing.current || document.hidden) return;
      setError("");
      void controller.current?.start(text, canSelectMicrophone ? deviceId : "");
    },
    stop: () => controller.current?.stop(),
  };
}
