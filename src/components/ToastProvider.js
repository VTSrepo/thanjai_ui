// One toast (snackbar) for the whole app. Use from components: const toast = useToast(); toast.success("Saved")
// or from plain code: import { toast } from "./ToastProvider".
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

const listeners = new Set();
const emit = (severity, message) => listeners.forEach((l) => l({ severity, message, key: Date.now() + Math.random() }));

export const toast = {
  success: (m) => emit("success", m),
  error: (m) => emit("error", m),
  info: (m) => emit("info", m),
  warning: (m) => emit("warning", m),
};

const ToastContext = createContext(toast);
export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const current = queue[0];

  useEffect(() => {
    const l = (t) => setQueue((q) => [...q, t]);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);

  const close = (e, reason) => {
    if (reason === "clickaway") return;
    setQueue((q) => q.slice(1));
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Snackbar
        key={current?.key}
        open={!!current}
        autoHideDuration={current?.severity === "error" ? 6000 : 3000}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 88, sm: 24 } }}
      >
        {current ? (
          <Alert onClose={close} severity={current.severity} variant="filled" sx={{ width: "100%" }}>
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
