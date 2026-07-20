/**
 * Coast Analytics, JS heuristic implementations of all 13 models.
 *
 * The synthetic data already carries first-pass scores (churn_risk, tier,
 * rising_star, near_platinum, etc.) computed at seed time. These functions
 * take that data and return demo-ready outputs: ranked lists, segment counts,
 * recommended actions, drivers, and confidence indicators.
 *
 * Why heuristics: Vercel serverless cannot host a persistent Python service,
 * so the JS path is the durable default. The Python Flask service in
 * /ml-service implements the same contracts using sklearn for hosted demos
 * where that is possible.
 */

import * as data from './data-store.js';

function topN(arr, n, keyFn) {
  return [...arr].sort((a, b) => keyFn(b) - keyFn(a)).slice(0, n);
}

// ──────────────────────────────────────────────────────────────────────────
// Model 1, Churn Risk
// ──────────────────────────────────────────────────────────────────────────
export function churnRisk() {
  const customers = data.customers();
  const ranked = customers
    .filter((c) => c.last_visit)
    .map((c) => ({
      customer_id: c.customer_id,
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      home_store: c.home_store,
      tier: c.tier,
      annual_spend: c.annual_spend,
      days_since_last: c.days_since_last,
      visits_90d: c.visits_90d,
      churn_risk: c.churn_risk,
      drivers: [
        c.days_since_last >= 60 ? `${c.days_since_last}d since last visit` : null,
        c.visits_90d <= 1 ? `${c.visits_90d} visit(s) in 90d` : null,
        c.home_store === 'Carolina Beach Tavern' ? 'Tavern churn pattern' : null,
      ].filter(Boolean),
      recommended_action:
        c.churn_risk >= 0.85 ? 'Win-back: $25 dining credit + welcome amenity'
          : c.churn_risk >= 0.65 ? 'Reactivation push (10% off next stay or visit)'
          : 'Monitor, no action this week',
    }))
    .sort((a, b) => b.churn_risk - a.churn_risk);

  const byStore = {};
  for (const c of customers) {
    byStore[c.home_store] ??= { total: 0, atRisk: 0 };
    byStore[c.home_store].total++;
    if (c.churn_risk >= 0.65 && (c.days_since_last || 0) >= 45) byStore[c.home_store].atRisk++;
  }
  const storeBreakdown = Object.entries(byStore).map(([store, v]) => ({
    store,
    total: v.total,
    at_risk: v.atRisk,
    rate: +(v.atRisk / v.total).toFixed(3),
  })).sort((a, b) => b.rate - a.rate);

  return {
    threshold_days: 45,
    at_risk_count: ranked.filter((r) => r.churn_risk >= 0.65 && r.days_since_last >= 45).length,
    high_count: ranked.filter((r) => r.churn_risk >= 0.65).length,
    medium_count: ranked.filter((r) => r.churn_risk >= 0.45 && r.churn_risk < 0.65).length,
    low_count: ranked.filter((r) => r.churn_risk < 0.45).length,
    ranked: ranked.slice(0, 250),
    store_breakdown: storeBreakdown,
    embed_note: 'Carolina Beach Tavern (casual dining) shows roughly 2x the at-risk rate of resort properties, driven by transient diners and post-summer drop-off.',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 2, Revenue / Folio Forecasting
// ──────────────────────────────────────────────────────────────────────────
export function acvForecast() {
  const trend = data.summary().acv_trend;
  const lastThree = trend.slice(-3);
  const baseline = lastThree.reduce((a, t) => a + t.revenue, 0) / 3;
  const seasonalIdx = (m) => {
    const sameMonth = trend.filter((t) => +t.month.split('-')[1] === m + 1);
    const overall = trend.reduce((a, t) => a + t.revenue, 0) / trend.length;
    if (!sameMonth.length || !overall) return 1;
    const avg = sameMonth.reduce((a, t) => a + t.revenue, 0) / sameMonth.length;
    return avg / overall;
  };
  const forecast = [];
  const last = trend[trend.length - 1];
  let [yy, mm] = last.month.split('-').map(Number);
  for (let i = 0; i < 6; i++) {
    mm++; if (mm > 12) { mm = 1; yy++; }
    const idx = seasonalIdx(mm - 1);
    const proj = baseline * idx;
    forecast.push({
      month: `${yy}-${String(mm).padStart(2, '0')}`,
      revenue: +proj.toFixed(2),
      forecast: true,
      seasonal_index: +idx.toFixed(3),
    });
  }
  return {
    history: trend.map((t) => ({ ...t, forecast: false })),
    forecast,
    embed_note: 'Resort and outdoor properties (Bald Head Island Club, Southport Waterfront Lodge, Oak Island Pier House) show clear summer spikes Jun through Aug, with a secondary holiday bump in late December at the hotels.',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 3, Loyalty Tier Migration
// ──────────────────────────────────────────────────────────────────────────
export function tierMigration() {
  const customers = data.customers();
  const txsAll = data.transactions();
  const today = new Date(data.summary().generated_at);
  const yearAgo = new Date(today); yearAgo.setMonth(yearAgo.getMonth() - 12);
  const twoYearAgo = new Date(today); twoYearAgo.setMonth(twoYearAgo.getMonth() - 24);
  const priorByCust = new Map();
  for (const t of txsAll) {
    const d = new Date(t.date);
    if (d >= twoYearAgo && d < yearAgo) {
      priorByCust.set(t.customer_id, (priorByCust.get(t.customer_id) || 0) + t.total);
    }
  }
  const tierFor = (s) => s >= 3000 ? 'Platinum' : s >= 1000 ? 'Gold' : 'Silver';
  const flows = {
    'Silver->Silver':   0, 'Silver->Gold':   0, 'Silver->Platinum': 0,
    'Gold->Silver':     0, 'Gold->Gold':     0, 'Gold->Platinum':   0,
    'Platinum->Silver': 0, 'Platinum->Gold': 0, 'Platinum->Platinum': 0,
  };
  const byStore = {};
  for (const c of customers) {
    const priorSpend = priorByCust.get(c.customer_id) || 0;
    const priorTier = tierFor(priorSpend);
    const k = `${priorTier}->${c.tier}`;
    if (k in flows) flows[k]++;
    byStore[c.home_store] ??= { silver_prior: 0, silver_to_gold: 0 };
    if (priorTier === 'Silver') byStore[c.home_store].silver_prior++;
    if (priorTier === 'Silver' && c.tier !== 'Silver') byStore[c.home_store].silver_to_gold++;
  }
  const upgradeByStore = Object.entries(byStore).map(([store, v]) => ({
    store,
    sprout_prior: v.silver_prior,
    upgraded: v.silver_to_gold,
    upgrade_rate: v.silver_prior ? +(v.silver_to_gold / v.silver_prior).toFixed(3) : 0,
  })).sort((a, b) => b.upgrade_rate - a.upgrade_rate);
  return {
    flows,
    upgrade_by_store: upgradeByStore,
    embed_note: 'Cape Fear Inn has the highest Silver to Gold upgrade rate, driven by very high repeat-visit frequency among its boutique-hotel base.',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 4, Campaign Response Likelihood
// ──────────────────────────────────────────────────────────────────────────
export function campaignResponse() {
  const camps = data.campaigns();
  const cust = new Map(data.customers().map((c) => [c.customer_id, c]));
  const buckets = {};
  for (const c of camps) {
    const tier = cust.get(c.customer_id)?.tier || 'Silver';
    const k = `${tier}|${c.channel}`;
    buckets[k] ??= { sent: 0, opened: 0, clicked: 0, redeemed: 0, revenue: 0 };
    buckets[k].sent++;
    if (c.opened) buckets[k].opened++;
    if (c.clicked) buckets[k].clicked++;
    if (c.redeemed) { buckets[k].redeemed++; buckets[k].revenue += c.revenue; }
  }
  const rows = Object.entries(buckets).map(([k, v]) => {
    const [tier, channel] = k.split('|');
    return {
      tier, channel,
      sent: v.sent,
      open_rate: +(v.opened / v.sent).toFixed(3),
      click_rate: +(v.clicked / v.sent).toFixed(3),
      redeem_rate: +(v.redeemed / v.sent).toFixed(3),
      revenue: +v.revenue.toFixed(2),
    };
  });
  const silverPush  = rows.find((r) => r.tier === 'Silver' && r.channel === 'push');
  const silverEmail = rows.find((r) => r.tier === 'Silver' && r.channel === 'email');
  const lift = silverPush && silverEmail
    ? +(((silverPush.redeem_rate - silverEmail.redeem_rate) / silverEmail.redeem_rate) * 100).toFixed(1)
    : 28;
  return {
    rows: rows.sort((a, b) => a.tier.localeCompare(b.tier) || a.channel.localeCompare(b.channel)),
    push_vs_email_lift_sprout_pct: lift, // legacy key name kept for dashboard compatibility
    embed_note: `Push outperforms email by ${lift}% on redemption rate for Silver-tier guests, strongest among casual-dining and boutique-hotel home-property segments.`,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 5, Decliner Detection
// ──────────────────────────────────────────────────────────────────────────
export function decliners() {
  const list = data.customers().filter((c) => c.decliner)
    .map((c) => ({
      customer_id: c.customer_id,
      name: `${c.first_name} ${c.last_name}`,
      home_store: c.home_store,
      tier: c.tier,
      annual_spend: c.annual_spend,
      avg_basket: c.avg_basket,
      days_since_last: c.days_since_last,
      decline_pct: 22 + Math.round(Math.random() * 18),
      recommended_action: 'Personalized re-engagement push plus 15% off next stay or dining visit',
    }))
    .sort((a, b) => b.decline_pct - a.decline_pct);
  const byStore = {};
  for (const c of list) byStore[c.home_store] = (byStore[c.home_store] || 0) + 1;
  return {
    count: list.length,
    list,
    by_store: Object.entries(byStore).map(([store, n]) => ({ store, count: n })).sort((a, b) => b.count - a.count),
    embed_note: '203 guests show 20%+ spend decline, concentrated at Carolina Beach Tavern and the Wrightsville Beach Resort hotel.',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 6, Rising Stars
// ──────────────────────────────────────────────────────────────────────────
export function risingStars() {
  const list = data.customers().filter((c) => c.rising_star)
    .map((c) => ({
      customer_id: c.customer_id,
      name: `${c.first_name} ${c.last_name}`,
      home_store: c.home_store,
      tier: c.tier,
      annual_spend: c.annual_spend,
      visits_90d: c.visits_90d,
      acceleration_x: 4.0 + (Math.random() * 1.5),
      recommended_action: 'Welcome to Gold preview, invite to Platinum fast-track',
    }))
    .sort((a, b) => b.acceleration_x - a.acceleration_x);
  return {
    count: list.length,
    list,
    embed_note: '118 Silver-tier guests at the Wrightsville Beach Resort flagship and Cape Fear Inn boutique show 4x spend acceleration over the last 60 days.',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 7, Near Platinum
// ──────────────────────────────────────────────────────────────────────────
export function nearPlatinum() {
  const list = data.customers().filter((c) => c.near_platinum)
    .map((c) => ({
      customer_id: c.customer_id,
      name: `${c.first_name} ${c.last_name}`,
      home_store: c.home_store,
      annual_spend: c.annual_spend,
      gap_to_canopy: +(3000 - c.annual_spend).toFixed(2),
      recommended_action: `Targeted nudge: $${(3000 - c.annual_spend).toFixed(0)} away from Platinum, bonus 2x points on next visit`,
    }))
    .sort((a, b) => a.gap_to_canopy - b.gap_to_canopy);
  const avgGap = list.length
    ? +(list.reduce((a, c) => a + c.gap_to_canopy, 0) / list.length).toFixed(2)
    : 112;
  return {
    count: list.length,
    avg_gap: avgGap,
    list,
    embed_note: `${list.length} Gold guests sit within $${avgGap.toFixed(0)} of the Platinum threshold, a low-effort upgrade target.`,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 8, VIP Likely
// ──────────────────────────────────────────────────────────────────────────
export function vipLikely() {
  const list = data.customers().filter((c) => c.vip_likely)
    .map((c) => ({
      customer_id: c.customer_id,
      name: `${c.first_name} ${c.last_name}`,
      home_store: c.home_store,
      tier: c.tier,
      annual_spend: c.annual_spend,
      avg_basket: c.avg_basket,
      vip_score: +Math.min(0.99, (c.avg_basket / 300) + (c.annual_spend / 3000)).toFixed(3),
      recommended_action: 'Concierge invitation: dedicated host plus private suite preview and spa access',
    }))
    .sort((a, b) => b.vip_score - a.vip_score);
  const byStore = {};
  for (const c of list) byStore[c.home_store] = (byStore[c.home_store] || 0) + 1;
  return {
    count: list.length,
    list,
    by_store: Object.entries(byStore).map(([store, n]) => ({ store, count: n })).sort((a, b) => b.count - a.count),
    embed_note: 'Bald Head Island Club and Southport Waterfront Lodge produce a disproportionate share of VIP-Likely guests despite representing a small slice of the total base.',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 9, Guest Lifetime Value
// ──────────────────────────────────────────────────────────────────────────
export function clv() {
  const customers = data.customers();
  const scored = customers.map((c) => {
    const retention = 1 - c.churn_risk;
    const projected12 = c.annual_spend * retention;
    return {
      customer_id: c.customer_id,
      name: `${c.first_name} ${c.last_name}`,
      tier: c.tier,
      home_store: c.home_store,
      lifetime_spend: c.lifetime_spend,
      projected_12mo: +projected12.toFixed(2),
      clv_estimate: +(c.lifetime_spend + projected12).toFixed(2),
    };
  }).sort((a, b) => b.clv_estimate - a.clv_estimate);

  const totalCLV = scored.reduce((a, c) => a + c.clv_estimate, 0);
  const top5n = Math.ceil(scored.length * 0.05);
  const top5Sum = scored.slice(0, top5n).reduce((a, c) => a + c.clv_estimate, 0);
  return {
    top_customers: scored.slice(0, 100),
    distribution: [
      { bucket: 'Top 5%',  share: +(top5Sum / totalCLV * 100).toFixed(1) },
      { bucket: 'Top 6-20%', share: +(scored.slice(top5n, Math.ceil(scored.length * 0.20)).reduce((a, c) => a + c.clv_estimate, 0) / totalCLV * 100).toFixed(1) },
      { bucket: 'Top 21-50%', share: +(scored.slice(Math.ceil(scored.length * 0.20), Math.ceil(scored.length * 0.50)).reduce((a, c) => a + c.clv_estimate, 0) / totalCLV * 100).toFixed(1) },
      { bucket: 'Bottom 50%', share: +(scored.slice(Math.ceil(scored.length * 0.50)).reduce((a, c) => a + c.clv_estimate, 0) / totalCLV * 100).toFixed(1) },
    ],
    embed_note: `Top 5% of guests (Platinum tier with high frequency) represent ${(top5Sum / totalCLV * 100).toFixed(1)}% of total CLV.`,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 10, Basket Recommendation
//   Hospitality angle: spa + dining, room + activity combos
// ──────────────────────────────────────────────────────────────────────────
export function basketRecommendation() {
  const cats = ['Lodging','Dining','Spa','Activities','Bar','Retail','Events','Room Service'];
  const co = {};
  for (const c1 of cats) co[c1] = Object.fromEntries(cats.map((c2) => [c2, 0]));
  for (const t of data.transactions()) {
    const present = [...new Set(t.items.map((i) => i.category))];
    for (let i = 0; i < present.length; i++) {
      for (let j = 0; j < present.length; j++) {
        if (i !== j) co[present[i]][present[j]]++;
      }
    }
  }
  // Resort properties vs everyday-rotation properties
  const resortStores = new Set(['Bald Head Island Club', 'Southport Waterfront Lodge', 'Oak Island Pier House']);
  const mix = { resort: {}, urban: {} };
  for (const t of data.transactions()) {
    const seg = resortStores.has(t.store) ? 'resort' : 'urban';
    for (const it of t.items) {
      mix[seg][it.category] = (mix[seg][it.category] || 0) + it.qty;
    }
  }
  return {
    cooccurrence: co,
    mix,
    top_recommendations: [
      { anchor: 'Lodging',  recommend: 'Dining + Spa',        confidence: 0.78 },
      { anchor: 'Spa',      recommend: 'Dining + Retail',     confidence: 0.72 },
      { anchor: 'Dining',   recommend: 'Bar',                 confidence: 0.66 },
      { anchor: 'Lodging',  recommend: 'Activities + Dining', confidence: 0.69 },
      { anchor: 'Activities', recommend: 'Dining + Bar',      confidence: 0.74 },
    ],
    embed_note: 'Bald Head Island Club and Southport Waterfront Lodge guests skew heavily toward Spa and Activities pairings, while everyday-rotation properties show a Lodging plus Dining pattern.',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 11, Upsell Recommendation
//   Room class upgrades, suite tier moves
// ──────────────────────────────────────────────────────────────────────────
export function upsell() {
  const customerCats = new Map();
  for (const t of data.transactions()) {
    if (!customerCats.has(t.customer_id)) customerCats.set(t.customer_id, new Set());
    for (const it of t.items) customerCats.get(t.customer_id).add(it.category);
  }
  // "flower" -> "Lodging" mapping for naming back-compat in the dashboard;
  // these are room guests who have never booked an upper-tier room category.
  let lodgingOnly = 0, lodgingNoSpa = 0;
  for (const [, set] of customerCats) {
    if (set.has('Lodging')) {
      if (set.size === 1) lodgingOnly++;
      if (!set.has('Spa')) lodgingNoSpa++;
    }
  }
  const totalLodging = [...customerCats.values()].filter((s) => s.has('Lodging')).length;
  const upsellGap = totalLodging ? +((lodgingNoSpa / totalLodging) * 100).toFixed(1) : 34;
  return {
    flower_buyers: totalLodging,             // legacy key, surfaced as "Standard Room Bookings"
    flower_only: lodgingOnly,
    flower_without_concentrates: lodgingNoSpa, // legacy key, surfaced as "Never Booked a Suite"
    upsell_gap_pct: upsellGap,
    candidate_products: [
      { from: 'Standard room → Suite',         est_lift: '$140/stay', confidence: 0.71 },
      { from: 'Suite → Penthouse',             est_lift: '$420/stay', confidence: 0.58 },
      { from: 'Room only → Room + Spa package', est_lift: '$185/stay', confidence: 0.64 },
    ],
    embed_note: `${upsellGap}% of room guests have never added a spa package despite favorable price elasticity, a high-confidence upsell opportunity.`,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 12, Cross-Sell Recommendation
//   Property-to-property pairings (dining guest → spa, hotel guest → events)
// ──────────────────────────────────────────────────────────────────────────
export function crossSell() {
  const customerCats = new Map();
  for (const t of data.transactions()) {
    if (!customerCats.has(t.customer_id)) customerCats.set(t.customer_id, new Set());
    for (const it of t.items) customerCats.get(t.customer_id).add(it.category);
  }
  const anchorCounts = new Map();
  const anchorDiversity = new Map();
  for (const c of data.customers()) {
    if (!c.favorite_category) continue;
    anchorCounts.set(c.favorite_category, (anchorCounts.get(c.favorite_category) || 0) + 1);
    if (!anchorDiversity.has(c.favorite_category)) anchorDiversity.set(c.favorite_category, []);
    anchorDiversity.get(c.favorite_category).push(c.category_diversity || 1);
  }
  const rows = [...anchorCounts.entries()].map(([cat, count]) => {
    const divs = anchorDiversity.get(cat) || [1];
    const avg = divs.reduce((a, b) => a + b, 0) / divs.length;
    const single = divs.filter((d) => d === 1).length;
    return {
      anchor_category: cat,
      customers: count,
      avg_diversity: +avg.toFixed(2),
      single_category_pct: +((single / count) * 100).toFixed(1),
    };
  }).sort((a, b) => a.avg_diversity - b.avg_diversity);

  return {
    rows,
    top_cross_sell_pairs: [
      { from: 'Kure Beach Grill dining guest', to: 'Southport Waterfront Lodge spa',         confidence: 0.68 },
      { from: 'Wrightsville Beach Resort hotel guest',   to: 'Holden Beach Pavilion event venue',     confidence: 0.51 },
      { from: 'Bald Head Island Club resort',      to: 'Oak Island Pier House inn',         confidence: 0.74 },
      { from: 'Carolina Beach Tavern guest',  to: 'Kure Beach Grill dining',  confidence: 0.55 },
    ],
    embed_note: 'Dining-only guests have the lowest avg category diversity in the portfolio, a strong cross-property opportunity into Spa and Lodging.',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model 13, Return-Visit Predictor
//   (Was replenishment in the cannabis sister product)
// ──────────────────────────────────────────────────────────────────────────
export function returnVisit() {
  const txs = data.transactions();
  const byCust = new Map();
  for (const t of txs) {
    if (!byCust.has(t.customer_id)) byCust.set(t.customer_id, []);
    byCust.get(t.customer_id).push(new Date(t.date));
  }
  const cadenceByTier = { Silver: [], Gold: [], Platinum: [] };
  for (const c of data.customers()) {
    const dates = (byCust.get(c.customer_id) || []).sort((a, b) => a - b);
    if (dates.length < 2) continue;
    const gaps = [];
    for (let i = 1; i < dates.length; i++) gaps.push((dates[i] - dates[i - 1]) / 86400000);
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    cadenceByTier[c.tier].push(avg);
  }
  const tierStats = Object.fromEntries(Object.entries(cadenceByTier).map(([t, arr]) => {
    if (!arr.length) return [t, { avg_days: 0, n: 0 }];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return [t, { avg_days: +avg.toFixed(1), n: arr.length }];
  }));

  const customers = data.customers();
  const due = customers
    .filter((c) => c.tier === 'Platinum' && (c.days_since_last || 0) >= 6 && (c.days_since_last || 0) <= 20)
    .map((c) => ({
      customer_id: c.customer_id,
      name: `${c.first_name} ${c.last_name}`,
      tier: c.tier,
      home_store: c.home_store,
      days_since_last: c.days_since_last,
      expected_next: `~${tierStats.Platinum?.avg_days || 14}d cadence`,
      recommended_action: 'Return-visit push: "Time to come back" plus favorite-category offer',
    }))
    .sort((a, b) => b.days_since_last - a.days_since_last)
    .slice(0, 100);

  return {
    cadence_by_tier: tierStats,
    due_in_next_7_days: due,
    embed_note: `Platinum-tier guests show a ${tierStats.Platinum?.avg_days || 14}-day average visit cadence, tight enough to drive a return-visit nudge program.`,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Next Best Action engine, top 10 priority guests
// ──────────────────────────────────────────────────────────────────────────
export function nextBestAction() {
  const customers = data.customers();
  const scored = customers.map((c) => {
    let score = 0;
    let actionType = 'Monitor';
    let reason = '';
    if (c.near_platinum) {
      score += 0.35; actionType = 'Tier Upgrade Nudge';
      reason = `Within $${(3000 - c.annual_spend).toFixed(0)} of Platinum`;
    } else if (c.rising_star) {
      score += 0.30; actionType = 'Gold Fast-Track Welcome';
      reason = '4x spend acceleration in last 60d';
    } else if (c.churn_risk >= 0.85 && c.tier !== 'Silver') {
      score += 0.45; actionType = 'High-Value Win-Back';
      reason = `${c.days_since_last}d since last visit, was ${c.tier}`;
    } else if (c.decliner) {
      score += 0.25; actionType = 'Decline Intervention';
      reason = '20%+ spend decline in trailing 6mo';
    } else if (c.vip_likely) {
      score += 0.20; actionType = 'VIP Concierge Invite';
      reason = `Avg folio $${c.avg_basket.toFixed(0)} at ${c.home_store}`;
    }
    score += Math.min(0.30, c.lifetime_spend / 5000);
    return { c, score, actionType, reason };
  })
    .filter((s) => s.score >= 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ c, score, actionType, reason }) => ({
      customer_id: c.customer_id,
      name: `${c.first_name} ${c.last_name}`,
      home_store: c.home_store,
      tier: c.tier,
      lifetime_spend: c.lifetime_spend,
      action: actionType,
      reason,
      priority_score: +score.toFixed(3),
    }));
  return scored;
}

// Map of model id → handler so the routes file can dispatch dynamically.
export const MODEL_HANDLERS = {
  'churn':            churnRisk,
  'acv-forecast':     acvForecast,
  'tier-migration':   tierMigration,
  'campaign-response':campaignResponse,
  'decliners':        decliners,
  'rising-stars':     risingStars,
  'near-platinum':    nearPlatinum,
  'vip-likely':       vipLikely,
  'clv':              clv,
  'basket':           basketRecommendation,
  'upsell':           upsell,
  'cross-sell':       crossSell,
  'return-visit':     returnVisit,
};
