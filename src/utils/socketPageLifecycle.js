export function bindSocketPageLifecycle({ target = window, documentTarget = document, onSuspend, onRestore }) {
  let suspended = false;
  const suspend = () => {
    if (suspended) return;
    suspended = true;
    onSuspend();
  };
  const restore = () => {
    if (!suspended) return;
    suspended = false;
    onRestore();
  };
  const onPageShow = (event) => { if (event.persisted) restore(); };
  target.addEventListener("pagehide", suspend);
  target.addEventListener("pageshow", onPageShow);
  documentTarget.addEventListener("freeze", suspend);
  documentTarget.addEventListener("resume", restore);
  return () => {
    target.removeEventListener("pagehide", suspend);
    target.removeEventListener("pageshow", onPageShow);
    documentTarget.removeEventListener("freeze", suspend);
    documentTarget.removeEventListener("resume", restore);
  };
}
