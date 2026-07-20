import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Globe, Check } from 'lucide-react';
import { MarketingNav } from '../components/MarketingNav.jsx';
import { Footer } from '../components/Footer.jsx';
import { WaveDivider } from '../components/WaveDivider.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { useSEO } from '../lib/useSEO.js';

/**
 * Contact page submits to OAI's Formspree consultation endpoint.
 * VITE_CONSULTATION_FORMSPREE must contain only the form ID (the hash
 * shown after /f/ in the Formspree dashboard URL), NOT the full URL.
 * The code wraps it with the formspree.io prefix below; treating the
 * env var as the full URL produces a relative path on fetch and posts
 * back to our own domain (405).
 */
const FORMSPREE_ID = import.meta.env.VITE_CONSULTATION_FORMSPREE || 'mwvzkdbq';
const FORMSPREE_URL = `https://formspree.io/f/${FORMSPREE_ID}`;
const OAI_SITE = 'https://oak-island-ai.vercel.app/consultation';
const OAI_CONSULTATION = 'https://oak-island-ai.vercel.app/consultation';

export default function ContactPage() {
  useSEO({
    title: 'Contact | Coast Analytics',
    description:
      'Work with Oak Island AI on predictive CRM for hospitality. Strategy first, predictive infrastructure second, ongoing partnership.',
  });
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <WaveDivider fill="#E9DDD5" background="#3a3635" />
        <FormSection />
        <WaveDivider fill="#99C0BF" background="#E9DDD5" />
        <CTAStrip />
        <WaveDivider fill="#3a3635" background="#99C0BF" />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-dark dark-section">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <Reveal><div className="eyebrow mb-4">Get in Touch</div></Reveal>
        <Reveal delay={0.05}>
          <h1 className="h1-hero text-cream max-w-4xl">
            Let us talk about <span className="text-gold">your guest data.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="subhead mt-6 max-w-3xl">
            We work with a small number of operators. If the timing is right, we will know quickly.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="trust-bar mt-10">
            CRM Strategy · Predictive Analytics · Multi-Property Operators
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FormSection() {
  return (
    <section className="bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <Reveal>
            <ContactForm />
          </Reveal>
          <Reveal delay={0.1}>
            <ContactDetails />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [v, setV] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    num_properties: '3-5',
    message: '',
  });
  const [status, setStatus] = useState('idle');
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const r = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: v.first_name,
          last_name: v.last_name,
          company: v.company_name,
          email: v.email,
          phone: v.phone,
          num_properties: v.num_properties,
          message: v.message,
          _subject: `Coast Analytics contact: ${v.first_name} ${v.last_name} (${v.company_name || 'no company'})`,
        }),
      });
      if (!r.ok) throw new Error(`Formspree HTTP ${r.status}`);
      setStatus('success');
    } catch (err) {
      console.error('[contact] Formspree submit failed:', err);
      setStatus('error');
    }
  };

  const busy = status === 'sending';

  if (status === 'success') {
    return (
      <div>
        <div className="eyebrow eyebrow-dark mb-3">Send a message</div>
        <h2 className="h2-section text-on-light mb-6">Thanks, we will be in touch within one business day.</h2>
        <p className="text-on-light text-[17px] leading-[1.7]">
          In the meantime, you can reach us through{' '}
          <a href={OAI_CONSULTATION} className="text-olive font-bold hover:underline">
            oakislandmarketing.com/consultation
          </a>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="eyebrow eyebrow-dark mb-3">Send a Message</div>
      <h2 className="h2-section text-on-light mb-8">Send a message.</h2>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" required value={v.first_name} onChange={set('first_name')} />
          <Field label="Last Name"  required value={v.last_name}  onChange={set('last_name')} />
        </div>
        <Field label="Company Name" required value={v.company_name} onChange={set('company_name')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" required type="email" value={v.email} onChange={set('email')} />
          <Field label="Phone (optional)" value={v.phone} onChange={set('phone')} />
        </div>
        <SelectField
          label="Number of Properties"
          required
          value={v.num_properties}
          onChange={set('num_properties')}
          options={['1-2', '3-5', '6-10', '10+']}
        />
        <div>
          <label className="field-label field-label-dark">Message</label>
          <textarea
            required
            rows={5}
            value={v.message}
            onChange={set('message')}
            className="input-on-light resize-y"
          />
        </div>

        {status === 'error' && (
          <div
            role="alert"
            className="rounded-md px-4 py-3 text-[14px] leading-[1.6]"
            style={{
              background: 'rgba(168,50,50,0.08)',
              border: '1px solid rgba(168,50,50,0.4)',
              color: '#a83232',
            }}
          >
            Something went wrong. Reach us through{' '}
            <a href={OAI_CONSULTATION} className="font-bold hover:underline">
              oakislandmarketing.com/consultation
            </a>.
          </div>
        )}

        <button disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, required, type = 'text', value, onChange }) {
  return (
    <label className="block">
      <span className="field-label field-label-dark">
        {label}{required && <span className="text-olive"> *</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="input-on-light"
      />
    </label>
  );
}

function SelectField({ label, required, value, onChange, options }) {
  return (
    <label className="block">
      <span className="field-label field-label-dark">
        {label}{required && <span className="text-olive"> *</span>}
      </span>
      <select
        required={required}
        value={value}
        onChange={onChange}
        className="input-on-light"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function ContactDetails() {
  return (
    <div>
      <div className="eyebrow eyebrow-dark mb-3">Direct Contact</div>
      <h2 className="h2-section text-on-light mb-8">Direct contact.</h2>

      <ul className="space-y-4 mb-10">
        <li className="flex items-center gap-3 text-on-light text-[17px]">
          <Mail size={20} className="text-olive flex-none" />
          <a href={OAI_CONSULTATION} className="text-olive font-bold hover:underline">
            oakislandmarketing.com/consultation
          </a>
        </li>
        <li className="flex items-center gap-3 text-on-light text-[17px]">
          <Globe size={20} className="text-olive flex-none" />
          <a href={OAI_SITE} target="_blank" rel="noreferrer noopener"
             className="text-olive font-bold hover:underline">
            oakislandmarketing.com
          </a>
        </li>
      </ul>

      <div className="rounded-[12px] p-7" style={{ background: '#ffffff', borderTop: '3px solid #BC7526', boxShadow: '0 4px 16px rgba(58,54,53,0.10)' }}>
        <div className="eyebrow eyebrow-dark mb-3">Who This Is For</div>
        <p className="text-on-light text-[16px] leading-[1.7] mb-5">
          Multi-property hospitality operators with a PMS, POS, and loyalty stack. Teams that want senior
          CRM execution without a full-time hire. If that sounds like you, we want to hear from you.
        </p>
        <ul className="space-y-2 text-on-light text-[15px]">
          <li className="flex items-start gap-2">
            <Check size={18} className="text-olive mt-1 flex-none" />
            <span>3 to 15 property portfolios</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={18} className="text-olive mt-1 flex-none" />
            <span>PMS plus POS plus loyalty stack</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={18} className="text-olive mt-1 flex-none" />
            <span>Serious about retention</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function CTAStrip() {
  return (
    <section className="bg-olive">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 page-section text-center">
        <Reveal><div className="eyebrow mb-4">Live Demo</div></Reveal>
        <Reveal delay={0.05}>
          <h2 className="h2-section text-cream mb-4">Want to see the platform first?</h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="subhead mb-9">
            Explore the live demo before we talk.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <Link to="/demo" className="btn-primary text-[14px]" style={{ padding: '16px 36px' }}>
            Explore Live Demo
            <ArrowRight size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
