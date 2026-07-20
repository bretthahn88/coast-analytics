/**
 * Client-side filter applied to a model output before the renderer draws.
 * Aggregate-only outputs (basket co-occurrence, tier flow matrix, cadence
 * by tier) silently no-op since they do not carry per-row property/tier
 * fields.
 *
 * Filter shape:
 *   {
 *     store:      'all' | <property name>,
 *     tiers:      Array<'Silver'|'Gold'|'Platinum'>  (empty = no tier filter),
 *     dateRange:  '30d' | '60d' | '90d' | '12mo' | 'all',
 *     minVisits:  'any' | '2' | '5' | '10',
 *   }
 */
const ROW_KEYS = ['ranked', 'list', 'top_customers', 'due_in_next_7_days'];

const DATE_RANGE_DAYS = {
  '30d': 30,
  '60d': 60,
  '90d': 90,
  '12mo': 365,
  'all': Infinity,
};

const MIN_VISITS_NUM = {
  'any': 0,
  '2': 2,
  '5': 5,
  '10': 10,
};

export function applyFilters(out, filters) {
  if (!out || typeof out !== 'object') return out;
  const matches = makeRowPredicate(filters);
  const next = { ...out };
  for (const key of ROW_KEYS) {
    if (Array.isArray(out[key])) next[key] = out[key].filter(matches);
  }
  return next;
}

function makeRowPredicate({ store, tiers, dateRange, minVisits }) {
  const maxDays = DATE_RANGE_DAYS[dateRange] ?? Infinity;
  const minV    = MIN_VISITS_NUM[minVisits] ?? 0;

  return (row) => {
    if (!row || typeof row !== 'object') return true;

    if (store && store !== 'all') {
      // Only filter rows that actually carry a store identifier
      if (row.home_store != null && row.home_store !== store) return false;
    }

    if (tiers && tiers.length > 0 && tiers.length < 3) {
      // Only filter rows that actually carry a tier
      if (row.tier != null && !tiers.includes(row.tier)) return false;
    }

    if (maxDays !== Infinity && row.days_since_last != null) {
      if (row.days_since_last > maxDays) return false;
    }

    if (minV > 0 && row.visits_90d != null) {
      if (row.visits_90d < minV) return false;
    }

    return true;
  };
}

/**
 * Pick the most relevant row count from a filtered output, for the
 * "Showing N customers" badge. Returns `null` when the output has no
 * row-style array (basket co-occurrence, tier-migration flows, etc.).
 */
export function rowCount(out) {
  if (!out) return null;
  for (const key of ROW_KEYS) {
    if (Array.isArray(out[key])) return out[key].length;
  }
  return null;
}

/** Stringify the active filters for the result-count badge. */
export function filtersToLabel(filters) {
  const parts = [];
  parts.push(filters.store === 'all' ? 'All properties' : filters.store);
  if (filters.tiers && filters.tiers.length > 0 && filters.tiers.length < 3) {
    parts.push(filters.tiers.join(', '));
  } else {
    parts.push('All tiers');
  }
  parts.push({
    '30d': 'Last 30 days',
    '60d': 'Last 60 days',
    '90d': 'Last 90 days',
    '12mo': 'Last 12 months',
    'all': 'All time',
  }[filters.dateRange] || 'All time');
  if (filters.minVisits && filters.minVisits !== 'any') {
    parts.push(`${filters.minVisits}+ visits`);
  }
  return parts.join(' · ');
}

export const DEFAULT_FILTERS = Object.freeze({
  store: 'all',
  tiers: ['Silver', 'Gold', 'Platinum'],
  dateRange: '90d',
  minVisits: 'any',
});
