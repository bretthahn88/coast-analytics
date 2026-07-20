import { Info } from 'lucide-react';

export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: '#238287',
        borderTop: '3px solid #BC7526',
        boxShadow: '0 8px 32px rgba(58,54,53,0.25)',
        color: '#E9DDD5',
      }}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gold/15">
          <div>
            {title && (
              <div className="text-[18px] font-bold tracking-tight text-cream leading-tight">{title}</div>
            )}
            {subtitle && <div className="text-cream/60 text-[13px] mt-0.5">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export function EmbedNote({ children }) {
  return (
    <div
      className="mt-4 text-[14px] flex items-start gap-2 px-4 py-3 rounded-md leading-[1.6]"
      style={{
        background: 'rgba(188,117,38,0.08)',
        border: '1px solid rgba(188,117,38,0.4)',
        color: '#BC7526',
      }}
    >
      <Info size={16} className="mt-0.5 flex-none" />
      <div>{children}</div>
    </div>
  );
}
