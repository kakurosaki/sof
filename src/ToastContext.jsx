import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import "./ToastContext.css";

const ToastContext = createContext(null);

const variantClassMap = {
  success: "text-bg-success",
  info: "text-bg-info",
  warning: "text-bg-warning",
  danger: "text-bg-danger",
};

function normalizeToast(toast) {
  return {
    id: toast.id,
    title: toast.title,
    message: toast.message,
    variant: toast.variant || "success",
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const idRef = useRef(0);

  function removeToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }

  function notify({ title, message, variant = "success", duration = 3500 }) {
    const id = ++idRef.current;
    const toast = normalizeToast({ id, title, message, variant });

    setToasts((prev) => [...prev, toast]);

    const timer = window.setTimeout(() => {
      removeToast(id);
    }, duration);

    timersRef.current.set(id, timer);
    return id;
  }

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(() => ({ notify, removeToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="app-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast show app-toast ${variantClassMap[toast.variant] || variantClassMap.success}`}
            role="alert"
          >
            <div className="d-flex align-items-start">
              <div className="toast-body flex-grow-1">
                {toast.title && <div className="fw-semibold">{toast.title}</div>}
                {toast.message && <div className="small">{toast.message}</div>}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 mt-2"
                aria-label="Close"
                onClick={() => removeToast(toast.id)}
              ></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}