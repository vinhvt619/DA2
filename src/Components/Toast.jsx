import React, { createContext, useCallback, useContext, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastUI toast={toast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx)
    throw new Error("useToastContext must be used inside <ToastProvider>");
  return ctx;
}

export function useToast() {
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, []);
  return { toast, showToast };
}

function ToastUI({ toast }) {
  if (!toast?.visible || !toast?.message) return null;

  const styles = {
    success: {
      bg: "bg-green-500",
      icon: <CheckCircleIcon className="w-5 h-5 shrink-0" />,
    },
    error: {
      bg: "bg-red-500",
      icon: <ExclamationCircleIcon className="w-5 h-5 shrink-0" />,
    },
    info: {
      bg: "bg-blue-500",
      icon: <InformationCircleIcon className="w-5 h-5 shrink-0" />,
    },
  };
  const { bg, icon } = styles[toast.type] || styles.info;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white ${bg}`}
      style={{ minWidth: 260, maxWidth: 420 }}
    >
      {icon}
      <span>{toast.message}</span>
    </div>
  );
}

export default function Toast({ toast }) {
  return <ToastUI toast={toast} />;
}
