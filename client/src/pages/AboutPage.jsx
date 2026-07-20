import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { MarketingNav } from '../components/MarketingNav.jsx';
import { Footer } from '../components/Footer.jsx';
import { WaveDivider } from '../components/WaveDivider.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { useSEO } from '../lib/useSEO.js';

const OAI_SITE = 'https://oak-island-ai.vercel.app/consultation';
const BRETT_LINKEDIN = 'https://www.linkedin.com/in/brett-hahn-142b5163/';

/**
 * Brett-first credibility-led About page.
 *
 * Section rhythm:
 *   1. Hero          charcoal  two-column, headshot right (top on mobile)
 *   2. Experience    cream-2   Caesars / Vail / Comcast bar
 *   3. The Thesis    cream     long-form credibility narrative
 *   4. The Firm      sage      Oak Island AI context
 *   5. CTA           charcoal  Book a Call + See the Live Demo
 *   6. Footer        charcoal  (handled by <Footer/>)
 */
export default function AboutPage() {
  useSEO({
    title: 'About Brett Hahn | Coast Analytics',
    description:
      'Fifteen years running CRM, loyalty, and lifecycle marketing at Caesars Entertainment, Vail Resorts, and Comcast. Coast Analytics brings enterprise-grade predictive analytics to operators who do not have an enterprise team to run it themselves.',
  });
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <WaveDivider fill="#E9DDD5" background="#1a1a1a" />
        <Experience />
        <WaveDivider fill="#E9DDD5" background="#E9DDD5" />
        <Thesis />
        <WaveDivider fill="#99C0BF" background="#E9DDD5" />
        <Firm />
        <WaveDivider fill="#1a1a1a" background="#99C0BF" />
        <CTA />
        <WaveDivider fill="#1a1a1a" background="#1a1a1a" />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-dark dark-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-24 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-12 items-center">
          {/* Text column. order-1 on mobile so credentials lead (pill,
              headline, tagline, body, LinkedIn button); md:order-none lets
              the desktop 5-col grid place it in cols 1-3. */}
          <div className="md:col-span-3 order-1 md:order-none">
            <Reveal>
              <span
                className="inline-flex items-center gap-2 eyebrow px-3 py-1 rounded-full
                           border border-gold/40 bg-gold/10 mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                About the Founder
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="h1-hero text-cream max-w-3xl">
                Brett Hahn
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="subhead mt-5 max-w-2xl">
                Built for operators, by an operator.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-6 text-on-dark text-[17px] leading-[1.8] max-w-2xl">
                Fifteen years running CRM, loyalty, and lifecycle marketing at enterprise scale. Built for
                the operators who don't have an enterprise team to run it themselves.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="mt-8">
                <a
                  href={BRETT_LINKEDIN}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn-outline"
                >
                  Connect on LinkedIn
                  <ExternalLink size={16} />
                </a>
              </div>
            </Reveal>
          </div>

          {/* Photo column. order-2 on mobile so it falls below the text
              block; the h-[360px] cap plus object-cover prevents the tall
              1024x1536 source from dominating the viewport. On desktop the
              cap drops and the image renders at its natural aspect in
              cols 4-5. */}
          <Reveal className="md:col-span-2 order-2 md:order-none">
            <div
              className="rounded-[12px] overflow-hidden"
              style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
            >
              <img
                src="/images/brett-bio-cropped.png"
                alt="Brett Hahn, founder of Oak Island AI"
                loading="eager"
                className="block w-full h-[360px] md:h-auto object-cover"
                style={{ objectPosition: 'center center' }}
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section style={{ background: '#E9DDD5' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 page-section text-center">
        <Reveal>
          <div className="eyebrow eyebrow-dark mb-5">Previous Experience</div>
        </Reveal>
        <Reveal delay={0.05}>
          <div
            className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-y-2 leading-[1.15]"
            style={{
              fontFamily: 'Poppins, system-ui, sans-serif',
              fontWeight: 700,
              color: '#BC7526',
              fontSize: 'clamp(24px, 4vw, 40px)',
              letterSpacing: '-0.01em',
            }}
          >
            <span className="whitespace-nowrap">Caesars Entertainment</span>
            <span className="hidden md:inline mx-3 text-on-light/40">·</span>
            <span className="whitespace-nowrap">Vail Resorts</span>
            <span className="hidden md:inline mx-3 text-on-light/40">·</span>
            <span className="whitespace-nowrap">Comcast</span>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 text-on-light text-[16px] leading-[1.75] max-w-3xl mx-auto">
            Fifteen years building and operating CRM, loyalty, and lifecycle marketing programs across
            gaming, retail hospitality, and consumer telecom.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Thesis() {
  return (
    <section className="bg-cream">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 page-section" style={{ maxWidth: 720 }}>
        <Reveal>
          <div className="eyebrow eyebrow-dark mb-4">The Thesis</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-on-light mb-8">
            Why Coast Analytics exists.
          </h2>
        </Reveal>

        <div className="space-y-6 text-on-light text-[17px] leading-[1.8]">
          <Reveal delay={0.1}>
            <p>
              For most of my career, predictive analytics was something only the biggest operators could
              afford. At Caesars, I supervised CRM operations across the Atlantic City and Philadelphia
              markets, working with audiences of five million guests across email, direct mail, and an
              eight-person team. At Vail Resorts, I led CRM for the entire retail division, covering more
              than 250 stores and the ski rental ecommerce program for a two-million-plus audience. At
              Comcast, I helped build out the centralized CRM team for Comcast Cable, with thirty million
              customers and another twenty million prospects in the pipeline.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p>
              The pattern was always the same.{' '}
              <span className="text-olive font-bold">
                Operators who acted on predictive signals won.
              </span>{' '}
              Operators who reacted to last quarter's reports lost.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p>
              <span className="text-olive font-bold">AI changed the math on this.</span>{' '}
              Predictive modeling, test-and-learn infrastructure, and lifecycle automation are no longer
              exclusive to enterprise teams with seven-figure budgets. If you have the data, you can have
              the capability. The problem is that most mid-market hospitality groups don't have anyone on
              staff who's actually run this work at scale, so the tools sit underused.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <p>
              That's{' '}
              <span className="text-olive font-bold">the gap Coast Analytics fills.</span>{' '}
              We bring enterprise-grade CRM strategy, predictive modeling, and experimentation
              infrastructure to operators who don't have an enterprise team to run it themselves. The same
              thinking that drove retention at Caesars, lift at Vail, and scale at Comcast, applied to
              multi-property hospitality groups who deserve the same playbook.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Firm() {
  return (
    <section className="bg-olive">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 page-section" style={{ maxWidth: 720 }}>
        <Reveal>
          <div className="eyebrow mb-4">The Firm</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h3
            className="text-cream mb-6"
            style={{
              fontFamily: 'Poppins, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 32px)',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Built by Oak Island AI.
          </h3>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-on-dark text-[17px] leading-[1.8]">
            Coast Analytics is the predictive analytics product from Oak Island AI, a
            strategic marketing consultancy serving hospitality, retail, and small business operators.
            Oak Island was founded on a simple belief: the playbooks that built billion-dollar consumer
            brands should be available to the operators who build community. Our mission is to bring that
            capability to the businesses we live and work alongside.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="mt-6">
            <a
              href={OAI_SITE}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-cream font-bold hover:text-gold transition-colors text-[16px]"
            >
              oakislandmarketing.com
              <ArrowRight size={16} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-dark dark-section">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 page-section text-center">
        <Reveal>
          <div className="eyebrow mb-4">Ready to Talk?</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-cream mb-5">
            See what predictive looks like for your portfolio.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-on-dark text-[17px] leading-[1.8] mb-9">
            The live demo is built on a fictional coastal North Carolina hospitality group, but the models are
            real. Book a call and we'll walk through your data together.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/contact" className="btn-primary text-[14px]" style={{ padding: '16px 36px' }}>
              Book a Call
              <ArrowRight size={18} />
            </Link>
            <Link to="/demo" className="btn-outline text-[14px]" style={{ padding: '16px 36px' }}>
              See the Live Demo
              <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
