import React, { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";
import "./ErrorToast.css";

export const ErrorToast: React.FC = () => {
  const lastError = useGameStore((s) => s.lastError);
  const setError = useGameStore((s) => s.setError);

  useEffect(() => {
    if (!lastError) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [lastError, setError]);

  if (!lastError) return null;

  return (
    <div className="error-toast" role="alert">
      <span className="error-toast__code">{lastError.code}</span>
      <span>{lastError.message}</span>
      <button className="error-toast__close" onClick={() => setError(null)} aria-label="Đóng thông báo">
        ✕
      </button>
    </div>
  );
};
