import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { MarketingNav } from '../components/MarketingNav.jsx';
import { Footer } from '../components/Footer.jsx';
import { WaveDivider } from '../components/WaveDivider.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { useSEO } from '../lib/useSEO.js';

/**
 * Pricing page. Three transparent tiers (Starter, Growth, Enterprise) plus a
 * Fractional CRM Lead strategic add-on. Every CTA routes to /contact on the
 * Coast Analytics site, not to the parent OAI consultation page.
 *
 * Section rhythm:
 *   1. Hero          charcoal
 *   2. Tiers         cream    three-card grid, Growth featured
 *   3. Fractional    sage     single full-width strategic add-on
 *   4. FAQ           cream    flat Q/A blocks
 *   5. CTA           charcoal Book a Call + See the Live Demo
 *   6. Footer        charcoal handled by <Footer/>
 */
export default function PricingPage() {
  useSEO({
    title: 'Pricing | Coast Analytics',
    description:
      'Transparent pricing for multi-property hospitality operators. Starter for 1 to 3 properties, Growth for 4 to 10, Enterprise for 11+. Add a Fractional CRM Lead to any tier.',
  });
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <WaveDivider fill="#E9DDD5" background="#3a3635" />
        <Tiers />
        <WaveDivider fill="#99C0BF" background="#E9DDD5" />
        <Fractional />
        <WaveDivider fill="#E9DDD5" background="#99C0BF" />
        <FAQ />
        <WaveDivider fill="#3a3635" background="#E9DDD5" />
        <FinalCTA />
        <WaveDivider fill="#3a3635" background="#3a3635" />
      </main>
      <Footer />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="bg-dark dark-section">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <Reveal>
          <span className="inline-flex items-center gap-2 eyebrow px-3 py-1 rounded-full
                           border border-gold/40 bg-gold/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Pricing
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="h1-hero text-cream max-w-4xl">
            Built to scale with your <span className="text-gold">portfolio.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-7 text-on-dark text-[17px] leading-[1.8] max-w-3xl">
            Predictive intelligence for hospitality operators, priced by property count. One-time setup
            plus monthly maintenance. No long-term contracts, no enterprise sales process.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Pricing tier data lives as plain objects so the card markup stays
// declarative. The `featured` flag controls the Most Popular treatment.
const TIERS = [
  {
    label: 'Starter',
    audience: 'For 1 to 3 properties',
    setupPrice: '$7,500',
    setupCaption: 'one-time setup',
    monthlyPrice: '$999 / month',
    monthlyCaption: 'ongoing maintenance',
    included: [
      'Platform setup across PMS, POS, and loyalty data sources',
      'All thirteen predictive models calibrated to your data',
      'Custom dashboard for your property portfolio',
      'Onboarding and team training (two sessions)',
      'Monthly model retraining and platform updates',
      'Email and Slack support',
      'Quarterly performance review',
    ],
    bestFor:
      'Single property operators, boutique hotel groups, small multi-property collections testing ' +
      'predictive analytics for the first time.',
    cta: 'Book a Call',
    featured: false,
  },
  {
    label: 'Growth',
    audience: 'For 4 to 10 properties',
    setupPrice: '$15,000',
    setupCaption: 'one-time setup',
    monthlyPrice: '$1,999 / month',
    monthlyCaption: 'ongoing maintenance',
    included: [
      'Everything in Starter',
      'Multi-property data unification across venues',
      'Cross-property predictive models (cross-sell, property-to-property migration)',
      'Property-level dashboards plus portfolio rollup view',
      'Custom experiment design (up to 2 active A/B tests per month)',
      'Bi-monthly performance review with strategy session',
      'Priority support',
      'Dedicated onboarding lead',
    ],
    bestFor:
      'Multi-property hospitality groups with 4 to 10 venues, mixed property types (hotels, dining, ' +
      'spa, events), operators with active loyalty programs ready to scale predictive intelligence ' +
      'across the portfolio.',
    cta: 'Book a Call',
    featured: true,
  },
  {
    label: 'Enterprise',
    audience: 'For 11+ properties',
    setupPrice: 'Custom',
    setupCaption: "let's talk",
    monthlyPrice: null,
    monthlyCaption: null,
    included: [
      'Everything in Growth',
      'Custom model development for your specific use cases',
      'Dedicated integration support for complex stacks',
      'White-label dashboard options',
      'Monthly executive review and strategic planning',
      'Direct access to senior team',
      'Custom contract terms',
    ],
    bestFor:
      'Larger hospitality portfolios, regional brand groups, multi-property operators with complex ' +
      'tech stacks or specialized loyalty programs. Pricing depends on scope, integration complexity, ' +
      'and strategic scope.',
    cta: 'Contact Us',
    featured: false,
  },
];

function Tiers() {
  return (
    <section className="bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7 md:items-stretch">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.label} delay={0.05 + i * 0.08} className="h-full">
              <TierCard {...tier} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TierCard({ label, audience, setupPrice, setupCaption, monthlyPrice, monthlyCaption, included, bestFor, cta, featured }) {
  const featuredStyle = featured
    ? {
        boxShadow: '0 14px 40px rgba(58,54,53,0.18)',
        outline: '2px solid #BC7526',
        outlineOffset: '0',
      }
    : undefined;
  return (
    <div
      className={`card-light h-full flex flex-col relative ${featured ? 'md:-mt-4' : ''}`}
      style={featuredStyle}
    >
      {featured && (
        <div
          className="absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap"
          style={{ top: -14, background: '#BC7526', color: '#E9DDD5' }}
        >
          Most Popular
        </div>
      )}

      <div className="eyebrow eyebrow-dark mb-2">{label}</div>
      <p className="text-on-light-muted text-[13px] mb-6">{audience}</p>

      <div className="mb-7">
        <div className="text-[38px] font-bold leading-none" style={{ color: '#BC7526' }}>{setupPrice}</div>
        <div className="text-on-light-muted text-[12px] mt-1.5 uppercase tracking-[0.08em]">{setupCaption}</div>
        {monthlyPrice && (
          <>
            <div className="text-[22px] font-bold leading-none mt-5" style={{ color: '#BC7526' }}>{monthlyPrice}</div>
            <div className="text-on-light-muted text-[12px] mt-1.5 uppercase tracking-[0.08em]">{monthlyCaption}</div>
          </>
        )}
      </div>

      <div className="eyebrow eyebrow-dark mb-3">What's included</div>
      <ul className="space-y-2 mb-7 text-[14px] text-on-light leading-[1.55]">
        {included.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check size={15} className="text-gold mt-[3px] flex-none" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="eyebrow eyebrow-dark mb-2">Best for</div>
      <p className="text-on-light text-[14px] leading-[1.65] mb-7 flex-1">{bestFor}</p>

      <Link to="/contact" className="btn-primary w-full justify-center">
        {cta}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
const FRACTIONAL_INCLUDED = [
  'Weekly working session with senior CRM lead',
  'Test-and-learn program architecture and prioritization',
  'Experiment design and analysis',
  'Campaign strategy and lifecycle program development',
  'Quarterly executive playback to leadership',
  'Direct access via Slack and email',
];

function Fractional() {
  return (
    <section className="bg-olive">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <Reveal>
          <div
            className="mx-auto rounded-[16px] p-8 md:p-12"
            style={{
              maxWidth: 900,
              background: '#E9DDD5',
              borderTop: '4px solid #BC7526',
              boxShadow: '0 12px 40px rgba(58,54,53,0.22)',
            }}
          >
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 eyebrow eyebrow-dark px-3 py-1 rounded-full
                               border border-gold/40 bg-gold/10 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Strategic Add-On
              </span>
              <h2 className="h2-section text-on-light mb-5">Fractional Head of CRM</h2>
              <div className="text-[34px] font-bold leading-none" style={{ color: '#BC7526' }}>
                + $5,000 / month
              </div>
              <p className="mt-4 text-on-light-muted text-[15px]">
                Add a senior CRM strategist to lead your predictive analytics program. Available with any tier.
              </p>
            </div>

            <p className="text-on-light text-[16px] leading-[1.8] mb-7">
              When you want enterprise-grade CRM strategy without the enterprise hire, this add-on places
              a former Fortune 100 CRM operator inside your team. Best fit for operators who have the data
              and the tools but need someone to architect the test-and-learn program, prioritize the model
              roadmap, and drive cross-functional adoption.
            </p>

            <div className="eyebrow eyebrow-dark mb-3">What you get</div>
            <ul className="space-y-2.5 mb-7 text-[15px] text-on-light leading-[1.6]">
              {FRACTIONAL_INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check size={16} className="text-gold mt-1 flex-none" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="eyebrow eyebrow-dark mb-2">Best for</div>
            <p className="text-on-light text-[15px] leading-[1.7] mb-7">
              Operators on the Growth or Enterprise tier who want a strategic leader running their
              predictive analytics function. Three-month minimum commitment.
            </p>

            <div className="text-center">
              <Link to="/contact" className="btn-primary text-[14px]" style={{ padding: '16px 36px' }}>
                Book a Call
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How long does setup take?',
    a:
      'Most Starter setups complete in 2 to 3 weeks. Growth tier setups typically run 4 to 6 weeks ' +
      'depending on stack complexity and data integration scope. Enterprise timelines vary by project.',
  },
  {
    q: 'What data sources do you support?',
    a:
      "We integrate with most modern PMS, POS, and loyalty platforms used by hospitality operators. " +
      "If your stack is unusual, we'll talk through it on the call before quoting.",
  },
  {
    q: 'Do you offer annual pricing or discounts?',
    a:
      'Yes. Monthly maintenance pricing can be discounted up to 15% for annual commitments, paid ' +
      'upfront. Discussed during the discovery call.',
  },
  {
    q: 'What happens if I want to cancel?',
    a:
      'No long-term contracts. Monthly maintenance can be cancelled with 30 days notice. The platform ' +
      'setup is yours to keep regardless.',
  },
  {
    q: 'Is the setup fee really one-time?',
    a:
      'Yes. Setup includes everything needed to get the platform running on your data. Monthly ' +
      'maintenance covers ongoing optimization, retraining, and support, but the one-time fee is ' +
      'genuinely one-time.',
  },
  {
    q: 'Can I add the Fractional CRM Lead later?',
    a: 'Yes. The add-on can be activated at any point during your engagement.',
  },
];

function FAQ() {
  return (
    <section className="bg-cream">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 page-section" style={{ maxWidth: 720 }}>
        <Reveal>
          <span className="inline-flex items-center gap-2 eyebrow eyebrow-dark px-3 py-1 rounded-full
                           border border-gold/40 bg-gold/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Common Questions
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-on-light mb-10">Pricing details, answered.</h2>
        </Reveal>

        <div className="space-y-7">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={0.1 + i * 0.04}>
              <div>
                <h3
                  className="text-on-light mb-2"
                  style={{
                    fontFamily: 'Poppins, system-ui, sans-serif',
                    fontWeight: 700,
                    fontSize: 19,
                    letterSpacing: '-0.005em',
                    lineHeight: 1.35,
                  }}
                >
                  {item.q}
                </h3>
                <p className="text-on-light text-[16px] leading-[1.75]">{item.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="bg-dark dark-section">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 page-section text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 eyebrow px-3 py-1 rounded-full
                           border border-gold/40 bg-gold/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Ready to Talk?
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-cream mb-5">Not sure which tier fits?</h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-on-dark text-[17px] leading-[1.8] mb-9">
            Book a 30-minute discovery call. We'll walk through your property count, data sources, and
            goals, and recommend the right starting point. No sales pitch, no obligation.
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
