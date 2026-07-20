import { useEffect, useState } from 'react';
import { Upload, Check } from 'lucide-react';
import { api } from '../lib/api.js';
import { fmtNum } from '../lib/format.js';
import { Card, EmbedNote } from './components/Card.jsx';
import { KpiCard } from './components/KpiCard.jsx';
import { Loading, ErrorState } from './components/Loading.jsx';
import { PageHeader } from './components/PageHeader.jsx';
import { useToast } from '../components/Toast.jsx';

/**
 * Column mapper across common hospitality stacks. The "our" column is the
 * field name Coast Analytics stores internally; the others are the
 * common source-system equivalents the column mapper normalizes from.
 */
const FIELD_MAP = [
  { our: 'customer_id',     pms: 'guest_id',           pos: 'check_guest_uuid',  loyalty: 'member_id' },
  { our: 'first_name',      pms: 'first_name',         pos: 'first',             loyalty: 'first_name' },
  { our: 'last_name',       pms: 'last_name',          pos: 'last',              loyalty: 'last_name' },
  { our: 'email',           pms: 'email_address',      pos: 'email',             loyalty: 'email' },
  { our: 'phone',           pms: 'mobile_phone',       pos: 'phone',             loyalty: 'phone' },
  { our: 'home_store',      pms: 'preferred_property', pos: 'primary_outlet',    loyalty: 'home_property' },
  { our: 'opt_in_email',    pms: 'email_subscribed',   pos: 'email_consent',     loyalty: 'email_optin' },
  { our: 'opt_in_sms',      pms: 'sms_subscribed',     pos: 'sms_consent',       loyalty: 'sms_optin' },
  { our: 'opt_in_push',     pms: 'push_subscribed',    pos: '--',                loyalty: 'push_optin' },
  { our: 'tier',            pms: '--',                 pos: '--',                loyalty: 'tier_name' },
];

export default function DataManager() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api.summary().then(setSummary).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorState message={err} />;
  if (!summary) return <Loading />;
  const onUpload = () => toast.push('Demo upload. File not actually processed.', 'info');
  return (
    <div>
      <PageHeader
        category="Data"
        title="Data Manager"
        description="Upload PMS, POS, and loyalty exports, map fields, and inspect data health. The demo dataset is pre-loaded, uploads are stubbed in this environment."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Guests" value={fmtNum(summary.totals.customers)} accent="cream" />
        <KpiCard label="Folios" value={fmtNum(summary.totals.transactions)} accent="cream" />
        <KpiCard label="Campaigns" value={fmtNum(summary.totals.campaigns)} accent="cream" />
        <KpiCard label="Data Health" value="Clean" sub="No nulls in required fields" accent="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {[
          { label: 'Guests', count: summary.totals.customers, source: 'PMS / loyalty export' },
          { label: 'Folios', count: summary.totals.transactions, source: 'POS / PMS folio export' },
          { label: 'Campaigns', count: summary.totals.campaigns, source: 'CRM campaign log' },
        ].map((z) => (
          <Card key={z.label} title={z.label}>
            <div
              className="rounded-md p-6 text-center transition-colors"
              style={{
                border: '2px dashed rgba(194,124,42,0.35)',
                background: 'rgba(194,124,42,0.05)',
              }}
            >
              <Upload className="mx-auto mb-3 text-gold" size={32} />
              <div className="text-cream text-[15px]">Drop {z.label.toLowerCase()} CSV here</div>
              <div className="text-cream/60 text-[12px] mt-1">{z.source}</div>
              <button onClick={onUpload} className="btn-outline mt-3 !px-4 !py-2 !text-[12px]">
                Upload
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <span className="text-cream/60">{fmtNum(z.count)} rows currently loaded</span>
              <span className="inline-flex items-center gap-1.5 text-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-gold"/> Synced
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Column mapper" subtitle="PMS, POS, and loyalty field name translations" className="mb-6">
        <div className="overflow-x-auto rounded-md" style={{ border: '1px solid rgba(194,124,42,0.25)' }}>
          <table className="w-full text-[14px]">
            <thead style={{ background: '#3a3635', color: '#BC7526' }}>
              <tr>
                <th className="px-4 py-3 text-left uppercase text-[12px] tracking-[0.08em]">Coast Analytics field</th>
                <th className="px-4 py-3 text-left uppercase text-[12px] tracking-[0.08em]">PMS field</th>
                <th className="px-4 py-3 text-left uppercase text-[12px] tracking-[0.08em]">POS field</th>
                <th className="px-4 py-3 text-left uppercase text-[12px] tracking-[0.08em]">Loyalty field</th>
                <th className="px-4 py-3 text-left uppercase text-[12px] tracking-[0.08em]">Status</th>
              </tr>
            </thead>
            <tbody>
              {FIELD_MAP.map((f, i) => (
                <tr key={f.our} style={{ background: i % 2 === 0 ? '#3a3635' : '#6c8585', color: '#E9DDD5' }}>
                  <td className="px-4 py-2.5 font-mono text-gold">{f.our}</td>
                  <td className="px-4 py-2.5 text-cream/70 font-mono">{f.pms}</td>
                  <td className="px-4 py-2.5 text-cream/70 font-mono">{f.pos}</td>
                  <td className="px-4 py-2.5 text-cream/70 font-mono">{f.loyalty}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-gold">
                      <Check size={14} />
                      Mapped
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Data Health" subtitle="Field-level completeness for the loaded demo data">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[14px]">
          {[
            ['customer_id', 100], ['email', 100], ['home_store', 100], ['tier', 100],
            ['phone', 92], ['acquired_at', 100], ['loyalty_enrolled', 100], ['opt_in_email', 100],
          ].map(([f, p]) => (
            <div key={f} className="px-4 py-3 rounded-md"
                 style={{ border: '1px solid rgba(194,124,42,0.25)', background: 'rgba(194,124,42,0.05)' }}>
              <div className="font-mono text-gold text-[12px] mb-1">{f}</div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(245,240,232,0.15)' }}>
                  <div className="h-full bg-gold" style={{ width: `${p}%` }} />
                </div>
                <span className="text-[12px] tabular-nums text-cream/80">{p}%</span>
              </div>
            </div>
          ))}
        </div>
        <EmbedNote>
          Demo data is clean by construction. In production, the Data Manager surfaces sync warnings when the
          PMS, POS, and loyalty platform diverge by more than 1% on shared identifiers.
        </EmbedNote>
      </Card>
    </div>
  );
}
