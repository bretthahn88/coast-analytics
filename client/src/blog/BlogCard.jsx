import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatPostDate } from './lib/parsePosts.js';

/**
 * Card used in the /blog grid. Two visual variants:
 *
 *   variant="featured"   full-width hero card with the topo pattern on the
 *                        left and the post copy on the right
 *   variant="standard"   smaller card with the topo pattern banner on top
 *                        and copy below, used in the 2-column grid
 *
 * Every card uses the brand topographic pattern as its hero image, so
 * there are no per-post heroImage asset deps. A `heroImage` frontmatter
 * value will override the topo pattern if explicitly set on a post.
 *
 * The card's top-border color is driven by the post's category, so the
 * grid reads as a varied editorial set without needing unique artwork.
 */

const TOPO_PATTERN_SRC = '/images/blog-topo-pattern.svg';
const TOPO_BG = '#E9DDD5'; // brand-cream-2, matches the SVG's own rect bg

const CATEGORY_ACCENT = {
  strategy:            '#99C0BF', // sage
  product:             '#BC7526', // rust
  marketing:           '#1a1a1a', // charcoal
  hospitality:         '#99C0BF', // sage
  'loyalty economics': '#BC7526', // rust
  'predictive models': '#1a1a1a', // charcoal
};
const DEFAULT_ACCENT = '#BC7526'; // rust

function accentFor(category) {
  if (!category) return DEFAULT_ACCENT;
  return CATEGORY_ACCENT[String(category).toLowerCase()] || DEFAULT_ACCENT;
}

export function BlogCard({ post, variant = 'standard' }) {
  const fm = post.frontmatter;
  const href = `/blog/${fm.slug}`;
  const date = formatPostDate(fm.date);
  const heroSrc = fm.heroImage || TOPO_PATTERN_SRC;
  const accent = accentFor(fm.category);

  if (variant === 'featured') {
    return (
      <Link
        to={href}
        className="block rounded-[12px] overflow-hidden lift-on-hover group"
        style={{
          background: '#ffffff',
          borderTop: `3px solid ${accent}`,
          boxShadow: '0 8px 32px rgba(58,54,53,0.10)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div
            className="relative min-h-[220px] md:min-h-[320px] overflow-hidden"
            style={{ background: TOPO_BG }}
          >
            <img
              src={heroSrc}
              alt=""
              loading="lazy"
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          </div>
          <div className="p-8 md:p-10 flex flex-col">
            <div
              className="eyebrow mb-3"
              style={{ color: accent }}
            >
              {fm.category || 'Article'}
            </div>
            <h2
              className="text-on-light leading-tight mb-3"
              style={{
                fontFamily: 'Poppins, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: '-0.01em',
              }}
            >
              {fm.title}
            </h2>
            <p className="text-on-light text-[17px] leading-[1.7] mb-5 flex-1">{fm.excerpt}</p>
            <div className="text-on-light-muted text-[13px] mb-5">
              By <span className="font-bold text-on-light">{fm.author}</span> · {date} · {fm.readTime}
            </div>
            <span className="inline-flex items-center gap-2 text-olive font-bold text-[15px] group-hover:text-gold transition-colors">
              Read Post
              <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Standard card: topo banner on top, copy below.
  return (
    <Link
      to={href}
      className="block rounded-[12px] overflow-hidden lift-on-hover group h-full flex flex-col"
      style={{
        background: '#ffffff',
        borderTop: `3px solid ${accent}`,
        boxShadow: '0 4px 16px rgba(58,54,53,0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{ background: TOPO_BG, aspectRatio: '4 / 3' }}
      >
        <img
          src={heroSrc}
          alt=""
          loading="lazy"
          aria-hidden="true"
          className="block w-full h-full"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
      </div>
      <div className="p-7 flex flex-col flex-1">
        <div
          className="eyebrow mb-3"
          style={{ color: accent }}
        >
          {fm.category || 'Article'}
        </div>
        <h3
          className="text-on-light leading-tight mb-3"
          style={{
            fontFamily: 'Poppins, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '-0.005em',
          }}
        >
          {fm.title}
        </h3>
        <p
          className="text-[16px] leading-[1.65] mb-5 flex-1"
          style={{
            color: '#1a1a1a',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {fm.excerpt}
        </p>
        <div className="text-on-light-muted text-[13px] mb-3 leading-tight">
          By <span className="font-bold text-on-light">{fm.author}</span> · {date} · {fm.readTime}
        </div>
        <span className="inline-flex items-center gap-2 text-olive font-bold text-[14px] group-hover:text-gold transition-colors">
          Read Post
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
