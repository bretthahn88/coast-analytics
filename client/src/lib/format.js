export const fmt$ = (n) =>
  (n == null || isNaN(n)) ? '--' : `$${(+n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmt$0 = (n) =>
  (n == null || isNaN(n)) ? '--' : `$${Math.round(+n).toLocaleString()}`;
export const fmtPct = (n, digits = 1) =>
  (n == null || isNaN(n)) ? '--' : `${(+n * 100).toFixed(digits)}%`;
export const fmtPctRaw = (n, digits = 1) =>
  (n == null || isNaN(n)) ? '--' : `${(+n).toFixed(digits)}%`;
export const fmtNum = (n) =>
  (n == null || isNaN(n)) ? '--' : (+n).toLocaleString();
export const fmtDate = (d) => {
  if (!d) return '--';
  try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return String(d); }
};
