import { useDemoChrome } from './DemoChromeContext.jsx';

/**
 * Demo Mode pill, fixed bottom-left. Hides while DemoCTABar is on screen so
 * the two do not overlap.
 */
export function DemoBadge() {
  const { ctaBarVisible } = useDemoChrome();
  if (ctaBarVisible) return null;
  return (
    <div className="fixed bottom-4 left-4 z-40 select-none pointer-events-none">
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-bold tracking-[0.12em] uppercase"
        style={{ background: '#1a1a1a', color: '#BC7526', fontSize: 10 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
        Demo Mode · Synthetic Data
      </div>
    </div>
  );
}
