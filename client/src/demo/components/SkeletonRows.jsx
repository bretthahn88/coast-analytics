/**
 * Animated ghost rows for the pre-run state on every model page.
 * Uses a CSS keyframe defined inline so we don't have to plumb a class
 * through the global stylesheet.
 */
export function SkeletonRows({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-md overflow-hidden"
          style={{
            background: 'rgba(74,80,18,0.6)',
            height: 44,
            position: 'relative',
            animation: 'pp-skeleton-shimmer 1.6s linear infinite',
            animationDelay: `${i * 0.12}s`,
            backgroundImage:
              'linear-gradient(90deg, rgba(74,80,18,0) 0%, rgba(194,124,42,0.18) 50%, rgba(74,80,18,0) 100%)',
            backgroundSize: '200% 100%',
            backgroundRepeat: 'no-repeat',
          }}
          aria-hidden="true"
        />
      ))}
      <style>{`
        @keyframes pp-skeleton-shimmer {
          0%   { background-position: -100% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Empty-state wrapper shown above the skeleton rows.
 */
export function PreRunEmpty({ children = 'Configure filters and run the model to see results.' }) {
  return (
    <div className="rounded-md border border-gold/15 px-5 py-4 mb-3" style={{ background: 'rgba(194,124,42,0.04)' }}>
      <p className="text-cream/70 text-[14px] leading-[1.6]">{children}</p>
    </div>
  );
}
