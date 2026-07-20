import { useMemo, useState } from 'react';
import { Download, ChevronUp, ChevronDown } from 'lucide-react';
import { fmt$, fmtNum, fmtPct, fmtPctRaw } from '../../lib/format.js';

export function DataTable({ rows, columns, exportFilename, pageSize = 25, search = true }) {
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = r[c.key];
        return v != null && String(v).toLowerCase().includes(needle);
      }),
    );
  }, [rows, q, columns]);

  const sorted = useMemo(() => {
    if (!sortBy) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = a[sortBy], vb = b[sortBy];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filtered, sortBy, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const view = sorted.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const cols = columns.map((c) => c.key);
    const header = columns.map((c) => `"${c.label}"`).join(',');
    const lines = sorted.map((r) =>
      cols.map((k) => {
        let v = r[k];
        if (v == null) return '';
        v = String(v);
        if (v.includes(',') || v.includes('"') || v.includes('\n')) v = `"${v.replace(/"/g, '""')}"`;
        return v;
      }).join(','),
    );
    const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${exportFilename || 'export'}-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {search && (
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search..."
            className="input-on-dark sm:max-w-xs"
            style={{ padding: '10px 14px', fontSize: 14 }}
          />
        )}
        <div className="flex items-center gap-3">
          <span className="text-cream/60 text-[13px]">{fmtNum(sorted.length)} rows</span>
          <button onClick={exportCSV} className="btn-primary !px-4 !py-2 !text-[12px]">
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md" style={{ border: '1px solid rgba(194,124,42,0.2)' }}>
        <table className="w-full text-[14px]">
          <thead style={{ background: '#3a3635', color: '#BC7526' }}>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => {
                    if (!c.sortable) return;
                    if (sortBy === c.key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    else { setSortBy(c.key); setSortDir(c.numeric ? 'desc' : 'asc'); }
                  }}
                  className={`text-left font-bold px-4 py-3 whitespace-nowrap uppercase tracking-[0.08em] text-[12px]
                              ${c.sortable ? 'cursor-pointer hover:text-cream' : ''}
                              ${c.numeric ? 'text-right' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.sortable && sortBy === c.key && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-cream/50">No rows.</td></tr>
            ) : view.map((r, i) => (
              <tr key={r.customer_id || r.id || i}
                  style={{ background: i % 2 === 0 ? '#3a3635' : '#6c8585', color: '#E9DDD5' }}>
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-2.5 ${c.numeric ? 'text-right tabular-nums' : ''}`}>
                    {c.render ? c.render(r) : renderCell(r[c.key], c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-[13px] text-cream/60">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:text-gold"
                  style={{ border: '1px solid rgba(194,124,42,0.3)' }}>
            Prev
          </button>
          <span>Page {page} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                  className="px-3 py-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:text-gold"
                  style={{ border: '1px solid rgba(194,124,42,0.3)' }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function renderCell(v, col) {
  if (v == null) return <span className="text-cream/40">--</span>;
  if (col.format === 'currency') return fmt$(v);
  if (col.format === 'pct') return fmtPct(v);
  if (col.format === 'pctRaw') return fmtPctRaw(v);
  if (col.format === 'num') return fmtNum(v);
  if (typeof v === 'boolean') return v
    ? <span className="text-gold">✓</span>
    : <span className="text-cream/40">--</span>;
  return v;
}
