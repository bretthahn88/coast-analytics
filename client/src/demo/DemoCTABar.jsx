import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { useDemoChrome } from './DemoChromeContext.jsx';

/**
 * Persistent bottom bar inside /demo. Appears after the visitor has been on
 * the (post-gate) demo for 60 seconds. Dismissible; once dismissed it stays
 * gone for the rest of the browser session.
 *
 * Mount only AFTER the gate is unlocked so the timer does not start while
 * the visitor is still on the gate.
 *
 * Routes to /contact so the lead lands in the Coast Analytics site's own
 * Formspree form rather than the parent firm's site.
 */
const STORAGE_KEY = 'ilp_demo_cta_dismissed';
const DELAY_MS = 60_000;

export function DemoCTABar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { setCtaBarVisible } = useDemoChrome();

  useEffect(() => {
    let alreadyDismissed = false;
    try { alreadyDismissed = sessionStorage.getItem(STORAGE_KEY) === 'true'; }
    catch { /* incognito */ }
    if (alreadyDismissed) {
      setDismissed(true);
      return;
    }
    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const onScreen = visible && !dismissed;
  useEffect(() => {
    setCtaBarVisible(onScreen);
    return () => setCtaBarVisible(false);
  }, [onScreen, setCtaBarVisible]);

  if (!onScreen) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(STORAGE_KEY, 'true'); } catch { /* incognito */ }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Book a call"
      className="fixed bottom-0 inset-x-0 z-30"
      style={{
        background: '#1a1a1a',
        borderTop: '1px solid rgba(188,117,38,0.4)',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div
            style={{
              color: '#BC7526',
              fontFamily: 'Poppins, system-ui, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '-0.005em',
              lineHeight: 1.3,
            }}
          >
            Seeing something that looks familiar?
          </div>
          <div className="text-cream/65 text-[13px] mt-1 hidden sm:block">
            Book a 30-minute consultation with Oak Island AI, no slide deck, just your data.
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 self-stretch sm:self-auto">
          <Link to="/contact" className="btn-primary !py-3 !px-5 !text-[12px] flex-1 sm:flex-none">
            Book a Call
            <ArrowRight size={14} />
          </Link>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-cream/60 hover:text-gold p-2 rounded-md transition-colors flex-none"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
