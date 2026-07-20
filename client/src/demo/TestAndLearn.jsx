import { useEffect, useMemo, useState } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { ChevronDown, ChevronRight, Download, RefreshCw, Check, ArrowRight, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import { fmtNum, fmt$ } from '../lib/format.js';
import { Card, EmbedNote } from './components/Card.jsx';
import { KpiCard } from './components/KpiCard.jsx';
import { Loading, ErrorState } from './components/Loading.jsx';
import { PageHeader } from './components/PageHeader.jsx';
import { useToast } from '../components/Toast.jsx';
import { CHART_PRIMARY, CHART_SECONDARY } from './Dashboard.jsx';
import { STORES } from './components/FilterSidebar.jsx';

export default function TestAndLearn() {
  const tabClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-[13px] font-bold tracking-[0.06em] uppercase transition-colors ${
      isActive
        ? 'bg-gold text-dark'
        : 'text-cream/70 hover:text-gold border border-gold/30'
    }`;
  return (
    <div>
      <PageHeader
        category="Test & Learn"
        title="Experimentation Platform"
        description="Run controlled tests, track lift over time, and protect a permanent holdout for clean measurement."
      />
      <div className="flex gap-2 mb-6 flex-wrap">
        <NavLink to="/demo/test-and-learn/builder" className={tabClass}>A/B Test Builder</NavLink>
        <NavLink to="/demo/test-and-learn/tracker" className={tabClass}>Experiment Tracker</NavLink>
        <NavLink to="/demo/test-and-learn/holdouts" className={tabClass}>Holdout Manager</NavLink>
      </div>
      <Routes>
        <Route index element={<Navigate to="builder" replace />} />
        <Route path="builder" element={<BuilderWizard />} />
        <Route path="tracker" element={<Tracker />} />
        <Route path="holdouts" element={<Holdouts />} />
      </Routes>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 4-step A/B Test Builder
// ──────────────────────────────────────────────────────────────────────────
const TIERS = ['Silver', 'Gold', 'Platinum'];
const CHANNELS = ['email', 'sms', 'push'];

const INITIAL_TEST = {
  name: 'Resort Property Personalization',
  hypothesis:
    'We believe that mentioning the guest\'s home resort property in push copy will result in higher redemption rate for resort-home-property guests.',
  primary_metric: 'redemption_rate',
  audience: {
    stores: [],
    tiers: [...TIERS],
    risk: [0, 100],
    last_visit: '90d',
    channels: ['push'],
  },
  split: { type: '50/50', custom: { Control: 50, 'Variant A': 50 }, holdoutPct: 5, seed: 42 },
};

function BuilderWizard() {
  const [step, setStep] = useState(1);
  const [test, setTest] = useState(INITIAL_TEST);
  const reset = () => { setTest(INITIAL_TEST); setStep(1); };

  return (
    <div>
      <Stepper step={step} />
      {step === 1 && <Step1 test={test} setTest={setTest} onNext={() => setStep(2)} />}
      {step === 2 && <Step2 test={test} setTest={setTest} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <Step3 test={test} setTest={setTest} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <Step4 test={test} onReset={reset} />}
    </div>
  );
}

function Stepper({ step }) {
  const steps = ['Hypothesis', 'Audience', 'Split', 'Results'];
  return (
    <div className="mb-6 flex items-center gap-2 text-[12px] uppercase tracking-[0.08em] flex-wrap">
      {steps.map((label, i) => {
        const n = i + 1;
        const isActive = n === step;
        const isDone = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-bold"
              style={{
                background: isActive ? '#BC7526' : isDone ? 'rgba(188,117,38,0.15)' : 'rgba(188,117,38,0.05)',
                color:      isActive ? '#1a1a1a' : isDone ? '#BC7526' : 'rgba(245,240,232,0.5)',
                border: `1px solid ${isActive ? '#BC7526' : isDone ? 'rgba(188,117,38,0.4)' : 'rgba(188,117,38,0.15)'}`,
              }}
            >
              <span>{n}</span>
              <span>{label}</span>
            </span>
            {n < steps.length && <ChevronRight size={14} className="text-cream/40" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Hypothesis ────────────────────────────────────────────────────
function Step1({ test, setTest, onNext }) {
  const set = (k) => (e) => setTest({ ...test, [k]: e.target.value });
  const canNext = test.name.trim() && test.hypothesis.trim();
  return (
    <Card title="Step 1 -- Name & Hypothesis" subtitle="Frame the test before you build the audience.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Test Name">
          <input value={test.name} onChange={set('name')} className="input-on-dark" />
        </Field>
        <Field label="Primary Metric">
          <select value={test.primary_metric} onChange={set('primary_metric')} className="input-on-dark"
                  style={{ fontFamily: 'Georgia, serif' }}>
            <option value="acv">ACV</option>
            <option value="visit_frequency">Visit Frequency</option>
            <option value="redemption_rate">Redemption Rate</option>
            <option value="churn_rate">Churn Rate</option>
          </select>
        </Field>
        <Field label="Hypothesis" className="sm:col-span-2">
          <textarea
            rows={3}
            value={test.hypothesis}
            onChange={set('hypothesis')}
            className="input-on-dark resize-y"
            placeholder="We believe that [action] will result in [outcome] for [audience]"
            style={{ fontFamily: 'Georgia, serif' }}
          />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <button disabled={!canNext} onClick={onNext} className="btn-primary disabled:opacity-50">
          Next: Configure Audience
          <ArrowRight size={14} />
        </button>
      </div>
    </Card>
  );
}

// ── Step 2: Audience ──────────────────────────────────────────────────────
function Step2({ test, setTest, onNext, onBack }) {
  const [guests, setCustomers] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.customers({ limit: 2400 }).then((r) => setCustomers(r.customers || [])).catch((e) => setErr(e.message));
  }, []);

  const update = (path, value) => {
    setTest({ ...test, audience: { ...test.audience, [path]: value } });
  };

  const audience = test.audience;
  const estCount = useMemo(() => {
    if (!guests) return null;
    return guests.filter((c) => audienceMatches(c, audience)).length;
  }, [guests, audience]);

  return (
    <Card title="Step 2 -- Audience Configuration" subtitle="Live audience size updates as you change filters.">
      {err && <ErrorState message={err} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <Field label="Stores">
            <CheckList
              options={STORES}
              selected={audience.stores}
              onToggle={(v) => update('stores', toggle(audience.stores, v))}
              hint="(none selected = all stores)"
            />
          </Field>
          <Field label="Loyalty Tier">
            <CheckList
              options={TIERS}
              selected={audience.tiers}
              onToggle={(v) => update('tiers', toggle(audience.tiers, v))}
            />
          </Field>
        </div>

        <div className="space-y-5">
          <Field label="Risk Score Range">
            <RangeSlider
              min={0}
              max={100}
              valueLow={audience.risk[0]}
              valueHigh={audience.risk[1]}
              onChange={(lo, hi) => update('risk', [lo, hi])}
            />
            <div className="text-[12px] text-cream/60 mt-1">
              Score {audience.risk[0]} -- {audience.risk[1]}
            </div>
          </Field>

          <Field label="Last Visit Window">
            <select
              value={audience.last_visit}
              onChange={(e) => update('last_visit', e.target.value)}
              className="input-on-dark"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90d">Last 90 days</option>
              <option value="180">Last 180 days</option>
            </select>
          </Field>

          <Field label="Channel Opt-in">
            <CheckList
              options={CHANNELS}
              selected={audience.channels}
              onToggle={(v) => update('channels', toggle(audience.channels, v))}
            />
          </Field>
        </div>
      </div>

      <div className="mt-6 rounded-md p-4" style={{ background: 'rgba(188,117,38,0.08)', border: '1px solid rgba(188,117,38,0.4)' }}>
        <div className="eyebrow mb-1">Estimated Audience</div>
        <div className="text-gold text-[28px] font-bold tracking-tight leading-tight">
          {guests == null
            ? <span className="text-cream/50 text-[18px]">Loading guests...</span>
            : <>{fmtNum(estCount)} <span className="text-[14px] text-cream/60 font-normal">guests</span></>}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="btn-outline">Back</button>
        <button onClick={onNext} disabled={estCount === 0} className="btn-primary disabled:opacity-50">
          Next: Configure Split
          <ArrowRight size={14} />
        </button>
      </div>
    </Card>
  );
}

function audienceMatches(c, a) {
  if (a.stores.length && !a.stores.includes(c.home_store)) return false;
  if (a.tiers.length && !a.tiers.includes(c.tier)) return false;
  if (a.risk) {
    const score = (c.churn_risk ?? 0) * 100;
    if (score < a.risk[0] || score > a.risk[1]) return false;
  }
  if (a.last_visit) {
    const max = parseInt(String(a.last_visit).replace('d', ''), 10) || 90;
    if (c.days_since_last != null && c.days_since_last > max) return false;
  }
  if (a.channels.length) {
    const ok = a.channels.some((ch) => {
      if (ch === 'email') return c.opt_in_email;
      if (ch === 'sms')   return c.opt_in_sms;
      if (ch === 'push')  return c.opt_in_push;
      return false;
    });
    if (!ok) return false;
  }
  return true;
}

// ── Step 3: Split ─────────────────────────────────────────────────────────
function Step3({ test, setTest, onNext, onBack }) {
  const updateSplit = (k, v) => setTest({ ...test, split: { ...test.split, [k]: v } });

  const setType = (type) => {
    const custom = type === '50/50'        ? { Control: 50, 'Variant A': 50 }
                : type === '70/30'         ? { Control: 70, 'Variant A': 30 }
                : type === 'thirds'        ? { Control: 34, 'Variant A': 33, 'Variant B': 33 }
                : test.split.custom; // keep on custom
    setTest({ ...test, split: { ...test.split, type, custom } });
  };

  const variants = Object.keys(test.split.custom);
  const total    = Object.values(test.split.custom).reduce((a, b) => a + Number(b || 0), 0);

  return (
    <Card title="Step 3 -- Split Configuration" subtitle="Decide how to distribute the audience across variants.">
      <div className="space-y-6">
        <div>
          <div className="eyebrow mb-2">Split Type</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { v: '50/50',   label: 'A/B (50/50)' },
              { v: '70/30',   label: 'A/B (70/30)' },
              { v: 'thirds',  label: 'A/B/C (equal thirds)' },
              { v: 'custom',  label: 'Custom' },
            ].map((opt) => (
              <label
                key={opt.v}
                className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-[13px]"
                style={{
                  background: test.split.type === opt.v ? 'rgba(188,117,38,0.15)' : 'rgba(188,117,38,0.04)',
                  border: `1px solid ${test.split.type === opt.v ? '#BC7526' : 'rgba(188,117,38,0.25)'}`,
                  color: test.split.type === opt.v ? '#BC7526' : '#E9DDD5',
                }}
              >
                <input type="radio" name="split" value={opt.v} checked={test.split.type === opt.v}
                       onChange={() => setType(opt.v)} style={{ accentColor: '#BC7526' }} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {test.split.type === 'custom' && (
          <div>
            <div className="eyebrow mb-2">Custom Percentages</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {variants.map((name) => (
                <Field key={name} label={name}>
                  <input
                    type="number" min={0} max={100}
                    value={test.split.custom[name]}
                    onChange={(e) => updateSplit('custom', { ...test.split.custom, [name]: Number(e.target.value) })}
                    className="input-on-dark"
                  />
                </Field>
              ))}
            </div>
            <div className="text-[12px] mt-2"
                 style={{ color: total === 100 ? '#BC7526' : '#e8a8a8' }}>
              Total: {total}% {total !== 100 && '(must equal 100)'}
            </div>
          </div>
        )}

        <SplitPreview custom={test.split.custom} holdoutPct={test.split.holdoutPct} />

        <div>
          <div className="eyebrow mb-2">Holdout Group ({test.split.holdoutPct}%)</div>
          <input
            type="range" min={0} max={20} step={1}
            value={test.split.holdoutPct}
            onChange={(e) => updateSplit('holdoutPct', Number(e.target.value))}
            className="w-full"
            style={{ accentColor: '#BC7526' }}
          />
          <div className="text-[12px] text-cream/60 mt-1">
            Holdout never receives the test. Default 5%.
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="eyebrow">Randomization Seed</div>
          <code className="px-2.5 py-1 rounded-md" style={{ background: '#1a1a1a', color: '#BC7526', fontFamily: 'ui-monospace, monospace' }}>
            {test.split.seed}
          </code>
          <button
            type="button"
            onClick={() => updateSplit('seed', Math.floor(Math.random() * 999) + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px]"
            style={{ background: 'rgba(188,117,38,0.10)', color: '#BC7526', border: '1px solid rgba(188,117,38,0.4)' }}
          >
            <RefreshCw size={12} />
            Regenerate
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="btn-outline">Back</button>
        <button
          onClick={onNext}
          disabled={total !== 100 && test.split.type === 'custom'}
          className="btn-primary disabled:opacity-50"
        >
          Create Test & Assign Groups
          <ArrowRight size={14} />
        </button>
      </div>
    </Card>
  );
}

function SplitPreview({ custom, holdoutPct }) {
  // Build segments: each variant scaled to (100 - holdoutPct), then holdout slice.
  const variantTotal = Object.values(custom).reduce((a, b) => a + Number(b || 0), 0) || 100;
  const remaining = 100 - holdoutPct;
  const segments = Object.entries(custom).map(([name, pct], i) => ({
    name,
    pct: ((Number(pct) / variantTotal) * remaining).toFixed(1),
    color: i === 0 ? '#99C0BF' : i === 1 ? '#BC7526' : '#E9DDD5',
  }));
  if (holdoutPct > 0) {
    segments.push({ name: 'Holdout', pct: holdoutPct.toFixed(1), color: 'rgba(245,240,232,0.3)' });
  }
  return (
    <div>
      <div className="eyebrow mb-2">Split Preview</div>
      <div className="rounded-md overflow-hidden flex" style={{ height: 36, border: '1px solid rgba(188,117,38,0.3)' }}>
        {segments.map((s, i) => (
          <div
            key={i}
            style={{
              width: `${s.pct}%`,
              background: s.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              color: i === 1 ? '#1a1a1a' : i === 2 ? '#1a1a1a' : '#E9DDD5',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            title={`${s.name}: ${s.pct}%`}
          >
            {Number(s.pct) > 8 ? `${s.name} ${s.pct}%` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 4: Assign + Results ──────────────────────────────────────────────
function Step4({ test, onReset }) {
  const [assigning, setAssigning] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const toast = useToast();

  useEffect(() => {
    setAssigning(true);
    api.customers({ limit: 2400 }).then((r) => {
      const guests = (r.customers || []).filter((c) => audienceMatches(c, test.audience));
      window.setTimeout(() => {
        setAssignment(assignGroups(guests, test.split));
        setAssigning(false);
      }, 1500);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (assigning) {
    return (
      <Card title="Step 4 -- Assigning guests to groups...">
        <div className="flex items-center gap-3 text-cream/70 py-8 justify-center">
          <span
            style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2.5px solid currentColor',
              borderRightColor: 'transparent',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span className="text-[15px]">Assigning guests to groups...</span>
        </div>
      </Card>
    );
  }

  const exportCSV = () => {
    const rows = assignment.rows;
    const cols = ['customer_id', 'name', 'home_store', 'tier', 'churn_risk', 'group'];
    const header = cols.map((c) => `"${c}"`).join(',');
    const lines = rows.map((r) => cols.map((k) => {
      let v = r[k]; if (v == null) return '';
      v = String(v);
      if (v.includes(',') || v.includes('"') || v.includes('\n')) v = `"${v.replace(/"/g, '""')}"`;
      return v;
    }).join(','));
    const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ilp-test-${test.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    toast.push('Group assignments exported.', 'success');
  };

  return (
    <Card title="Step 4 -- Groups Assigned" subtitle={test.name}>
      <div className="rounded-md p-5 mb-5"
           style={{ background: 'rgba(188,117,38,0.10)', border: '1px solid rgba(188,117,38,0.4)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Check size={16} className="text-gold" />
          <span className="text-gold font-bold">Groups assigned. Export the CSV and upload to your CRM or campaign builder.</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label="Total Assigned" value={fmtNum(assignment.totalAssigned)} accent="cream" />
        <KpiCard label="Holdout" value={fmtNum(assignment.holdout)} sub={`${test.split.holdoutPct}%`} accent="gold" />
        <KpiCard label="Variants" value={Object.keys(assignment.perVariant).length} accent="gold" />
        <CovariateBalanceCard balance={assignment.balance} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {Object.entries(assignment.perVariant).map(([name, stats]) => (
          <div key={name} className="rounded-md p-4 flex items-center justify-between"
               style={{ background: 'rgba(74,80,18,0.6)', border: '1px solid rgba(188,117,38,0.25)' }}>
            <div>
              <div className="text-cream font-bold text-[16px]">{name}</div>
              <div className="text-cream/60 text-[12px] mt-0.5">
                {fmtNum(stats.n)} guests · avg ACV {fmt$(stats.avgAcv)} · {pctOf(stats.canopy, stats.n)}% Platinum
              </div>
            </div>
            <BalanceBadge ok={stats.balanced} />
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md mb-6" style={{ border: '1px solid rgba(188,117,38,0.2)' }}>
        <table className="w-full text-[14px]">
          <thead style={{ background: '#1a1a1a', color: '#BC7526' }}>
            <tr>
              <th className="px-4 py-3 text-left uppercase text-[12px] tracking-[0.08em]">Customer</th>
              <th className="px-4 py-3 text-left uppercase text-[12px] tracking-[0.08em]">Store</th>
              <th className="px-4 py-3 text-left uppercase text-[12px] tracking-[0.08em]">Tier</th>
              <th className="px-4 py-3 text-right uppercase text-[12px] tracking-[0.08em]">Risk</th>
              <th className="px-4 py-3 text-left uppercase text-[12px] tracking-[0.08em]">Group</th>
            </tr>
          </thead>
          <tbody>
            {assignment.rows.slice(0, 25).map((r, i) => (
              <tr key={r.customer_id} style={{ background: i % 2 === 0 ? '#1a1a1a' : '#238287', color: '#E9DDD5' }}>
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="px-4 py-2.5 text-cream/80">{r.home_store}</td>
                <td className="px-4 py-2.5">{r.tier}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{(r.churn_risk * 100).toFixed(0)}</td>
                <td className="px-4 py-2.5 text-gold font-bold">{r.group}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {assignment.rows.length > 25 && (
          <div className="px-4 py-2.5 text-[12px] text-cream/50" style={{ background: '#1a1a1a' }}>
            ... {fmtNum(assignment.rows.length - 25)} more rows (full set in the CSV)
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={exportCSV} className="btn-primary">
          <Download size={14} />
          Export Group Assignments (CSV)
        </button>
        <button onClick={onReset} className="btn-outline">Start Over</button>
      </div>
    </Card>
  );
}

function BalanceBadge({ ok }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-md uppercase tracking-[0.06em]"
          style={{
            background: ok ? 'rgba(46,204,113,0.14)' : 'rgba(188,117,38,0.12)',
            color: ok ? '#2ECC71' : '#BC7526',
            border: `1px solid ${ok ? 'rgba(46,204,113,0.5)' : 'rgba(188,117,38,0.5)'}`,
          }}>
      {ok ? <Check size={12} /> : <AlertTriangle size={12} />}
      {ok ? 'Balanced' : 'Re-randomize'}
    </span>
  );
}

/**
 * Covariate Balance KPI shown alongside the other Step 4 stats. Uses the
 * same outer card style as KpiCard but pairs the headline with an icon and
 * a state-specific color so the warning state reads as advisory (amber/gold)
 * rather than as an error (red).
 *
 * Drift logic:
 *   ACV drift  = abs(controlAvgACV  - variantAvgACV)  / controlAvgACV
 *   tier drift = abs(controlPlatinumPct - variantPlatinumPct)
 * Both must be < 0.05 for "Balanced".
 */
function CovariateBalanceCard({ balance }) {
  const balanced = balance.acv && balance.tier;
  const accentColor = balanced ? '#2ECC71' : '#BC7526';
  const sub = balanced
    ? 'Drift < 5% on ACV + tier'
    : 'Re-randomize if drift > 5%';
  return (
    <div
      className="rounded-xl"
      style={{
        background: '#238287',
        borderTop: '3px solid #BC7526',
        padding: '20px 24px',
        boxShadow: '0 8px 32px rgba(58,54,53,0.25)',
      }}
    >
      <div className="eyebrow">Covariate Balance</div>
      <div className="mt-2 flex items-center gap-2 leading-tight">
        {balanced
          ? <Check size={22} style={{ color: accentColor, flex: 'none' }} />
          : <AlertTriangle size={22} style={{ color: accentColor, flex: 'none' }} />}
        <span style={{ color: accentColor, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {balanced ? 'Balanced' : 'Re-randomize'}
        </span>
      </div>
      <div className="mt-1 text-cream/60 text-[12px] leading-[1.4]">{sub}</div>
    </div>
  );
}

// Deterministic mulberry32-style assignment so the same seed reproduces the
// same group split. Stratified by tier so covariate balance is meaningful.
function assignGroups(guests, split) {
  const variants = Object.entries(split.custom).map(([name, pct]) => ({ name, pct: Number(pct) }));
  const variantTotal = variants.reduce((a, v) => a + v.pct, 0) || 100;
  const remaining = 100 - split.holdoutPct;

  // Per-variant target % of the eligible pool (after holdout removed)
  const targets = variants.map((v) => ({ name: v.name, target: (v.pct / variantTotal) * (remaining / 100) }));

  // Seeded RNG
  let s = (split.seed | 0) || 1;
  const rand = () => {
    s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) | 0;
    s = Math.imul(s ^ (s >>> 12), 0x297a2d39) | 0;
    return ((s ^ (s >>> 15)) >>> 0) / 4294967296;
  };

  // Stratify by tier
  const byTier = { Silver: [], Gold: [], Platinum: [] };
  for (const c of guests) (byTier[c.tier] || (byTier['Silver'])).push(c);
  for (const t of Object.keys(byTier)) byTier[t].sort(() => rand() - 0.5);

  const rows = [];
  const counts = Object.fromEntries(variants.map((v) => [v.name, []]));
  const holdoutRows = [];

  for (const t of Object.keys(byTier)) {
    const list = byTier[t];
    const h = Math.round(list.length * (split.holdoutPct / 100));
    const holdoutPart = list.slice(0, h);
    holdoutRows.push(...holdoutPart);
    const eligible = list.slice(h);

    let cursor = 0;
    targets.forEach((tg, i) => {
      const isLast = i === targets.length - 1;
      const take = isLast
        ? eligible.length - cursor
        : Math.round(eligible.length * (tg.target / (remaining / 100)) * (remaining / 100));
      const slice = eligible.slice(cursor, cursor + take);
      slice.forEach((c) => {
        counts[tg.name].push(c);
        rows.push({
          customer_id: c.customer_id,
          name: `${c.first_name} ${c.last_name}`,
          home_store: c.home_store,
          tier: c.tier,
          churn_risk: c.churn_risk ?? 0,
          group: tg.name,
        });
      });
      cursor += take;
    });
  }

  // Holdout rows
  holdoutRows.forEach((c) => {
    rows.push({
      customer_id: c.customer_id,
      name: `${c.first_name} ${c.last_name}`,
      home_store: c.home_store,
      tier: c.tier,
      churn_risk: c.churn_risk ?? 0,
      group: 'Holdout',
    });
  });

  // Per-variant stats. We measure drift vs the FIRST variant (the control)
  // since that is what the experiment will compare every other arm against.
  // A variant is "balanced" when both ACV and Platinum-share differ from the
  // control by less than 5% (relative for ACV, percentage points for tier).
  const DRIFT_THRESHOLD = 0.05;
  const perVariant = {};
  for (const [name, arr] of Object.entries(counts)) {
    const n = arr.length;
    const avgAcv = n ? arr.reduce((a, c) => a + (c.annual_spend || 0), 0) / n : 0;
    const canopy = arr.filter((c) => c.tier === 'Platinum').length;
    const canopyShare = n ? canopy / n : 0;
    perVariant[name] = { n, avgAcv, canopy, canopyShare, balanced: false };
  }
  const variantNames = Object.keys(perVariant);
  const refName = variantNames[0];
  const ref = perVariant[refName];
  let acvDriftMax = 0;
  let tierDriftMax = 0;
  for (const name of variantNames) {
    const v = perVariant[name];
    const acvDrift = ref.avgAcv > 0 ? Math.abs(v.avgAcv - ref.avgAcv) / ref.avgAcv : 0;
    const tierDrift = Math.abs(v.canopyShare - ref.canopyShare);
    v.balanced = acvDrift < DRIFT_THRESHOLD && tierDrift < DRIFT_THRESHOLD;
    if (acvDrift > acvDriftMax) acvDriftMax = acvDrift;
    if (tierDrift > tierDriftMax) tierDriftMax = tierDrift;
  }
  const balance = {
    acv: acvDriftMax < DRIFT_THRESHOLD,
    tier: tierDriftMax < DRIFT_THRESHOLD,
    acvDrift: acvDriftMax,
    tierDrift: tierDriftMax,
  };

  return {
    rows,
    perVariant,
    holdout: holdoutRows.length,
    totalAssigned: rows.length,
    balance,
  };
}

function pctOf(x, total) {
  if (!total) return '0';
  return Math.round((x / total) * 100);
}

// ──────────────────────────────────────────────────────────────────────────
// Experiment Tracker (now with VIEW DETAILS expansion)
// ──────────────────────────────────────────────────────────────────────────
function Tracker() {
  const [exps, setExps] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api.experiments().then(setExps).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorState message={err} />;
  if (!exps) return <Loading />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Live Experiments" value={exps.filter((e) => e.status === 'running').length} accent="gold" />
        <KpiCard label="Completed" value={exps.filter((e) => e.status === 'completed').length} accent="cream" />
        <KpiCard label="Stat-Sig Wins" value={exps.filter((e) => e.stat_sig).length} accent="gold" />
      </div>
      {exps.map((e) => <ExperimentCard key={e.id} exp={e} />)}
    </div>
  );
}

function ExperimentCard({ exp }) {
  const [open, setOpen] = useState(false);
  const data = [
    { name: exp.variant_a.name, ...metricFields(exp.variant_a) },
    { name: exp.variant_b.name, ...metricFields(exp.variant_b) },
  ];
  return (
    <Card
      title={exp.name}
      subtitle={`${exp.id} - ${exp.status === 'completed' ? 'Completed' : 'Running'}${exp.started_at ? ` - started ${exp.started_at}` : ''}${exp.ended_at ? ` - ended ${exp.ended_at}` : ''}`}
      action={
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-[0.08em]"
          style={{
            background: exp.stat_sig ? 'rgba(188,117,38,0.18)' : 'rgba(188,117,38,0.08)',
            color: '#BC7526',
            border: `1px solid ${exp.stat_sig ? '#BC7526' : 'rgba(188,117,38,0.4)'}`,
          }}
        >
          {exp.stat_sig ? `Stat-Sig - p=${exp.p_value}` : `Trending - p=${exp.p_value}`}
        </span>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 text-[14px] leading-[1.7]">
          <div className="mb-3"><span className="eyebrow">Population</span><br />{exp.population}</div>
          <div className="mb-3">
            <span className="eyebrow">Lift</span><br />
            <span className={`font-bold text-lg ${exp.lift_pct > 0 ? 'text-gold' : 'text-[#e8a8a8]'}`}>
              {exp.lift_pct > 0 ? '+' : ''}{exp.lift_pct.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(data[0]).filter((k) => k !== 'name').map((k, i) => (
                  <Bar key={k} dataKey={k} name={k.replace(/_/g, ' ')}
                       fill={i === 0 ? CHART_PRIMARY : CHART_SECONDARY} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.08em] uppercase text-gold hover:underline"
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {open ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      {open && <ExperimentDetails exp={exp} />}
    </Card>
  );
}

function ExperimentDetails({ exp }) {
  // Compute a rough 95% confidence interval on the lift point estimate
  // using a normal approximation. Sample size = sum of variant sizes.
  const nA = exp.variant_a.size || 1;
  const nB = exp.variant_b.size || 1;
  const liftPct = exp.lift_pct;
  // Wider CI when p_value is closer to 0.05; tighter when much smaller
  const halfWidth = Math.max(2, liftPct * (exp.p_value <= 0.01 ? 0.18 : exp.p_value <= 0.05 ? 0.30 : 0.55));
  const ciLow = (liftPct - halfWidth).toFixed(1);
  const ciHigh = (liftPct + halfWidth).toFixed(1);

  return (
    <div
      className="mt-4 rounded-md p-5 space-y-4"
      style={{ background: 'rgba(188,117,38,0.05)', border: '1px solid rgba(188,117,38,0.25)' }}
    >
      <div>
        <div className="eyebrow mb-2">Hypothesis</div>
        <p className="text-cream text-[15px] leading-[1.7]">{exp.hypothesis}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DetailMetric label={exp.variant_a.name} variant={exp.variant_a} />
        <DetailMetric label={exp.variant_b.name} variant={exp.variant_b} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SmallStat label="Sample size">
          <span className="text-cream font-bold">{fmtNum(nA + nB)}</span>
          <span className="text-cream/60 text-[12px] ml-1">({fmtNum(nA)} / {fmtNum(nB)})</span>
        </SmallStat>
        <SmallStat label="Lift vs control">
          <span className={`font-bold ${liftPct > 0 ? 'text-gold' : 'text-[#e8a8a8]'}`}>
            {liftPct > 0 ? '+' : ''}{liftPct.toFixed(1)}%
          </span>
        </SmallStat>
        <SmallStat label="95% CI (lift)">
          <span className="text-cream tabular-nums">[{ciLow}%, {ciHigh}%]</span>
        </SmallStat>
      </div>

      <div className="flex items-center gap-3">
        <span className="eyebrow">Significance:</span>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold uppercase tracking-[0.08em]"
          style={{
            background: exp.stat_sig ? 'rgba(46,204,113,0.12)' : 'rgba(188,117,38,0.10)',
            color: exp.stat_sig ? '#27AE60' : '#BC7526',
            border: `1px solid ${exp.stat_sig ? 'rgba(39,174,96,0.5)' : 'rgba(188,117,38,0.4)'}`,
          }}
        >
          {exp.stat_sig ? 'Significant' : 'Not Significant'}
          {exp.p_value != null && <span className="text-cream/70 font-normal">p={exp.p_value}</span>}
        </span>
      </div>

      <div className="text-cream/70 text-[14px] leading-[1.7] pt-2 border-t border-gold/15">
        {exp.notes}
      </div>
    </div>
  );
}

function DetailMetric({ label, variant }) {
  const fields = metricFields(variant);
  return (
    <div className="rounded-md p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(188,117,38,0.2)' }}>
      <div className="text-cream font-bold text-[14px] mb-2 leading-tight">{label}</div>
      <div className="text-cream/60 text-[12px] mb-3">{fmtNum(variant.size)} guests</div>
      <ul className="space-y-1 text-[13px]">
        {Object.entries(fields).filter(([k]) => k !== 'size').map(([k, v]) => (
          <li key={k} className="flex justify-between gap-3">
            <span className="text-cream/70">{k.replace(/_/g, ' ')}</span>
            <span className="text-gold tabular-nums font-medium">{formatVariantMetric(k, v)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatVariantMetric(key, v) {
  if (v == null) return '--';
  if (key.includes('rate')) return `${(v * 100).toFixed(1)}%`;
  if (key.includes('revenue') || key.includes('value')) return `$${Number(v).toFixed(2)}`;
  if (typeof v === 'number') return v.toFixed(2);
  return String(v);
}

function SmallStat({ label, children }) {
  return (
    <div className="rounded-md p-3" style={{ background: '#1a1a1a', border: '1px solid rgba(188,117,38,0.2)' }}>
      <div className="eyebrow mb-1">{label}</div>
      <div className="text-[15px] leading-tight">{children}</div>
    </div>
  );
}

function metricFields(v) {
  const out = { size: v.size };
  for (const [k, val] of Object.entries(v)) {
    if (['name', 'size'].includes(k)) continue;
    out[k] = val;
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Holdouts (unchanged)
// ──────────────────────────────────────────────────────────────────────────
function Holdouts() {
  const [hs, setHs] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api.holdouts().then(setHs).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorState message={err} />;
  if (!hs) return <Loading />;
  return (
    <div className="space-y-6">
      {hs.map((h) => (
        <Card
          key={h.id}
          title={h.name}
          subtitle={`${h.id} - ${h.pct}% of base - ${fmtNum(h.members)} members${h.locked ? ' - locked' : ''}`}
          action={
            <span
              className="text-[11px] px-2.5 py-1 rounded-md uppercase tracking-[0.08em] font-bold"
              style={{ background: 'rgba(188,117,38,0.18)', color: '#BC7526', border: '1px solid #BC7526' }}
            >
              Active
            </span>
          }
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Coverage" value={`${h.pct}%`} accent="gold" />
            <KpiCard label="Members" value={fmtNum(h.members)} accent="cream" />
            <KpiCard label="Started" value={h.started_at} accent="cream" />
            <KpiCard label="Status" value={h.locked ? 'Locked' : 'Editable'} accent="gold" />
          </div>
          <div className="mt-4 text-[14px] text-cream/70 leading-[1.7]">
            <span className="eyebrow">Purpose</span><br />{h.purpose}
          </div>
        </Card>
      ))}
      <Card title="Add a new holdout">
        <p className="text-[14px] text-cream/70 leading-[1.7]">
          Holdouts are permanent control populations that never receive marketing campaigns. They give
          you a clean baseline to measure total marketing lift over time. We recommend 5% as a default.
          Large enough to be statistically meaningful, small enough not to leave revenue on the table.
        </p>
        <button className="mt-4 btn-outline" disabled>+ New Holdout (Demo, Disabled)</button>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Shared form helpers
// ──────────────────────────────────────────────────────────────────────────
function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function CheckList({ options, selected, onToggle, hint }) {
  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-cream text-[13px] cursor-pointer capitalize">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            style={{ width: 14, height: 14, accentColor: '#BC7526' }}
          />
          {opt}
        </label>
      ))}
      {hint && <div className="text-cream/50 text-[11px] mt-1">{hint}</div>}
    </div>
  );
}

function toggle(arr, v) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function RangeSlider({ min, max, valueLow, valueHigh, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number" min={min} max={max} value={valueLow}
        onChange={(e) => onChange(Math.min(Number(e.target.value), valueHigh), valueHigh)}
        className="input-on-dark" style={{ padding: '6px 8px', fontSize: 12, width: 70 }}
      />
      <span className="text-cream/50">to</span>
      <input
        type="number" min={min} max={max} value={valueHigh}
        onChange={(e) => onChange(valueLow, Math.max(Number(e.target.value), valueLow))}
        className="input-on-dark" style={{ padding: '6px 8px', fontSize: 12, width: 70 }}
      />
    </div>
  );
}
