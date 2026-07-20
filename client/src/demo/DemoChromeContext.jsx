import { createContext, useContext, useState } from 'react';

/**
 * Coordinates the two fixed-position demo overlays (DemoBadge bottom-left,
 * DemoCTABar bottom full-width). Currently exposes one boolean:
 *
 *   ctaBarVisible -- DemoCTABar sets this true when it renders, false when
 *                    dismissed or before the 60s timer fires. DemoBadge reads
 *                    it and renders null while the bar is up so the two
 *                    don't stack.
 *
 * Provider lives in DemoApp wrapping only the unlocked-content branch (the
 * gate has no fixed overlays, so it doesn't need the context).
 */
const DemoChromeCtx = createContext({
  ctaBarVisible: false,
  setCtaBarVisible: () => {},
});

export function DemoChromeProvider({ children }) {
  const [ctaBarVisible, setCtaBarVisible] = useState(false);
  return (
    <DemoChromeCtx.Provider value={{ ctaBarVisible, setCtaBarVisible }}>
      {children}
    </DemoChromeCtx.Provider>
  );
}

export function useDemoChrome() {
  return useContext(DemoChromeCtx);
}
