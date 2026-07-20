/**
 * Coast Analytics lockup. Uses the official transparent OAI heron
 * mark so it sits naturally on any brand surface (sage nav, charcoal dark
 * sections, cream pages). The wordmark to the right of the mark is colored
 * for contrast against each background.
 *
 * `tone` selects the foreground color of the "Coast Analytics" wordmark:
 *
 *   "on-sage"  (default) : brand-sage background, charcoal wordmark
 *                          (cream fails WCAG AA on sage; charcoal passes ~5.8:1)
 *   "on-dark"            : brand-charcoal background, cream wordmark
 *   "on-light"           : brand-cream background, charcoal wordmark
 */
export function Logo({ size = 36, tone = 'on-sage', withWordmark = true, className = '' }) {
  const palette =
    tone === 'on-dark'  ? { text: '#E9DDD5', divider: 'rgba(245,240,232,0.35)' }
  : tone === 'on-light' ? { text: '#1a1a1a', divider: 'rgba(58,54,53,0.25)' }
  :                       { text: '#1a1a1a', divider: 'rgba(58,54,53,0.25)' }; // on-sage: charcoal text

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/OAI_Logo_transparent.png"
        alt="Oak Island AI"
        style={{
          height: size,
          width: 'auto',
          display: 'block',
        }}
      />
      {withWordmark && (
        <span
          style={{
            color: palette.text,
            fontFamily: 'Poppins, system-ui, sans-serif',
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
            borderLeft: `1px solid ${palette.divider}`,
            paddingLeft: 12,
          }}
        >
          Coast Analytics
        </span>
      )}
    </div>
  );
}
