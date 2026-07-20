import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { fmt$, fmt$0, fmtNum, fmtPct, fmtPctRaw } from '../lib/format.js';
import { Card, EmbedNote } from './components/Card.jsx';
import { KpiCard } from './components/KpiCard.jsx';
import { DataTable } from './components/DataTable.jsx';
import { Loading, ErrorState } from './components/Loading.jsx';
import { PageHeader } from './components/PageHeader.jsx';
import { FilterSidebar } from './components/FilterSidebar.jsx';
import { SkeletonRows, PreRunEmpty } from './components/SkeletonRows.jsx';
import { TierPill, CHART_PRIMARY, CHART_SECONDARY, CHART_TERTIARY, CHART_ALERT } from './Dashboard.jsx';
import { MODEL_BY_SLUG } from './models.config.js';
import { applyFilters, rowCount, filtersToLabel, DEFAULT_FILTERS } from './lib/applyFilters.js';

export default function ModelPage() {
  const { slug } = useParams();
  const meta = MODEL_BY_SLUG[slug];
  if (!meta) return <Navigate to="/demo/dashboard" replace />;
  return <ModelPageInner meta={meta} key={meta.id} />;
}

function ModelPageInner({ meta }) {
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);
  const [engine, setEngine] = useState('js-heuristic');

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [filteredOut, setFilteredOut] = useState(null);
  const [runAt, setRunAt] = useState(null);

  useEffect(() => {
    setOut(null); setErr(null); setFilteredOut(null); setHasRun(false); setRunAt(null);
    (async () => {
      try {
        const r = await fetch(`/api/models/${meta.id}`);
        setEngine(r.headers.get('x-ilp-engine') || 'js-heuristic');
        if (!r.ok) throw new Error(`API ${r.status}`);
        setOut(await r.json());
      } catch (e) { setErr(e.message); }
    })();
  }, [meta.id]);

  const runModel = () => {
    if (!out || running) return;
    setRunning(true);
    const delay = 2000 + Math.random() * 800;
    window.setTimeout(() => {
      setFilteredOut(applyFilters(out, filters));
      setHasRun(true);
      setRunAt(Date.now());
      setRunning(false);
    }, delay);
  };

  return (
    <div>
      <PageHeader
        category={meta.section}
        title={meta.name}
        description={DESCRIPTIONS[meta.id]}
        action={
          <span
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-[0.08em]"
            style={{ background: 'rgba(188,117,38,0.14)', color: '#BC7526', border: '1px solid rgba(188,117,38,0.4)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold"/>
            engine: {engine}
          </span>
        }
      />

      {err && <ErrorState message={err} />}
      {!out && !err && <Loading />}

      {out && (
        <div className="flex flex-col lg:flex-row gap-6">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onRun={runModel}
            running={running}
            hasRun={hasRun}
          />

          <main className="flex-1 min-w-0">
            {hasRun && filteredOut ? (
              <ResultsHeader
                filters={filters}
                count={rowCount(filteredOut)}
                runAt={runAt}
              />
            ) : null}

            {!hasRun ? (
              <PreRunSurface />
            ) : (
              <div style={{ animation: 'ilp-results-in 0.4s ease-out both' }}>
                {RENDERERS[meta.id]
                  ? RENDERERS[meta.id](filteredOut)
                  : <pre className="text-cream/70 text-xs">{JSON.stringify(filteredOut, null, 2)}</pre>}
              </div>
            )}

            {(out.embed_note) && (
              <div className="mt-6"><EmbedNote>{out.embed_note}</EmbedNote></div>
            )}
          </main>
        </div>
      )}

      <style>{`
        @keyframes ilp-results-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function PreRunSurface() {
  return (
    <div>
      <PreRunEmpty />
      <SkeletonRows count={5} />
    </div>
  );
}

function ResultsHeader({ filters, count, runAt }) {
  const stamp = runAt ? formatStamp(runAt) : 'just now';
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
      <div className="text-gold text-[13px] leading-[1.5]">
        {count != null
          ? <>Showing <strong>{fmtNum(count)}</strong> {count === 1 ? 'guest' : 'guests'} · {filtersToLabel(filters)}</>
          : <>Aggregate model · {filtersToLabel(filters)}</>}
      </div>
      <div className="text-cream/50 text-[12px]">Model last run: {stamp}</div>
    </div>
  );
}

function formatStamp(ts) {
  const ageSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (ageSec < 5)   return 'just now';
  if (ageSec < 60)  return `${ageSec}s ago`;
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m ago`;
  return new Date(ts).toLocaleTimeString();
}

const DESCRIPTIONS = {
  'churn': 'Likelihood that a guest lapses within the next 30 days. 45-day at-risk threshold tuned to seasonal hospitality cadence.',
  'acv-forecast': 'Forecasts revenue and average folio value for the next 6 months using trailing seasonality and trend.',
  'tier-migration': 'Movement between Silver, Gold, and Platinum tiers over the trailing year.',
  'campaign-response': 'Predicted response rate for any (segment x channel) combination.',
  'decliners': 'Guests showing 20%+ spend decline in the trailing six months.',
  'rising-stars': 'Silver-tier guests with 4x spend acceleration in the last 60 days.',
  'near-platinum': 'Gold-tier guests within $400 of crossing into Platinum.',
  'vip-likely': 'Guests most likely to convert into VIP / concierge program members.',
  'clv': 'Lifetime value estimate per guest, plus distribution across the guest base.',
  'basket': 'Recommended next-line-in-basket given an anchor category (spa, dining, room, activity combinations).',
  'upsell': 'Higher-tier recommendations within an existing stay pattern: room class upgrades, suite tier moves, and premium add-ons.',
  'cross-sell': 'Cross-property recommendations: dining guest into spa, hotel guest into event venue, and similar pairings.',
  'return-visit': 'Predicted timing of next visit based on per-guest cadence and seasonal pattern.',
};

const RENDERERS = {

  'churn': (out) => {
    const histogram = [
      { bucket: 'Low (<0.45)',         count: out.low_count },
      { bucket: 'Medium (0.45 to 0.65)', count: out.medium_count },
      { bucket: 'High (>=0.65)',        count: out.high_count },
    ];
    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label="At-Risk" value={fmtNum(out.at_risk_count)} sub=">=0.65 risk and 45+ days" accent="alert" />
          <KpiCard label="High Risk" value={fmtNum(out.high_count)} accent="alert" />
          <KpiCard label="Medium Risk" value={fmtNum(out.medium_count)} accent="gold" />
          <KpiCard label="Low Risk" value={fmtNum(out.low_count)} accent="cream" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card title="Risk Distribution">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis />
                  <Tooltip formatter={(v) => fmtNum(v)} />
                  <Bar dataKey="count" fill={CHART_ALERT} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="At-Risk Rate by Property" subtitle="The casual restaurant (Carolina Beach Tavern) shows roughly 2x the chain average" className="lg:col-span-2">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={out.store_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="store" angle={-25} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(v) => fmtPct(v)} />
                  <Bar dataKey="rate" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Card title="Ranked at-risk guests" subtitle={`${fmtNum(out.ranked.length)} guests, highest risk first`}>
          <DataTable
            rows={out.ranked}
            exportFilename="churn-risk"
            columns={[
              { key: 'customer_id', label: 'Guest ID', sortable: true },
              { key: 'name', label: 'Name', sortable: true },
              { key: 'home_store', label: 'Home property', sortable: true },
              { key: 'tier', label: 'Tier', sortable: true, render: (r) => <TierPill tier={r.tier} /> },
              { key: 'days_since_last', label: 'Days since', sortable: true, numeric: true, format: 'num' },
              { key: 'visits_90d', label: 'Visits 90d', sortable: true, numeric: true, format: 'num' },
              { key: 'churn_risk', label: 'Risk', sortable: true, numeric: true, format: 'pct' },
              { key: 'recommended_action', label: 'Recommended action' },
            ]}
          />
        </Card>
      </>
    );
  },

  'acv-forecast': (out) => {
    const series = [...out.history, ...out.forecast].map((m) => ({
      month: m.month.slice(2),
      historical: m.forecast ? null : m.revenue,
      forecast: m.forecast ? m.revenue : null,
    }));
    return (
      <>
        <Card title="24-month history plus 6-month forecast" subtitle="Combined revenue across 9 properties">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.6}/>
                    <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="fcastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_SECONDARY} stopOpacity={0.5}/>
                    <stop offset="95%" stopColor={CHART_SECONDARY} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt$0(v)} />
                <Legend />
                <Area type="monotone" dataKey="historical" name="Historical" stroke={CHART_PRIMARY}
                      fill="url(#histGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="forecast" name="Forecast" stroke={CHART_SECONDARY}
                      fill="url(#fcastGrad)" strokeWidth={2.5} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card title="Forecast, next 6 months">
            <DataTable
              rows={out.forecast}
              exportFilename="acv-forecast"
              search={false}
              pageSize={6}
              columns={[
                { key: 'month', label: 'Month' },
                { key: 'revenue', label: 'Forecast Revenue', numeric: true, format: 'currency', sortable: true },
                { key: 'seasonal_index', label: 'Seasonal Idx', numeric: true, sortable: true,
                  render: (r) => `${r.seasonal_index.toFixed(2)}x` },
              ]}
            />
          </Card>
          <Card title="Historical month-over-month">
            <DataTable
              rows={[...out.history].reverse().slice(0, 12)}
              exportFilename="acv-historical"
              search={false}
              pageSize={12}
              columns={[
                { key: 'month', label: 'Month' },
                { key: 'transactions', label: 'Folios', numeric: true, format: 'num' },
                { key: 'revenue', label: 'Revenue', numeric: true, format: 'currency' },
                { key: 'acv', label: 'Avg Folio', numeric: true, format: 'currency' },
              ]}
            />
          </Card>
        </div>
      </>
    );
  },

  'tier-migration': (out) => {
    const totalUpgrades = (out.flows['Silver->Gold'] || 0) + (out.flows['Gold->Platinum'] || 0);
    const totalDowngrades = (out.flows['Gold->Silver'] || 0) + (out.flows['Platinum->Gold'] || 0);
    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Silver to Gold" value={fmtNum(out.flows['Silver->Gold'])} accent="gold" />
          <KpiCard label="Gold to Platinum" value={fmtNum(out.flows['Gold->Platinum'])} accent="gold" />
          <KpiCard label="Total upgrades" value={fmtNum(totalUpgrades)} accent="cream" />
          <KpiCard label="Total downgrades" value={fmtNum(totalDowngrades)} accent="alert" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Flow matrix (prior year to current)">
            <div className="overflow-x-auto rounded-md" style={{ border: '1px solid rgba(188,117,38,0.25)' }}>
              <table className="w-full text-[14px]">
                <thead style={{ background: '#1a1a1a', color: '#BC7526' }}>
                  <tr>
                    <th className="px-4 py-2.5 text-left uppercase text-[12px] tracking-[0.08em]">From / To</th>
                    {['Silver','Gold','Platinum'].map((t) => (
                      <th key={t} className="px-4 py-2.5 text-right uppercase text-[12px] tracking-[0.08em]">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Silver','Gold','Platinum'].map((from, i) => (
                    <tr key={from} style={{ background: i % 2 === 0 ? '#1a1a1a' : '#238287', color: '#E9DDD5' }}>
                      <td className="px-4 py-2.5 font-bold">{from}</td>
                      {['Silver','Gold','Platinum'].map((to) => {
                        const v = out.flows[`${from}->${to}`] || 0;
                        const isUp = ((from === 'Silver' && to !== 'Silver') || (from === 'Gold' && to === 'Platinum'));
                        const isDown = ((from === 'Platinum' && to !== 'Platinum') || (from === 'Gold' && to === 'Silver'));
                        return (
                          <td key={to} className={`px-4 py-2.5 text-right tabular-nums ${
                            isUp ? 'text-gold' : isDown ? 'text-[#e8a8a8]' : 'text-cream/60'
                          }`}>
                            {fmtNum(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Silver to Gold upgrade rate by property" subtitle="Cape Fear Inn leads on repeat-visit frequency">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={out.upgrade_by_store}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="store" angle={-25} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(v) => fmtPct(v)} />
                  <Bar dataKey="upgrade_rate" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </>
    );
  },

  'campaign-response': (out) => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Push vs Email Lift (Silver)" value={`+${out.push_vs_email_lift_sprout_pct.toFixed(1)}%`}
                 sub="On redemption rate" accent="gold" />
        <KpiCard label="Channels Live" value="3" sub="Email, SMS, Push" accent="cream" />
        <KpiCard label="Tiers Covered" value="3" sub="Silver, Gold, Platinum" accent="cream" />
      </div>
      <Card title="Open / click / redeem by tier x channel">
        <DataTable
          rows={out.rows}
          exportFilename="campaign-response"
          search={false}
          pageSize={9}
          columns={[
            { key: 'tier', label: 'Tier', render: (r) => <TierPill tier={r.tier} /> },
            { key: 'channel', label: 'Channel', sortable: true },
            { key: 'sent', label: 'Sent', numeric: true, format: 'num', sortable: true },
            { key: 'open_rate', label: 'Open', numeric: true, format: 'pct', sortable: true },
            { key: 'click_rate', label: 'Click', numeric: true, format: 'pct', sortable: true },
            { key: 'redeem_rate', label: 'Redeem', numeric: true, format: 'pct', sortable: true },
            { key: 'revenue', label: 'Revenue', numeric: true, format: 'currency', sortable: true },
          ]}
        />
      </Card>
    </>
  ),

  'decliners': (out) => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Decliners Detected" value={fmtNum(out.count)} accent="alert" />
        <KpiCard label="Threshold" value="20%+" sub="Spend decline trailing 6mo" accent="gold" />
        <KpiCard label="Top Concentration" value={out.by_store[0]?.store || '--'} sub={`${out.by_store[0]?.count || 0} guests`} accent="cream" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Concentration by property">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={out.by_store} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="store" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill={CHART_ALERT} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Decliner detail" className="lg:col-span-2">
          <DataTable
            rows={out.list}
            exportFilename="decliners"
            columns={[
              { key: 'name', label: 'Guest', sortable: true },
              { key: 'home_store', label: 'Property', sortable: true },
              { key: 'tier', label: 'Tier', render: (r) => <TierPill tier={r.tier} /> },
              { key: 'annual_spend', label: 'Annual $', numeric: true, format: 'currency', sortable: true },
              { key: 'avg_basket', label: 'Avg folio', numeric: true, format: 'currency', sortable: true },
              { key: 'decline_pct', label: 'Decline', numeric: true, sortable: true,
                render: (r) => <span style={{ color: '#e8a8a8' }}>-{r.decline_pct}%</span> },
              { key: 'recommended_action', label: 'Action' },
            ]}
          />
        </Card>
      </div>
    </>
  ),

  'rising-stars': (out) => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Rising Stars" value={fmtNum(out.count)} accent="gold" />
        <KpiCard label="Acceleration" value="4x" sub="vs trailing 60-day baseline" accent="gold" />
        <KpiCard label="Concentrated In" value="Wrightsville Beach Resort + Cape Fear Inn" sub="New repeat guests driving lift" accent="cream" />
      </div>
      <Card title="Rising star detail">
        <DataTable
          rows={out.list}
          exportFilename="rising-stars"
          columns={[
            { key: 'name', label: 'Guest', sortable: true },
            { key: 'home_store', label: 'Property', sortable: true },
            { key: 'tier', label: 'Tier', render: (r) => <TierPill tier={r.tier} /> },
            { key: 'annual_spend', label: 'Annual $', numeric: true, format: 'currency', sortable: true },
            { key: 'visits_90d', label: 'Visits 90d', numeric: true, format: 'num', sortable: true },
            { key: 'acceleration_x', label: 'Accel', numeric: true, sortable: true,
              render: (r) => <span className="text-gold">{r.acceleration_x.toFixed(1)}x</span> },
            { key: 'recommended_action', label: 'Action' },
          ]}
        />
      </Card>
    </>
  ),

  'near-platinum': (out) => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Near Platinum" value={fmtNum(out.count)} accent="gold" />
        <KpiCard label="Average Gap" value={fmt$(out.avg_gap)} sub="To $3,000 Platinum threshold" accent="gold" />
        <KpiCard label="If Converted" value={fmt$0(out.count * 700)} sub="Estimated incremental annual rev" accent="cream" />
      </div>
      <Card title="Gold guests within $400 of Platinum">
        <DataTable
          rows={out.list}
          exportFilename="near-platinum"
          columns={[
            { key: 'name', label: 'Guest', sortable: true },
            { key: 'home_store', label: 'Property', sortable: true },
            { key: 'annual_spend', label: 'Annual $', numeric: true, format: 'currency', sortable: true },
            { key: 'gap_to_canopy', label: 'Gap', numeric: true, format: 'currency', sortable: true,
              render: (r) => <span className="text-gold">-{fmt$(r.gap_to_canopy)}</span> },
            { key: 'recommended_action', label: 'Recommended action' },
          ]}
        />
      </Card>
    </>
  ),

  'vip-likely': (out) => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="VIP-Likely" value={fmtNum(out.count)} accent="gold" />
        <KpiCard label="Top Property" value={out.by_store[0]?.store || '--'} sub={`${out.by_store[0]?.count || 0} guests`} accent="gold" />
        <KpiCard label="Resort Share" value={
          fmtPctRaw(((out.by_store.find((s) => s.store === 'Bald Head Island Club')?.count || 0) +
                     (out.by_store.find((s) => s.store === 'Southport Waterfront Lodge')?.count || 0)) / out.count * 100)
        } sub="Of all VIP-Likely (Bald Head Island Club + Southport Waterfront Lodge)" accent="cream" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="VIP-Likely by property">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={out.by_store}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="store" angle={-30} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="VIP-Likely detail" className="lg:col-span-2">
          <DataTable
            rows={out.list}
            exportFilename="vip-likely"
            columns={[
              { key: 'name', label: 'Guest', sortable: true },
              { key: 'home_store', label: 'Property', sortable: true },
              { key: 'tier', label: 'Tier', render: (r) => <TierPill tier={r.tier} /> },
              { key: 'annual_spend', label: 'Annual $', numeric: true, format: 'currency', sortable: true },
              { key: 'avg_basket', label: 'Avg folio', numeric: true, format: 'currency', sortable: true },
              { key: 'vip_score', label: 'Score', numeric: true, sortable: true,
                render: (r) => <span className="text-gold">{(r.vip_score * 100).toFixed(0)}</span> },
              { key: 'recommended_action', label: 'Action' },
            ]}
          />
        </Card>
      </div>
    </>
  ),

  'clv': (out) => {
    const top5 = out.distribution.find((d) => d.bucket === 'Top 5%')?.share || 0;
    const colors = [CHART_PRIMARY, CHART_SECONDARY, '#E9DDD5', 'rgba(188,117,38,0.3)'];
    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label="Top-5% Share of CLV" value={`${top5}%`} sub="of total revenue" accent="gold" />
          <KpiCard label="Avg Projected (12mo)" value={fmt$0(
            out.top_customers.reduce((a, c) => a + c.projected_12mo, 0) / out.top_customers.length
          )} sub="Among top 100" accent="gold" />
          <KpiCard label="Top Guest" value={fmt$0(out.top_customers[0]?.clv_estimate)} accent="cream"
                   sub={out.top_customers[0]?.name} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card title="CLV concentration">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={out.distribution} dataKey="share" nameKey="bucket" innerRadius={45} outerRadius={90} paddingAngle={2}>
                    {out.distribution.map((d, i) => <Cell key={d.bucket} fill={colors[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Top 100 guests by CLV" className="lg:col-span-2">
            <DataTable
              rows={out.top_customers}
              exportFilename="clv-top-100"
              columns={[
                { key: 'name', label: 'Guest', sortable: true },
                { key: 'tier', label: 'Tier', render: (r) => <TierPill tier={r.tier} /> },
                { key: 'home_store', label: 'Property', sortable: true },
                { key: 'lifetime_spend', label: 'Lifetime $', numeric: true, format: 'currency', sortable: true },
                { key: 'projected_12mo', label: 'Projected 12mo', numeric: true, format: 'currency', sortable: true },
                { key: 'clv_estimate', label: 'CLV', numeric: true, format: 'currency', sortable: true },
              ]}
            />
          </Card>
        </div>
      </>
    );
  },

  'basket': (out) => {
    const cats = Object.keys(out.cooccurrence);
    const mixData = cats.map((c) => ({
      category: c,
      resort: out.mix.resort[c] || 0,
      urban: out.mix.urban[c] || 0,
    }));
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card title="Resort vs everyday property mix" subtitle="Resort properties skew toward Spa and Activities">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mixData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-30} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="urban" name="Everyday properties" fill={CHART_SECONDARY} />
                  <Bar dataKey="resort" name="Resort properties" fill={CHART_PRIMARY} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Top basket recommendations">
            <DataTable
              rows={out.top_recommendations}
              search={false}
              pageSize={10}
              exportFilename="basket-recs"
              columns={[
                { key: 'anchor', label: 'Anchor item' },
                { key: 'recommend', label: 'Recommended pair' },
                { key: 'confidence', label: 'Confidence', numeric: true, sortable: true,
                  render: (r) => <span className="text-gold">{(r.confidence * 100).toFixed(0)}%</span> },
              ]}
            />
          </Card>
        </div>
        <Card title="Co-occurrence matrix" subtitle="Categories bought together on the same folio">
          <div className="overflow-x-auto rounded-md" style={{ border: '1px solid rgba(188,117,38,0.25)' }}>
            <table className="w-full text-[12px]">
              <thead style={{ background: '#1a1a1a', color: '#BC7526' }}>
                <tr>
                  <th className="px-3 py-2 text-left uppercase tracking-[0.08em]">Anchor / With</th>
                  {cats.map((c) => <th key={c} className="px-3 py-2 text-right uppercase tracking-[0.08em]">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {cats.map((from, ri) => (
                  <tr key={from} style={{ background: ri % 2 === 0 ? '#1a1a1a' : '#238287', color: '#E9DDD5' }}>
                    <td className="px-3 py-2 font-bold">{from}</td>
                    {cats.map((to) => {
                      const v = out.cooccurrence[from][to];
                      const max = Math.max(...cats.flatMap((c) => Object.values(out.cooccurrence[c]).filter((x, i, a) => a[i] !== a[a.length - 1])));
                      const intensity = max ? Math.min(0.7, v / max) : 0;
                      return (
                        <td key={to} className="px-3 py-2 text-right tabular-nums"
                            style={{ background: from === to ? 'transparent' : `rgba(188,117,38,${intensity})`,
                                     color: from === to ? '#E9DDD5' : (intensity > 0.4 ? '#1a1a1a' : '#E9DDD5') }}>
                          {from === to ? <span className="text-cream/40">--</span> : fmtNum(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    );
  },

  'upsell': (out) => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Standard Room Bookings" value={fmtNum(out.flower_buyers)} accent="cream" />
        <KpiCard label="Never Booked a Suite" value={fmtNum(out.flower_without_concentrates)} accent="gold" />
        <KpiCard label="Upsell Gap" value={`${out.upsell_gap_pct}%`} sub="Of room guests have never moved up a class" accent="gold" />
      </div>
      <Card title="Candidate upsell paths">
        <DataTable
          rows={out.candidate_products}
          search={false}
          pageSize={10}
          exportFilename="upsell"
          columns={[
            { key: 'from', label: 'Upsell path' },
            { key: 'est_lift', label: 'Estimated lift' },
            { key: 'confidence', label: 'Confidence', numeric: true,
              render: (r) => <span className="text-gold">{(r.confidence * 100).toFixed(0)}%</span> },
          ]}
        />
      </Card>
    </>
  ),

  'cross-sell': (out) => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Diversity by anchor category" subtitle="Dining-only guests have the lowest avg diversity">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={out.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="anchor_category" angle={-30} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avg_diversity" fill={CHART_SECONDARY} name="Avg category count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Single-category share">
          <DataTable
            rows={out.rows}
            search={false}
            pageSize={10}
            exportFilename="cross-sell-diversity"
            columns={[
              { key: 'anchor_category', label: 'Anchor', sortable: true },
              { key: 'customers', label: 'Guests', numeric: true, format: 'num', sortable: true },
              { key: 'avg_diversity', label: 'Avg diversity', numeric: true, sortable: true },
              { key: 'single_category_pct', label: 'Single-cat %', numeric: true, sortable: true,
                render: (r) => `${r.single_category_pct.toFixed(1)}%` },
            ]}
          />
        </Card>
      </div>
      <Card title="Top cross-property pairs">
        <DataTable
          rows={out.top_cross_sell_pairs}
          search={false}
          pageSize={10}
          exportFilename="cross-sell-pairs"
          columns={[
            { key: 'from', label: 'From' },
            { key: 'to', label: 'To' },
            { key: 'confidence', label: 'Confidence', numeric: true,
              render: (r) => <span className="text-gold">{(r.confidence * 100).toFixed(0)}%</span> },
          ]}
        />
      </Card>
    </>
  ),

  'return-visit': (out) => {
    const cadenceArr = Object.entries(out.cadence_by_tier).map(([tier, v]) => ({
      tier, avg_days: v.avg_days, n: v.n,
    }));
    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label="Platinum Cadence" value={`${out.cadence_by_tier.Platinum?.avg_days || '--'}d`}
                   sub="Avg gap between visits" accent="gold" />
          <KpiCard label="Gold Cadence" value={`${out.cadence_by_tier.Gold?.avg_days || '--'}d`} accent="cream" />
          <KpiCard label="Silver Cadence" value={`${out.cadence_by_tier.Silver?.avg_days || '--'}d`} accent="cream" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card title="Visit cadence by tier">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cadenceArr}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tier" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avg_days" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Return visits due in next 7 days" className="lg:col-span-2">
            <DataTable
              rows={out.due_in_next_7_days}
              exportFilename="return-visit-due"
              columns={[
                { key: 'name', label: 'Guest', sortable: true },
                { key: 'home_store', label: 'Property', sortable: true },
                { key: 'tier', label: 'Tier', render: (r) => <TierPill tier={r.tier} /> },
                { key: 'days_since_last', label: 'Days since', numeric: true, sortable: true },
                { key: 'recommended_action', label: 'Action' },
              ]}
            />
          </Card>
        </div>
      </>
    );
  },
};
