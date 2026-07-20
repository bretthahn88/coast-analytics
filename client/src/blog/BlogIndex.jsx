import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { MarketingNav } from '../components/MarketingNav.jsx';
import { Footer } from '../components/Footer.jsx';
import { WaveDivider } from '../components/WaveDivider.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { useSEO } from '../lib/useSEO.js';
import { allPosts, getFeaturedPost, getNonFeaturedPosts } from './lib/parsePosts.js';
import { BlogCard } from './BlogCard.jsx';

const PAGE_SIZE = 6;

export default function BlogIndex() {
  useSEO({
    title: 'Blog | Coast Analytics, Hospitality CRM Intelligence',
    description:
      'Data strategy, loyalty economics, and CRM frameworks for multi-property hospitality operators.',
    // TODO: set Coast Analytics blog canonical URL once the production domain is decided
    canonical: '/blog',
  });

  const featured = useMemo(() => getFeaturedPost(), []);
  const rest = useMemo(() => getNonFeaturedPosts(), []);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const paged = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <WaveDivider fill="#E9DDD5" background="#1a1a1a" />
        <PostGrid featured={featured} posts={paged} page={page} totalPages={totalPages} setPage={setPage} totalRest={rest.length} />
        <WaveDivider fill="#99C0BF" background="#E9DDD5" />
        <CTAStrip />
        <WaveDivider fill="#1a1a1a" background="#99C0BF" />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-dark dark-section">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <Reveal><div className="eyebrow mb-4">The Oak Island Blog</div></Reveal>
        <Reveal delay={0.05}>
          <h1 className="h1-hero text-cream max-w-4xl">
            CRM intelligence for <span className="text-gold">hospitality operators.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="subhead mt-6 max-w-3xl">
            Data strategy, loyalty economics, and retention frameworks for multi-property hospitality groups.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function PostGrid({ featured, posts, page, totalPages, setPage, totalRest }) {
  return (
    <section className="bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        {featured && (
          <Reveal>
            <div className="mb-12">
              <BlogCard post={featured} variant="featured" />
            </div>
          </Reveal>
        )}

        {posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((p, i) => (
              <Reveal key={p.frontmatter.slug} delay={0.05 + i * 0.05}>
                <BlogCard post={p} />
              </Reveal>
            ))}
          </div>
        )}

        {posts.length === 0 && !featured && (
          <div className="text-center py-16 text-on-light-muted">
            No posts yet. Check back soon.
          </div>
        )}

        {totalRest > PAGE_SIZE && (
          <Reveal delay={0.2}>
            <div className="mt-12 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-bold uppercase tracking-[0.06em] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1.5px solid #99C0BF', color: '#99C0BF' }}
              >
                <ChevronLeft size={14} />
                Newer
              </button>
              <span className="text-on-light-muted text-[13px]">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-bold uppercase tracking-[0.06em] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1.5px solid #99C0BF', color: '#99C0BF' }}
              >
                Older
                <ChevronRight size={14} />
              </button>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function CTAStrip() {
  return (
    <section className="bg-olive">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 page-section text-center">
        <Reveal>
          <h2 className="h2-section text-cream mb-4">Want this for your portfolio?</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="subhead mb-9">See the predictive platform on a live synthetic hospitality dataset.</p>
        </Reveal>
        <Reveal delay={0.2}>
          <Link to="/demo" className="btn-primary text-[14px]" style={{ padding: '16px 36px' }}>
            Explore the Demo
            <ArrowRight size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
