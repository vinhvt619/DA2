import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmPopUp from "../Components/ConfirmPopUp.jsx";

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const resolverRef = useRef(null);
  const [message, setMessage] = useState("");

  const closeDialog = useCallback((confirmed) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setMessage("");
  }, []);

  const confirm = useCallback((nextMessage) => {
    resolverRef.current?.(false);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setMessage(
        nextMessage || "Bạn có chắc chắn muốn thực hiện hành động này không?",
      );
    });
  }, []);

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {message && (
        <ConfirmPopUp
          message={message}
          confirm={() => closeDialog(true)}
          cancel={() => closeDialog(false)}
        />
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const confirm = useContext(ConfirmDialogContext);
  if (!confirm) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return confirm;
}
