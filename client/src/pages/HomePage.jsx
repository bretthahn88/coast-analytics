import { Link } from 'react-router-dom';
import { ArrowRight, Database, FlaskConical, Zap, Check, Layers, BarChart3, Compass } from 'lucide-react';
import { MarketingNav } from '../components/MarketingNav.jsx';
import { Footer } from '../components/Footer.jsx';
import { WaveDivider } from '../components/WaveDivider.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { useSEO } from '../lib/useSEO.js';

const OAI_ABOUT = 'https://oak-island-ai.vercel.app/consultation';

/**
 * Section color rhythm:
 *   1. Hero          dark    (charcoal)
 *   2. Problem       olive   (teal)
 *   3. What It Does  cream
 *   4. Who It's For  dark
 *   5. How It Works  cream-2
 *   6. Demo CTA      olive
 *   7. Footer        dark    (handled by <Footer/>)
 */
export default function HomePage() {
  useSEO({
    title: 'Coast Analytics | Hospitality CRM Intelligence for Multi-Property Operators',
    description:
      'Predictive modeling and A/B testing infrastructure for multi-property hospitality operators. Thirteen ML models, one decisioning engine, no data engineering required.',
  });
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <WaveDivider fill="#99C0BF" background="#3a3635" />
        <Problem />
        <WaveDivider fill="#E9DDD5" background="#99C0BF" />
        <WhatItDoes />
        {/* No wave between WhatItDoes (cream) and Showcase (cream): same
            color, so a wave-shape transition would be invisible noise. */}
        <Showcase />
        <WaveDivider fill="#3a3635" background="#E9DDD5" />
        <WhoItsFor />
        <WaveDivider fill="#eee5d3" background="#3a3635" />
        <HowItWorks />
        <WaveDivider fill="#99C0BF" background="#eee5d3" />
        <DemoCTA />
        <WaveDivider fill="#3a3635" background="#99C0BF" />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden topo-pattern"
      style={{ backgroundColor: '#3a3635' }}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-20 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
          {/* Text column. DOM-first so it leads on mobile single-column flow.
              md:col-span-7 = ~58% on desktop, close to the 55% target. */}
          <div className="md:col-span-7">
            <Reveal>
              <span className="inline-flex items-center gap-2 eyebrow px-3 py-1 rounded-full
                               border border-gold/40 bg-gold/10 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Live demo available
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="h1-hero text-cream max-w-4xl">
                Your data tells you <span className="text-cream/60">what happened.</span>
                <br />
                <span className="text-gold">Coast Analytics</span> tells you what is coming.
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="subhead mt-7 max-w-2xl">
                Predictive intelligence and test/learn infrastructure built for multi-property hospitality groups.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-5 text-on-dark max-w-2xl text-[17px] leading-[1.8]">
                Thirteen models, one decisioning engine, no data engineering required. Sits on top of your existing
                PMS, POS, and loyalty stack. Understands hotels, dining, spa, and event venues together as one operator.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link to="/demo" className="btn-primary">
                  Explore Live Demo
                  <ArrowRight size={18} />
                </Link>
                <a href={OAI_ABOUT} target="_blank" rel="noreferrer noopener" className="btn-outline">
                  About Oak Island AI
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.5}>
              <div className="trust-bar mt-10">
                Strategy-led CRM · Predictive Modeling · Multi-Property Operators
              </div>
            </Reveal>
          </div>

          {/* Image column. Below the text on mobile (DOM order = visual order),
              right-aligned on desktop (md:col-span-5 ~= 42%, close to the 45%
              target). max-h on mobile keeps the dashboard screenshot from
              dominating the viewport; object-contain preserves natural
              aspect on every breakpoint. */}
          <Reveal className="md:col-span-5" delay={0.2}>
            <img
              src="/images/hero-dashboard.png"
              alt="Coast Analytics dashboard showing Northwood Hospitality Group's portfolio metrics, including total guests, avg folio value, active members, at-risk guests, and the 24-month guest value trend"
              loading="eager"
              className="block w-full h-auto max-h-[360px] md:max-h-none object-contain mx-auto"
              style={{
                maxWidth: 700,
                borderRadius: 12,
                border: '1px solid rgba(149,174,173,0.22)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.40)',
              }}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="bg-olive">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <Reveal>
          <div className="eyebrow mb-4">The Problem</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-cream max-w-3xl">
            Your PMS gives you data. Most operators do not have the analytics layer to turn that data into
            <span className="text-gold"> predictions</span> and
            <span className="text-gold"> experiments</span>.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-7 text-on-dark text-[17px] leading-[1.8] max-w-3xl">
            Out of the box, your PMS shows occupancy. Your POS shows what sold. Your loyalty platform shows
            who is enrolled. None of them answer <em className="text-gold">which guest is one nudge away from
            a return stay, which platinum member is quietly slipping, or whether your last campaign actually
            moved revenue across properties.</em> Coast Analytics closes that gap without ripping
            anything out of your stack.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function WhatItDoes() {
  const cols = [
    {
      icon: <Database size={28} />,
      title: 'Predict',
      sub: 'Forecasting & Scoring',
      desc: 'Thirteen models covering churn risk, revenue forecasting, tier migration, campaign response, decliner detection, rising stars, near-Platinum, VIP-likely, CLV, basket, upsell, cross-sell, and return-visit cadence.',
    },
    {
      icon: <FlaskConical size={28} />,
      title: 'Test',
      sub: 'A/B experimentation',
      desc: 'Build experiments, manage permanent holdouts, track lift over time, and confirm statistical significance. Purpose-built for property-level and loyalty experiments in hospitality.',
    },
    {
      icon: <Zap size={28} />,
      title: 'Act',
      sub: 'Next Best Action',
      desc: 'A unified decisioning layer that ranks every guest by next best action. Win-back, suite upgrade nudge, spa cross-sell, VIP concierge invite. Your team works the right list every Monday.',
    },
  ];
  return (
    <section className="bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <Reveal>
          <div className="eyebrow eyebrow-dark mb-4">What It Does</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-on-light max-w-3xl">
            Three layers that turn PMS, POS, and loyalty data into recurring revenue.
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {cols.map((c, i) => (
            <Reveal key={c.title} delay={0.1 + i * 0.1}>
              <div className="card-light h-full">
                <div className="text-olive mb-4">{c.icon}</div>
                <div className="eyebrow eyebrow-dark mb-2">{c.sub}</div>
                <div className="text-[24px] font-bold tracking-tight mb-3 text-on-light leading-tight">{c.title}</div>
                <p className="text-on-light-muted text-[15px] leading-[1.7]">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Product showcase: three real screenshots of the demo, each a clickable
// link into the corresponding live route. Sits between WhatItDoes (cream)
// and WhoItsFor (charcoal) so the wave divider after the section handles
// the cream-to-charcoal transition.
const SHOWCASE_CARDS = [
  {
    src: '/images/screenshot-dashboard.png',
    alt: 'Northwood Hospitality Group dashboard showing KPIs, the Guest Value Trend, and the Guests by Tier breakdown',
    eyebrow: 'Dashboard',
    title: 'Your portfolio, scored nightly.',
    desc: 'Total guests, folio value, loyalty members, at-risk count. Refreshed across all nine properties.',
    href: '/demo',
  },
  {
    src: '/images/screenshot-model.webp',
    alt: 'Revenue / Folio Forecasting model page with the configuration panel and forecast chart visible',
    eyebrow: 'Model Configuration',
    title: 'Configure and run predictions.',
    desc: 'Every model has filters for property, loyalty tier, date range, and visit history. Run live forecasts in seconds.',
    href: '/demo/models/acv-forecast',
  },
  {
    src: '/images/screenshot-churn.png',
    alt: 'Churn Risk model page with risk distribution histogram and at-risk rate by property',
    eyebrow: 'Churn Risk',
    title: 'Every guest, ranked by churn risk.',
    desc: 'Risk distribution, property-level at-risk rates, and a ranked list of guests your retention team should focus on this week.',
    href: '/demo/models/churn-risk',
  },
];

function Showcase() {
  return (
    <section className="bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <Reveal>
          <div className="eyebrow eyebrow-dark mb-4">What You'll See</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-on-light max-w-3xl">
            Real product, real data.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-5 text-on-light text-[17px] leading-[1.8] max-w-3xl">
            The demo runs on Northwood Hospitality Group, a fictional the Carolina coast operator. Synthetic
            data, working models, configurable filters. Click any view below to open the live demo.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SHOWCASE_CARDS.map((c, i) => (
            <Reveal key={c.eyebrow} delay={0.2 + i * 0.08}>
              <Link
                to={c.href}
                className="block rounded-[12px] overflow-hidden h-full transition-transform duration-200 hover:-translate-y-[2px]"
                style={{
                  background: '#ffffff',
                  boxShadow: '0 4px 16px rgba(58,54,53,0.10)',
                }}
              >
                <div
                  className="overflow-hidden"
                  style={{ aspectRatio: '16 / 9', background: '#3a3635' }}
                >
                  <img
                    src={c.src}
                    alt={c.alt}
                    loading="lazy"
                    className="block w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-5">
                  <div className="eyebrow eyebrow-dark mb-2">{c.eyebrow}</div>
                  <h3
                    className="text-on-light mb-2"
                    style={{
                      fontFamily: 'Poppins, system-ui, sans-serif',
                      fontWeight: 700,
                      fontSize: 18,
                      lineHeight: 1.25,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {c.title}
                  </h3>
                  <p className="text-on-light-muted text-[14px] leading-[1.65]">{c.desc}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.5}>
          <div className="mt-10 text-center">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 text-on-light-muted hover:text-olive text-[14px] transition-colors"
            >
              Click any screenshot to open the live demo &rarr;
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function WhoItsFor() {
  const items = [
    'Multi-property operators with 3 to 15 venues',
    'Running a modern PMS plus POS stack',
    'Running a unified loyalty program across properties',
    'Past basic segmentation, hungry for predictive',
    'A marketing or CRM team, even a small one, that can act on a list',
    'Mixed-property portfolios (hotels, dining, spa, events) welcome',
  ];
  return (
    <section className="bg-dark dark-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section grid md:grid-cols-2 gap-12 items-start">
        <div>
          <Reveal>
            <div className="eyebrow mb-4">Who It's For</div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="h2-section text-cream">
              Built for hospitality operators who want to
              <span className="text-gold"> go beyond segmentation.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 text-on-dark text-[17px] leading-[1.8]">
              Coast Analytics is not a generic retail analytics tool. It understands that a flagship
              hotel and a fine-dining restaurant share a guest base. It knows that summer-resort cadence is
              different from a downtown property. It treats your portfolio as one operator, not nine
              disconnected venues.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <div className="card-dark">
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it} className="flex items-start gap-3 text-cream text-[15px]">
                  <Check className="mt-1 flex-none text-gold" size={20} />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01', icon: <Compass size={24} />, title: 'Connect your data',
      desc: 'Drop in a guest, transaction, and campaign export from your PMS, POS, and loyalty platform. Our column mapper handles the field name quirks. Minutes, not weeks.',
    },
    {
      n: '02', icon: <BarChart3 size={24} />, title: 'Run your models',
      desc: 'Thirteen predictive models score every guest overnight: churn, CLV, tier migration, campaign response, basket affinities, return-visit cadence, and more.',
    },
    {
      n: '03', icon: <Layers size={24} />, title: 'Execute with confidence',
      desc: 'Push prioritized lists into your CRM as audiences, run a controlled A/B test against a permanent holdout, and measure real lift. Not just open rate.',
    },
  ];
  return (
    <section style={{ background: '#eee5d3' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <Reveal>
          <div className="eyebrow eyebrow-dark mb-4">How It Works</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-on-light max-w-3xl">
            Three steps. Stack agnostic. No data engineering required.
          </h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={0.1 + i * 0.1}>
              <div className="card-light h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-olive">{s.icon}</div>
                  <div className="text-olive text-sm font-bold tracking-wider">{s.n}</div>
                </div>
                <div className="text-[22px] font-bold tracking-tight mb-3 text-on-light leading-tight">{s.title}</div>
                <p className="text-on-light-muted text-[15px] leading-[1.7]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoCTA() {
  return (
    <section className="bg-olive">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 page-section text-center">
        <Reveal>
          <div className="eyebrow mb-5">Live Demo</div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-cream mb-6">
            See it live with realistic hospitality data.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-on-dark text-[17px] leading-[1.8] max-w-2xl mx-auto mb-9">
            Northwood Hospitality Group is a fictional 9-property the Carolina coast operator we built to show
            you exactly what predictive intelligence looks like when it is purpose-built for hospitality.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/demo" className="btn-primary text-[14px]" style={{ padding: '16px 36px' }}>
              Open the Live Demo
              <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn-outline text-[14px]" style={{ padding: '16px 36px' }}>
              Book a Call
              <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.35}>
          <p className="mt-4 trust-bar">No login. No password. No catch.</p>
        </Reveal>
      </div>
    </section>
  );
}
