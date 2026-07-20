import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext({ push: () => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setItems((it) => [...it, { id, message, type }]);
    setTimeout(() => setItems((it) => it.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`toast px-4 py-3 rounded-md border shadow-card-light max-w-sm text-sm`}
            style={{
              fontFamily: 'Georgia, serif',
              background: t.type === 'error' ? '#E9DDD5' : t.type === 'success' ? '#1a1a1a' : '#E9DDD5',
              color:      t.type === 'error' ? '#a83232' : t.type === 'success' ? '#BC7526' : '#1a1a1a',
              borderColor: t.type === 'error' ? '#a83232' : t.type === 'success' ? '#BC7526' : 'rgba(188,117,38,0.5)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
