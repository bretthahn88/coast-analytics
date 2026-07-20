/**
 * Wave SVG divider between two sections.
 *
 * `fill`       paints the wave shape (must match the NEXT section's color)
 * `background` paints the area ABOVE the wave (must match the PREVIOUS
 *              section's color). Omitting it lets the body background
 *              (cream) show through above the wave, which reads as a
 *              cream stripe when neither neighbor is cream. Always set
 *              this in practice.
 *
 * Usage:
 *   <WaveDivider fill="#99C0BF" background="#1a1a1a" />   // charcoal -> sage
 *
 * Both edges of the wave SVG are hardened against sub-pixel rounding:
 *
 *   - Bottom: path overshoots viewBox bottom to y=100, .wave-host has
 *     margin-bottom: -2px so the path's overshoot bleeds into the next
 *     section (which is the same color as the path).
 *   - Top: rect overflows viewBox top to y=-20 (extends 20 units above),
 *     .wave-host has margin-top: -2px so the rect's overshoot bleeds
 *     into the previous section (which is the same color as the rect).
 *
 * SVG renders with overflow visible so both overshoots are not clipped.
 * Combined, no sub-pixel rounding can expose a hairline at either edge
 * on high-DPI mobile displays.
 */
export function WaveDivider({ fill = '#99C0BF', background, flip = false, height = 64 }) {
  return (
    <div className="wave-host" aria-hidden="true">
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        width="100%"
        height={height}
        style={{ display: 'block', overflow: 'visible', transform: flip ? 'rotate(180deg)' : 'none' }}
      >
        {background && <rect x="0" y="-20" width="1440" height="120" fill={background} />}
        <path
          d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,100 L0,100 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
