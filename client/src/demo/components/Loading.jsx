export function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-16 text-cream/60">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-gold border-r-transparent animate-spin" />
        <span className="text-[14px]">{label}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message, retry }) {
  return (
    <div
      className="rounded-md p-6 text-[14px]"
      style={{ background: 'rgba(168,50,50,0.12)', border: '1px solid rgba(168,50,50,0.4)' }}
    >
      <div className="font-bold mb-2" style={{ color: '#e8a8a8' }}>Something went wrong.</div>
      <div className="text-cream/70 mb-3">{message}</div>
      {retry && (
        <button
          onClick={retry}
          className="px-3 py-1.5 rounded-md border text-[13px]"
          style={{ borderColor: 'rgba(168,50,50,0.4)', color: '#e8a8a8' }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
