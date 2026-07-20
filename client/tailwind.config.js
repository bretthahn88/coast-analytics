/** @type {import('tailwindcss').Config} */
/*
 * Canonical Indian Lakes Marketing brand tokens.
 *
 * Sourced from the live indianlakesmarketing.com site (`src/app/page.tsx`,
 * `ai-tools/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`), which uses these
 * hex values inline. The ILM `tailwind.config.ts` is stale and still names
 * the sage value as `teal: #7fa8a8`; the live pages use `#95aead`, so that
 * is the source of truth for the brand color.
 *
 *   brand-sage     #95aead   nav, secondary section bg, CTA strips
 *   brand-charcoal #3a3635   dark section bg, body text on light
 *   brand-rust     #c27c2a   accent, hero headline highlight, primary buttons
 *   brand-cream    #f5f0e8   page background, light section bg
 *   brand-cream-2  #eee5d3   warm secondary cream (cards, alternating bands)
 *   brand-tan      #e0d4bc   accent (rare, mostly the heron disc in logos)
 *   brand-black    #1a1a1a   deepest text, alternate dark section
 *
 * Legacy tailwind names (cream, dark, olive, gold, mid-olive, dark-cream)
 * are kept as aliases pointing at the canonical brand values so existing
 * class names (e.g. `bg-olive`, `text-gold`) keep working and now resolve
 * to the correct brand color.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Canonical brand tokens.
        'brand-sage':     '#95aead',
        'brand-sage-deep':'#6c8585', // darker sage for card-on-charcoal surfaces
        'brand-charcoal': '#3a3635',
        'brand-rust':     '#c27c2a',
        'brand-cream':    '#f5f0e8',
        'brand-cream-2':  '#eee5d3',
        'brand-tan':      '#e0d4bc',
        'brand-black':    '#1a1a1a',

        // Legacy aliases pointing at the brand tokens above. Kept so existing
        // markup keeps working after the brand swap.
        dark:        '#3a3635', // brand-charcoal
        olive:       '#95aead', // brand-sage (was #7fa8a8 placeholder teal)
        gold:        '#c27c2a', // brand-rust
        cream:       '#f5f0e8', // brand-cream
        'mid-olive': '#6c8585', // darker sage for card-dark surfaces
        'dark-cream':'#e0d4bc', // brand-tan
        'body-dark': '#3a3635',
        muted:       '#6b6562',
        'cream-2':   '#eee5d3', // brand-cream-2 (was #ece6d8 drift)

        bg:    '#3a3635',
        card:  '#6c8585',
        border:'rgba(194,124,42,0.30)',
        pine: {
          DEFAULT: '#c27c2a',
          deep:    '#95aead',
          dark:    '#6c8585',
        },
        amber: { DEFAULT: '#c27c2a' }, // alias for brand-rust
        alert: { DEFAULT: '#a83232' },
        ink: {
          DEFAULT: '#f5f0e8',
          muted:   'rgba(245,240,232,0.85)',
          dim:     'rgba(245,240,232,0.5)',
        },
        // Direct semantic aliases used in some components
        sage:     '#95aead',
        charcoal: '#3a3635',
        rust:     '#c27c2a',
        tan:      '#e0d4bc',
      },
      fontFamily: {
        sans:    ['Poppins', 'system-ui', 'sans-serif'],
        serif:   ['Poppins', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        eyebrow: '0.12em',
        cta:     '0.07em',
      },
      boxShadow: {
        'card-dark':  '0 8px 32px rgba(58,54,53,0.25)',
        'card-light': '0 4px 16px rgba(58,54,53,0.10)',
      },
    },
  },
  plugins: [],
};
