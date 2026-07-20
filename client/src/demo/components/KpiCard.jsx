/**
 * KPI card on a dark section: olive (#238287) background, gold top border.
 * Pass `accent` to change the value-text color: gold | cream | gold-bright | alert.
 */
export function KpiCard({ label, value, sub, accent = 'gold', icon = null }) {
  const accentMap = {
    gold:  { color: '#BC7526' },
    cream: { color: '#E9DDD5' },
    'gold-bright': { color: '#E9DDD5' },
    alert: { color: '#E9DDD5' },
    pine:  { color: '#BC7526' },
    amber: { color: '#BC7526' },
    ink:   { color: '#E9DDD5' },
  };
  return (
    <div
      className="rounded-xl"
      style={{
        background: '#238287',
        borderTop: '3px solid #BC7526',
        padding: '20px 24px',
        boxShadow: '0 8px 32px rgba(58,54,53,0.25)',
        transition: 'transform 0.2s ease',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="eyebrow">{label}</div>
        {icon && <div style={{ color: '#BC7526' }}>{icon}</div>}
      </div>
      <div
        className="mt-2 font-bold tracking-tight"
        style={{ color: accentMap[accent]?.color || '#BC7526', fontSize: 30, lineHeight: 1.1 }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-cream/60 text-[13px]">{sub}</div>}
    </div>
  );
}
