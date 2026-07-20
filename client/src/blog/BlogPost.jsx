import { useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { marked } from 'marked';
import { MarketingNav } from '../components/MarketingNav.jsx';
import { Footer } from '../components/Footer.jsx';
import { WaveDivider } from '../components/WaveDivider.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { useSEO } from '../lib/useSEO.js';
import { getPostBySlug, getRelatedPosts, formatPostDate } from './lib/parsePosts.js';
import { BlogCard } from './BlogCard.jsx';

marked.setOptions({ gfm: true, breaks: true });

export default function BlogPost() {
  const { slug } = useParams();
  const post = useMemo(() => getPostBySlug(slug), [slug]);
  if (!post) return <Navigate to="/blog" replace />;

  const fm = post.frontmatter;
  const html = useMemo(() => marked.parse(post.body), [post.body]);
  const related = useMemo(() => getRelatedPosts(slug, 2), [slug]);

  useSEO({
    title: `${fm.title} | Coast Analytics`,
    description: fm.excerpt,
    ogTitle: fm.title,
    ogDescription: fm.excerpt,
    ogType: 'article',
    // TODO: set Coast Analytics blog canonical URL once the production domain is decided
    canonical: `/blog/${fm.slug}`,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        <PostHeader fm={fm} />
        {/* Topo pattern always renders as the hero band; frontmatter
            heroImage overrides if present. Wave below transitions from
            cream-2 (the topo bg) into the cream PostBody. */}
        <PostHeroImage src={fm.heroImage || '/images/blog-topo-pattern.svg'} alt="" />
        <WaveDivider fill="#E9DDD5" background="#E9DDD5" />
        <PostBody html={html} />
        <WaveDivider fill="#1a1a1a" background="#E9DDD5" />
        <AuthorCard />
        {related.length > 0 && (
          <>
            <WaveDivider fill="#E9DDD5" background="#1a1a1a" />
            <RelatedSection posts={related} />
          </>
        )}
        <WaveDivider fill="#99C0BF" background={related.length > 0 ? '#E9DDD5' : '#1a1a1a'} />
        <PostCTA />
        <WaveDivider fill="#1a1a1a" background="#99C0BF" />
      </main>
      <Footer />
    </div>
  );
}

function PostHeader({ fm }) {
  return (
    <section className="bg-dark dark-section">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 page-section" style={{ maxWidth: 720 }}>
        <Reveal>
          <div className="eyebrow mb-4">{fm.category || 'Article'}</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h1
            className="text-cream"
            style={{
              fontFamily: 'Poppins, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(30px, 5vw, 46px)',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {fm.title}
          </h1>
        </Reveal>

        {fm.excerpt && (
          <Reveal delay={0.15}>
            <p className="subhead mt-5">{fm.excerpt}</p>
          </Reveal>
        )}

        <Reveal delay={0.25}>
          <p className="text-on-dark text-[14px] mt-7">
            By <span className="font-bold text-cream">{fm.author}</span>
            {fm.date ? <> · {formatPostDate(fm.date)}</> : null}
            {fm.readTime ? <> · {fm.readTime}</> : null}
          </p>
        </Reveal>

        <Reveal delay={0.35}>
          <div className="mt-8" style={{ height: 1, background: 'rgba(188,117,38,0.4)' }} />
        </Reveal>
      </div>
    </section>
  );
}

function PostHeroImage({ src, alt }) {
  // Container bg matches the topo-pattern SVG's own rect bg so any
  // letterboxing reads as a single cream-2 band rather than a charcoal
  // flash. maxHeight caps the band on wide viewports.
  return (
    <div
      aria-hidden="true"
      style={{
        background: '#E9DDD5',
        lineHeight: 0,
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="eager"
        style={{
          display: 'block',
          width: '100%',
          maxHeight: 320,
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
    </div>
  );
}

function PostBody({ html }) {
  return (
    <section className="bg-cream">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 page-section" style={{ maxWidth: 720 }}>
        <article className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="mt-12" style={{ height: 1, background: 'rgba(188,117,38,0.4)' }} />
      </div>
    </section>
  );
}

function AuthorCard() {
  return (
    <section className="bg-dark dark-section">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 page-section" style={{ maxWidth: 760 }}>
        <Reveal>
          <div className="eyebrow mb-4">About the Author</div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="card-dark">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src="/OAI_Logo_transparent.png"
                alt="Oak Island AI"
                width="160"
                height="160"
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 12,
                  objectFit: 'contain',
                  background: '#E9DDD5',
                  padding: 12,
                  flex: 'none',
                }}
                loading="lazy"
              />
              <div className="flex-1">
                <div
                  style={{
                    color: '#E9DDD5',
                    fontFamily: 'Poppins, system-ui, sans-serif',
                    fontWeight: 700,
                    fontSize: 21,
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  Oak Island AI
                </div>
                <p className="text-on-dark text-[15px] leading-[1.7] mb-4">
                  A small, family-run marketing firm focused on hospitality, retail, and small-business CRM.
                  Coast Analytics is one of several AI tools built inside the practice.
                </p>
                <Link to="/about" className="inline-flex items-center gap-2 text-gold hover:text-cream transition-colors font-bold">
                  More about Oak Island AI
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function RelatedSection({ posts }) {
  return (
    <section className="bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <Reveal>
          <div className="eyebrow eyebrow-dark mb-4">Related Reading</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-on-light mb-8">
            More from <span className="text-olive">the blog.</span>
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((p, i) => (
            <Reveal key={p.frontmatter.slug} delay={0.1 + i * 0.05}>
              <BlogCard post={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PostCTA() {
  return (
    <section className="bg-olive">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 page-section text-center">
        <Reveal>
          <h2 className="h2-section text-cream mb-4">See the platform behind the strategy.</h2>
        </Reveal>
        <Reveal delay={0.15}>
          <Link to="/demo" className="btn-primary text-[14px]" style={{ padding: '16px 36px' }}>
            Explore the Demo
            <ArrowRight size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
