import { useState } from 'react';
import { Play, RefreshCw, SlidersHorizontal, X } from 'lucide-react';

const STORES = [
  'Wrightsville Beach Resort',
  'Bald Head Island Club',
  'Cape Fear Inn',
  'Brunswick Harbor Hotel',
  'Kure Beach Grill',
  'Carolina Beach Tavern',
  'Southport Waterfront Lodge',
  'Holden Beach Pavilion',
  'Oak Island Pier House',
];

const TIER_OPTIONS = ['Silver', 'Gold', 'Platinum'];

const DATE_OPTIONS = [
  { value: '30d',  label: 'Last 30 days' },
  { value: '60d',  label: 'Last 60 days' },
  { value: '90d',  label: 'Last 90 days' },
  { value: '12mo', label: 'Last 12 months' },
  { value: 'all',  label: 'All time' },
];

const VISITS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '2',   label: '2+ visits' },
  { value: '5',   label: '5+ visits' },
  { value: '10',  label: '10+ visits' },
];

/**
 * Filter sidebar for model pages.
 *
 * Desktop: rendered inline as a fixed-width column on the left.
 * Mobile:  hidden behind a Filters button that toggles an inline panel.
 */
export function FilterSidebar({ filters, onChange, onRun, running = false, hasRun = false }) {
  const [openOnMobile, setOpenOnMobile] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenOnMobile((s) => !s)}
        data-tour-mobile-toggle="model-config"
        className="lg:hidden mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-md text-[13px]"
        style={{
          background: 'rgba(188,117,38,0.12)',
          border: '1px solid rgba(188,117,38,0.4)',
          color: '#BC7526',
        }}
        aria-expanded={openOnMobile}
        aria-controls="ilp-filter-panel"
      >
        <SlidersHorizontal size={14} />
        Filters
        {openOnMobile ? <X size={12} className="ml-1" /> : null}
      </button>

      <aside
        id="ilp-filter-panel"
        data-tour-id="model-config"
        className={`${openOnMobile ? 'block' : 'hidden'} lg:block lg:w-[260px] lg:flex-none`}
        style={{
          background: '#23211f',
          borderRight: '1px solid rgba(188,117,38,0.18)',
          borderRadius: 12,
        }}
      >
        <div className="p-5 space-y-6">
          <Group label="Property">
            <select
              value={filters.store}
              onChange={(e) => onChange({ ...filters, store: e.target.value })}
              className="input-on-dark"
              style={{ padding: '10px 12px', fontSize: 13 }}
            >
              <option value="all">All Properties</option>
              {STORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Group>

          <Group label="Loyalty Tier">
            <div className="space-y-1.5">
              {TIER_OPTIONS.map((t) => (
                <label key={t} className="flex items-center gap-2 text-cream text-[13px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tiers.includes(t)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? Array.from(new Set([...filters.tiers, t]))
                        : filters.tiers.filter((x) => x !== t);
                      onChange({ ...filters, tiers: next });
                    }}
                    style={{
                      width: 14, height: 14,
                      accentColor: '#BC7526',
                    }}
                  />
                  {t}
                </label>
              ))}
            </div>
          </Group>

          <Group label="Date Range">
            <select
              value={filters.dateRange}
              onChange={(e) => onChange({ ...filters, dateRange: e.target.value })}
              className="input-on-dark"
              style={{ padding: '10px 12px', fontSize: 13 }}
            >
              {DATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Group>

          <Group label="Min Visits">
            <select
              value={filters.minVisits}
              onChange={(e) => onChange({ ...filters, minVisits: e.target.value })}
              className="input-on-dark"
              style={{ padding: '10px 12px', fontSize: 13 }}
            >
              {VISITS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Group>

          <button
            type="button"
            onClick={onRun}
            disabled={running}
            className="btn-primary w-full disabled:opacity-60"
            style={{ padding: '12px 20px', fontSize: 13 }}
          >
            {running ? (
              <>
                <span
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid currentColor',
                    borderRightColor: 'transparent',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Running model...
              </>
            ) : (
              <>
                {hasRun ? <RefreshCw size={14} /> : <Play size={14} />}
                {hasRun ? 'Re-Run Model' : 'Run Model'}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

function Group({ label, children }) {
  return (
    <div>
      <div className="eyebrow mb-2" style={{ fontSize: 10 }}>{label}</div>
      {children}
    </div>
  );
}

export { STORES };
