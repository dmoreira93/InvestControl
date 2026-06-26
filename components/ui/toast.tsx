'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'neon' | 'red';
}

interface ToastContextValue {
  showToast: (message: string, type?: 'neon' | 'red') => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'neon' | 'red' = 'neon') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`bg-surface-2 border border-border px-[18px] py-[13px] rounded-[10px] text-[13.5px] shadow-2xl max-w-[320px] animate-in slide-in-from-right
              ${t.type === 'red' ? 'border-l-[3px] border-l-red' : 'border-l-[3px] border-l-neon'}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de um ToastProvider');
  return ctx;
}
