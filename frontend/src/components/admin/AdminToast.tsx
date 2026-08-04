'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function AdminToast({
  message,
  error,
  onDismissMessage,
  onDismissError,
  durationMs = 3500,
}: {
  message: string | null;
  error: string | null;
  onDismissMessage: () => void;
  onDismissError: () => void;
  durationMs?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDismissMessage, durationMs);
    return () => window.clearTimeout(t);
  }, [message, durationMs, onDismissMessage]);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(onDismissError, durationMs);
    return () => window.clearTimeout(t);
  }, [error, durationMs, onDismissError]);

  if (!mounted || (!message && !error)) return null;

  return createPortal(
    <div
      className="admin-panel font-admin pointer-events-none fixed bottom-6 right-6 z-[9999] flex w-[min(100%-2rem,22rem)] flex-col gap-2 antialiased"
      aria-live="polite"
    >
      {message && (
        <div className="pointer-events-auto animate-rise rounded-xl border border-green/35 bg-[#0f1a14] px-4 py-3 text-sm text-green shadow-xl shadow-black/40">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green/20 text-green">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <p className="min-w-0 flex-1 font-medium leading-snug">{message}</p>
            <button
              type="button"
              onClick={onDismissMessage}
              className="shrink-0 text-green/60 transition hover:text-green"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="pointer-events-auto animate-rise rounded-xl border border-danger/35 bg-[#1a1010] px-4 py-3 text-sm text-danger shadow-xl shadow-black/40">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/20 text-danger">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
            </span>
            <p className="min-w-0 flex-1 font-medium leading-snug">{error}</p>
            <button
              type="button"
              onClick={onDismissError}
              className="shrink-0 text-danger/60 transition hover:text-danger"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
