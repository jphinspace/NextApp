'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastMsg = { id: string; text: string; type?: 'success' | 'error' };

const ToastContext = createContext<{
  push: (t: Omit<ToastMsg, 'id'>) => void;
}>({ push: () => {} });

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(mq.matches);
    const onChange = () => setPrefers(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return prefers;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const timers = useRef<Record<string, number>>({});
  const prefersReduced = usePrefersReducedMotion();

  function remove(id: string) {
    setToasts((s) => s.filter((t) => t.id !== id));
    const t = timers.current[id];
    if (t) window.clearTimeout(t);
    delete timers.current[id];
  }

  function push(t: Omit<ToastMsg, 'id'>) {
    const id = String(Date.now());
    const msg: ToastMsg = { id, ...t };
    setToasts((s) => [...s, msg]);
    // auto-dismiss
    const timeout = window.setTimeout(() => remove(id), 4000);
    timers.current[id] = timeout;
  }

  // keyboard dismiss (Esc)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setToasts([]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // only render portal content after hydration to avoid SSR/client markup mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999 }}
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                onMouseEnter={() => {
                  // pause timer
                  const id = t.id;
                  const to = timers.current[id];
                  if (to) {
                    window.clearTimeout(to);
                    delete timers.current[id];
                  }
                }}
                onMouseLeave={() => {
                  // resume timer
                  const id = t.id;
                  if (!timers.current[id]) {
                    timers.current[id] = window.setTimeout(() => remove(id), 2000);
                  }
                }}
                style={{
                  marginBottom: 8,
                  padding: '8px 12px',
                  background:
                    t.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
                  borderRadius: 6,
                  color: t.type === 'success' ? 'green' : 'crimson',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  // respect reduced motion by not animating
                  transition: prefersReduced ? 'none' : 'transform 160ms ease, opacity 160ms ease',
                }}
              >
                <div style={{ flex: 1 }}>{t.text}</div>
                <button
                  aria-label="Dismiss"
                  onClick={() => remove(t.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>,
          document.getElementById('toast-root') || document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export default ToastProvider;
