import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '../lib/api.js';
import { fmt$, fmt$0, fmtNum, fmtPctRaw } from '../lib/format.js';
import { KpiCard } from './components/KpiCard.jsx';
import { Card } from './components/Card.jsx';
import { Loading, ErrorState } from './components/Loading.jsx';
import { PageHeader } from './components/PageHeader.jsx';

// Oak Island AI chart palette on dark sections.
export const CHART_PRIMARY   = '#BC7526'; // amber
export const CHART_SECONDARY = '#99C0BF'; // teal
export const CHART_TERTIARY  = '#E9DDD5'; // tan
export const CHART_ALERT     = '#a83232';

const TIER_COLORS = {
  Silver:   '#E9DDD5',
  Gold:     '#99C0BF',
  Platinum: '#BC7526',
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [nba, setNba] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([api.summary(), api.nba()])
      .then(([s, n]) => { setSummary(s); setNba(n.priority); })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorState message={err} retry={() => location.reload()} />;
  if (!summary) return <Loading label="Loading dashboard..." />;

  const tierData = Object.entries(summary.tier_counts).map(([name, value]) => ({ name, value }));
  const acvSeries = summary.acv_trend.map((m) => ({
    month: m.month.slice(2),
    revenue: m.revenue,
    acv: m.acv,
  }));
  const storeRev = [...summary.store_revenue].sort((a, b) => b.revenue - a.revenue);
  const overallACV = summary.acv_trend.reduce((a, m) => a + m.acv, 0) / summary.acv_trend.length;

  return (
    <div>
      <PageHeader
        category="Workspace"
        title="Dashboard"
        description="Northwood Hospitality Group, fictional 9-property the Carolina coast hospitality operator. All data synthetic."
      />

      <div data-tour-id="kpi-strip" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Guests" value={fmtNum(summary.totals.customers)} sub="Loyalty members" accent="cream" />
        <KpiCard label="Avg Folio Value" value={fmt$(overallACV)} sub="24-month rolling" accent="gold" />
        <KpiCard label="Active Members" value={fmtNum(summary.totals.customers)} sub="Northwood Rewards" accent="gold" />
        <KpiCard
          label="At-Risk Guests"
          value={fmtNum(summary.at_risk.count)}
          sub={`${fmtPctRaw(summary.at_risk.pct_of_base)} of base, 45-day threshold`}
          accent="alert"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Guest Value Trend" subtitle="24 months, summer peak Jun to Aug with holiday bump in late December" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={acvSeries} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => fmt$(v)} />
                <Line type="monotone" dataKey="acv" stroke={CHART_PRIMARY} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Guests by Tier" subtitle="Silver / Gold / Platinum">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {tierData.map((d) => <Cell key={d.name} fill={TIER_COLORS[d.name]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtNum(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Revenue by Property" subtitle="Bald Head Island Club highest folio value, Wrightsville Beach Resort highest volume" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeRev} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="store" angle={-25} textAnchor="end" height={70} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt$0(v)} />
                <Bar dataKey="revenue" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top Funnel Signals">
          <ul className="space-y-3 text-[14px]">
            <Signal label="Rising Stars" value={summary.rising_stars}
                    sub="Silver-tier guests showing 4x spend acceleration" to="/demo/models/rising-stars" />
            <Signal label="Near Platinum" value={summary.near_platinum}
                    sub="Gold guests within $400 of Platinum" to="/demo/models/near-platinum" />
            <Signal label="Decliners" value={summary.decliners}
                    sub="20%+ spend decline, concentrated at Wrightsville Beach Resort and the Tavern" to="/demo/models/decliner-detection" />
            <Signal label="VIP Likely" value={summary.vip_likely}
                    sub="Bald Head Island Club and Southport Waterfront Lodge heavy concentration" to="/demo/models/vip-likely" />
          </ul>
        </Card>
      </div>

      <div data-tour-id="nba-table">
      <Card
        title="Next Best Action, top 10 priority guests"
        subtitle="Synthesized across all 13 models, refreshed nightly"
        action={
          <Link to="/demo/models/churn-risk" className="text-gold hover:underline text-[13px]">
            See full churn list &rarr;
          </Link>
        }
      >
        {/* Mobile: card-stacked view. Each priority guest reads as a single
            card with the rank + name + tier headlining, property + lifetime
            $ as secondary metadata, action and reason as the body. Avoids
            tier-badge truncation and inconsistent row heights that the
            table layout produces at narrow viewports. */}
        <div className="md:hidden space-y-3">
          {(nba || []).map((r, i) => (
            <div
              key={r.customer_id}
              className="rounded-md p-4"
              style={{ background: '#3a3635', border: '1px solid rgba(194,124,42,0.20)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="text-cream/55 text-[11px] font-bold tabular-nums tracking-wider mb-1">
                    #{i + 1}
                  </div>
                  <div className="text-cream font-bold text-[16px] leading-tight">{r.name}</div>
                  <div className="text-cream/70 text-[12px] mt-1">
                    {r.home_store} · {fmt$0(r.lifetime_spend)} lifetime
                  </div>
                </div>
                <div className="flex-none"><TierPill tier={r.tier} /></div>
              </div>
              <div className="text-gold text-[13px] font-bold mt-3">{r.action}</div>
              <div className="text-cream/70 text-[12px] leading-[1.5] mt-1">{r.reason}</div>
            </div>
          ))}
        </div>

        {/* Desktop: full table, columns kept intact via horizontal scroll
            fallback if the viewport is narrower than the layout demands. */}
        <div className="hidden md:block overflow-x-auto rounded-md" style={{ border: '1px solid rgba(194,124,42,0.25)' }}>
          <table className="w-full text-[14px]">
            <thead style={{ background: '#3a3635', color: '#BC7526' }}>
              <tr>
                <th className="text-left px-4 py-3 font-bold uppercase text-[12px] tracking-[0.08em]">#</th>
                <th className="text-left px-4 py-3 font-bold uppercase text-[12px] tracking-[0.08em]">Guest</th>
                <th className="text-left px-4 py-3 font-bold uppercase text-[12px] tracking-[0.08em]">Property</th>
                <th className="text-left px-4 py-3 font-bold uppercase text-[12px] tracking-[0.08em]">Tier</th>
                <th className="text-right px-4 py-3 font-bold uppercase text-[12px] tracking-[0.08em]">Lifetime $</th>
                <th className="text-left px-4 py-3 font-bold uppercase text-[12px] tracking-[0.08em]">Recommended Action</th>
                <th className="text-left px-4 py-3 font-bold uppercase text-[12px] tracking-[0.08em]">Reason</th>
              </tr>
            </thead>
            <tbody>
              {(nba || []).map((r, i) => (
                <tr key={r.customer_id} style={{ background: i % 2 === 0 ? '#3a3635' : '#6c8585', color: '#E9DDD5' }}>
                  <td className="px-4 py-2.5 align-middle text-cream/60">{i + 1}</td>
                  <td className="px-4 py-2.5 align-middle font-bold">{r.name}</td>
                  <td className="px-4 py-2.5 align-middle text-cream/80">{r.home_store}</td>
                  <td className="px-4 py-2.5 align-middle"><TierPill tier={r.tier} /></td>
                  <td className="px-4 py-2.5 align-middle text-right tabular-nums">{fmt$0(r.lifetime_spend)}</td>
                  <td className="px-4 py-2.5 align-middle text-gold">{r.action}</td>
                  <td className="px-4 py-2.5 align-middle text-cream/70">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  );
}

function Signal({ label, value, sub, to }) {
  return (
    <li>
      <Link to={to} className="block px-3 py-2 rounded-md hover:bg-mid-olive/40 transition-colors">
        <div className="flex items-baseline justify-between">
          <span className="text-cream">{label}</span>
          <span className="font-bold text-gold">{fmtNum(value)}</span>
        </div>
        {sub && <div className="text-cream/60 text-[12px] mt-0.5">{sub}</div>}
      </Link>
    </li>
  );
}

export function TierPill({ tier }) {
  const styles = {
    Platinum: { background: 'rgba(194,124,42,0.20)', color: '#BC7526', border: '1px solid rgba(194,124,42,0.55)' },
    Gold:     { background: 'rgba(149,174,173,0.25)', color: '#E9DDD5', border: '1px solid rgba(149,174,173,0.65)' },
    Silver:   { background: 'rgba(224,212,188,0.18)', color: '#E9DDD5', border: '1px solid rgba(224,212,188,0.5)' },
  }[tier] || {};
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-[0.06em]"
      style={styles}
    >
      {tier}
    </span>
  );
}
