import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, LogOut } from 'lucide-react';
import { Logo } from '../components/Logo.jsx';
import { Footer } from '../components/Footer.jsx';
import { api } from '../lib/api.js';
import { fmtNum, fmtDate } from '../lib/format.js';
import { useToast } from '../components/Toast.jsx';
import { useSEO } from '../lib/useSEO.js';

const SESSION_KEY = 'ilp_admin_password';

export default function AdminPage() {
  useSEO({ title: 'Admin | Coast Analytics', description: 'Lead viewer.' });
  const [password, setPassword] = useState(sessionStorage.getItem(SESSION_KEY) || '');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const authenticate = async (e) => {
    e?.preventDefault();
    setErr(null); setBusy(true);
    try {
      const out = await api.adminLeads(password);
      sessionStorage.setItem(SESSION_KEY, password);
      setData(out);
    } catch (e2) {
      setErr(e2.message);
      toast.push(e2.message || 'Login failed.', 'error');
    } finally { setBusy(false); }
  };

  const exportCSV = () => {
    const url = `/api/admin/leads.csv?password=${encodeURIComponent(password)}`;
    const a = document.createElement('a');
    a.href = url; a.download = `ilp-leads-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setData(null); setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="sticky top-0 z-30" style={{ background: '#E9DDD5', borderBottom: '1px solid rgba(58,54,53,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/"><Logo tone="on-light" /></Link>
          <span className="text-[10px] px-2.5 py-1 rounded-md bg-dark text-gold font-bold uppercase tracking-[0.12em]">
            Admin
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {!data ? (
          <div className="max-w-md mx-auto mt-16">
            <div className="eyebrow eyebrow-dark mb-3">Admin</div>
            <h1 className="h2-section text-on-light mb-3">Sign in.</h1>
            <p className="text-on-light-muted text-[16px] mb-6">
              Enter the admin password to view lead submissions.
            </p>
            <form onSubmit={authenticate} className="space-y-4">
              <div>
                <label className="field-label field-label-dark">Admin Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  className="input-on-light"
                />
              </div>
              <button disabled={busy || !password} className="btn-primary w-full disabled:opacity-60">
                {busy ? 'Authenticating...' : 'Sign In'}
              </button>
              {err && <div className="text-[15px]" style={{ color: '#a83232' }}>{err}</div>}
            </form>
          </div>
        ) : (
          <AdminDashboard data={data} onLogout={logout} onExport={exportCSV} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function AdminDashboard({ data, onLogout, onExport }) {
  return (
    <div>
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="eyebrow eyebrow-dark mb-2">Lead Inbox</div>
          <h1 className="h2-section text-on-light">All submissions, newest first.</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onExport} className="btn-primary">
            <Download size={16} />
            Export CSV
          </button>
          <button onClick={onLogout} className="btn-outline" style={{ borderColor: '#99C0BF', color: '#99C0BF' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Demo Gate" value={fmtNum(data.gate_count || 0)}
             sub={`${fmtNum(data.gate_ok_count || 0)} synced, ${fmtNum(data.gate_error_count || 0)} fallback`} />
        <Kpi label="Contact Form" value={fmtNum(data.contact_count)} />
        <Kpi label="Legacy Leads" value={fmtNum(data.lead_count)}
             sub="Old floating widget (deprecated)" />
        <Kpi label="Last 24h"
             value={fmtNum((data.gate_leads || []).filter((l) => (Date.now() - new Date(l.created_at + 'Z')) < 86400000).length)} />
      </div>

      <Section
        title="Demo Gate Submissions (Klaviyo + Fallback)"
        subtitle="Every visitor who entered the demo. 'synced' rows are in Klaviyo list VvYAe4. 'fallback' rows failed to reach Klaviyo and are kept here so no lead is lost."
      >
        <Table
          rows={data.gate_leads || []}
          columns={[
            ['created_at', 'When', (r) => fmtDate(r.created_at)],
            ['first_name', 'First Name'],
            ['email', 'Email'],
            ['company_name', 'Company'],
            ['klaviyo_status', 'Klaviyo', (r) => <KlaviyoBadge status={r.klaviyo_status} />],
            ['klaviyo_error', 'Error', (r) => r.klaviyo_error
              ? <span className="line-clamp-2 max-w-sm inline-block text-[13px]" style={{ color: '#a83232' }}>{r.klaviyo_error}</span>
              : <span className="text-on-light-muted">--</span>],
          ]}
          empty="No gate submissions yet."
        />
      </Section>

      <Section title="Contact Form (About Page)">
        <Table
          rows={data.contacts}
          columns={[
            ['created_at', 'When', (r) => fmtDate(r.created_at)],
            ['name', 'Name'],
            ['email', 'Email'],
            ['company_name', 'Company'],
            ['phone', 'Phone'],
            ['message', 'Message', (r) => <span className="line-clamp-2 max-w-md inline-block">{r.message}</span>],
          ]}
          empty="No contact submissions yet."
        />
      </Section>

      {data.leads.length > 0 && (
        <Section title="Legacy Lead Capture (Pre-Gate Floating Widget)">
          <Table
            rows={data.leads}
            columns={[
              ['created_at', 'When', (r) => fmtDate(r.created_at)],
              ['first_name', 'Name', (r) => `${r.first_name} ${r.last_name}`],
              ['email', 'Email'],
              ['company_name', 'Company'],
              ['phone', 'Phone'],
              ['num_properties', '# Properties'],
              ['referral_source', 'Source'],
              ['page_viewed', 'Page'],
            ]}
            empty="No legacy leads."
          />
        </Section>
      )}
    </div>
  );
}

function KlaviyoBadge({ status }) {
  // 'synced' = current; 'ok' = legacy single-call value, still counted as success.
  const ok = status === 'synced' || status === 'ok';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-[0.08em]"
      style={{
        background: ok ? 'rgba(46,204,113,0.12)' : 'rgba(168,50,50,0.14)',
        color: ok ? '#27AE60' : '#a83232',
        border: `1px solid ${ok ? 'rgba(39,174,96,0.5)' : 'rgba(168,50,50,0.5)'}`,
      }}
    >
      {ok ? 'Synced' : 'Fallback'}
    </span>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div className="card-light !p-5">
      <div className="eyebrow eyebrow-dark">{label}</div>
      <div className="mt-2 text-[32px] font-bold tracking-tight text-on-light">{value}</div>
      {sub && <div className="mt-1 text-on-light-muted text-[12px] leading-tight">{sub}</div>}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="mt-10">
      <h2 className="text-[22px] font-bold tracking-tight mb-1 text-on-light">{title}</h2>
      {subtitle && <p className="text-on-light-muted text-[14px] mb-4 max-w-3xl leading-[1.6]">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

function Table({ rows, columns, empty }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-olive/20 bg-white shadow-card-light">
      <table className="w-full text-[15px]">
        <thead style={{ background: '#3a3635', color: '#BC7526' }}>
          <tr>
            {columns.map(([k, label]) => (
              <th key={k} className="px-4 py-3 text-left font-bold uppercase text-[12px] tracking-[0.08em]">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-on-light-muted">{empty}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-cream'}>
              {columns.map(([k, _label, render]) => (
                <td key={k} className="px-4 py-3 text-on-light">
                  {render ? render(r) : (r[k] ?? <span className="text-on-light-muted">--</span>)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
