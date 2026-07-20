/**
 * Cape Fear Hospitality Group, synthetic data generator
 *
 * A fictional 9-property coastal North Carolina hospitality operator. Generates
 * 2,400 guests, ~36,000 folios over 24 months, and 9,600 campaign records
 * with the eight embedded story arcs:
 *
 *   1. Carolina Beach Tavern churn (2x avg, casual restaurant)
 *   2. Resort seasonal spikes at Bald Head Island Club and Southport Waterfront Lodge (summer peak)
 *   3. Rising Stars (118 Wrightsville Beach Resort + Cape Fear Inn Silver guests, 4x accel)
 *   4. Near Platinum (89 Gold guests within ~$112 of $800 threshold)
 *   5. Push channel win for Silver (+28% vs email)
 *   6. CLV concentration (top 5% = 31% revenue)
 *   7. Cross-sell gap (Dining-only guests, low diversity)
 *   8. Completed A/B test (Platinum double-points weekend, +19% lift)
 *
 * Seasonality is summer-peak (inverse of the ski-resort cousin product):
 *   - Peak Jun, Jul, Aug (resort and outdoor properties)
 *   - Secondary holiday bump in late December (hotels and event venue)
 *   - Shoulder dips in Nov and Mar through Apr
 *
 * Outputs to /data as both JSON (consumed by the demo) and CSV (download via
 * Data Manager). Run with `npm run seed`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260517);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + rand() * (hi - lo);
const intBetween = (lo, hi) => Math.floor(between(lo, hi + 1));
const gauss = (mean, sd) => {
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

// ──────────────────────────────────────────────────────────────────────────
// Reference data: 9 coastal North Carolina properties
//   acv: avg folio value at that property (USD)
//   churn: baseline churn probability per guest with this home property
//   share: relative share of total guest base
//   type: drives category mix + seasonality multiplier
// ──────────────────────────────────────────────────────────────────────────
const STORES = [
  { id: 'STR-TVC', name: 'Wrightsville Beach Resort',         type: 'urban_hotel',  acv: 195, churn: 0.18, share: 0.20, loyaltyEnroll: 0.92 }, // flagship hotel
  { id: 'STR-MKI', name: 'Bald Head Island Club',       type: 'luxury_resort',acv: 425, churn: 0.10, share: 0.10, loyaltyEnroll: 0.81 }, // luxury resort
  { id: 'STR-PET', name: 'Cape Fear Inn',              type: 'boutique_hotel',acv: 215, churn: 0.16, share: 0.12, loyaltyEnroll: 0.88 },
  { id: 'STR-CHX', name: 'Brunswick Harbor Hotel',            type: 'boutique_hotel',acv: 210, churn: 0.18, share: 0.10, loyaltyEnroll: 0.85 },
  { id: 'STR-HSP', name: 'Kure Beach Grill',        type: 'fine_dining',   acv: 165, churn: 0.22, share: 0.10, loyaltyEnroll: 0.74 }, // fine dining restaurant
  { id: 'STR-TVT', name: 'Carolina Beach Tavern',  type: 'casual_dining', acv: 78,  churn: 0.42, share: 0.13, loyaltyEnroll: 0.62 }, // casual restaurant, the highest-churn property
  { id: 'STR-BHB', name: 'Southport Waterfront Lodge',            type: 'spa',           acv: 285, churn: 0.14, share: 0.08, loyaltyEnroll: 0.83 }, // spa
  { id: 'STR-LLD', name: 'Holden Beach Pavilion',                type: 'event_venue',   acv: 320, churn: 0.25, share: 0.07, loyaltyEnroll: 0.70 }, // events
  { id: 'STR-GLA', name: 'Oak Island Pier House',            type: 'boutique_inn',  acv: 230, churn: 0.16, share: 0.10, loyaltyEnroll: 0.87 }, // inn
];
const SHARE_TOTAL = STORES.reduce((a, s) => a + s.share, 0);
STORES.forEach((s) => (s.share = s.share / SHARE_TOTAL));

const RESORT_TYPES = new Set(['luxury_resort', 'spa']);
const HOTEL_TYPES  = new Set(['urban_hotel', 'boutique_hotel', 'boutique_inn', 'luxury_resort']);
const DINING_TYPES = new Set(['fine_dining', 'casual_dining']);

const FIRST_NAMES = [
  'Avery','Jordan','Riley','Cameron','Morgan','Taylor','Casey','Hayden',
  'Quinn','Reese','Sage','Skyler','Emerson','Rowan','Parker','Drew',
  'Logan','Blake','Harper','Finley','Phoenix','River','Sloan','Justice',
  'Marlowe','Ari','Eden','Jules','Lennon','Wren','Indigo','Briar',
];
const LAST_NAMES = [
  'Hayes','Rivera','Carter','Bennett','Brooks','Mitchell','Collins','Reed',
  'Bell','Knox','Young','Cole','Hunter','Walsh','Foster','Simmons','Murphy',
  'Patel','Nguyen','Garcia','Kim','Vargas','Park','Lee','Wright','Daniels',
  'Sutton','Rhodes','Bishop','Hawthorne','Whitaker','Larsson',
];

// Hospitality categories. Each property type favors a subset of these.
const CATEGORIES = [
  { name: 'Lodging',      weight: 0.30, avgPrice: 245 },
  { name: 'Dining',       weight: 0.22, avgPrice: 82 },
  { name: 'Spa',          weight: 0.10, avgPrice: 165 },
  { name: 'Activities',   weight: 0.09, avgPrice: 95 },
  { name: 'Bar',          weight: 0.10, avgPrice: 48 },
  { name: 'Retail',       weight: 0.06, avgPrice: 65 },
  { name: 'Events',       weight: 0.06, avgPrice: 320 },
  { name: 'Room Service', weight: 0.07, avgPrice: 58 },
];

const TYPE_CATEGORY_WEIGHTS = {
  urban_hotel:   { Lodging: 0.45, Dining: 0.20, Spa: 0.04, Activities: 0.05, Bar: 0.10, Retail: 0.04, Events: 0.04, 'Room Service': 0.08 },
  boutique_hotel:{ Lodging: 0.50, Dining: 0.18, Spa: 0.06, Activities: 0.06, Bar: 0.08, Retail: 0.04, Events: 0.02, 'Room Service': 0.06 },
  boutique_inn:  { Lodging: 0.55, Dining: 0.14, Spa: 0.04, Activities: 0.08, Bar: 0.07, Retail: 0.04, Events: 0.02, 'Room Service': 0.06 },
  luxury_resort: { Lodging: 0.38, Dining: 0.18, Spa: 0.15, Activities: 0.12, Bar: 0.06, Retail: 0.05, Events: 0.02, 'Room Service': 0.04 },
  fine_dining:   { Lodging: 0.02, Dining: 0.62, Spa: 0.0,  Activities: 0.0,  Bar: 0.30, Retail: 0.04, Events: 0.02, 'Room Service': 0.0 },
  casual_dining: { Lodging: 0.0,  Dining: 0.66, Spa: 0.0,  Activities: 0.0,  Bar: 0.28, Retail: 0.04, Events: 0.02, 'Room Service': 0.0 },
  spa:           { Lodging: 0.04, Dining: 0.05, Spa: 0.68, Activities: 0.06, Bar: 0.02, Retail: 0.12, Events: 0.01, 'Room Service': 0.02 },
  event_venue:   { Lodging: 0.05, Dining: 0.20, Spa: 0.0,  Activities: 0.05, Bar: 0.10, Retail: 0.02, Events: 0.55, 'Room Service': 0.03 },
};

const CHANNELS = ['email', 'sms', 'push'];

function pickStoreWeighted() {
  let r = rand();
  for (const s of STORES) { r -= s.share; if (r <= 0) return s; }
  return STORES[STORES.length - 1];
}

function pickCategory(storeType) {
  const weights = TYPE_CATEGORY_WEIGHTS[storeType] || Object.fromEntries(CATEGORIES.map((c) => [c.name, c.weight]));
  let r = rand();
  for (const cat of CATEGORIES) {
    r -= weights[cat.name] ?? cat.weight;
    if (r <= 0) return cat;
  }
  return CATEGORIES[0];
}

/**
 * coastal North Carolina hospitality seasonality, inverse of a ski-resort pattern.
 * Summer peak (Jun, Jul, Aug). Holiday bump late December. Shoulder dips
 * in November and Mar through Apr.
 *
 * Returns a multiplier on baseline visit rate for the given month (0-11)
 * and property type.
 */
function seasonMult(month, type) {
  // Base curve everyone follows
  const summerPeak = (month === 5 || month === 6 || month === 7); // Jun, Jul, Aug
  const holidayBump = (month === 11); // late December
  const novDip = (month === 10);
  const springDip = (month === 2 || month === 3); // Mar, Apr

  let m = 1.0;
  if (summerPeak)  m *= 1.45;
  if (holidayBump) m *= 1.15;
  if (novDip)      m *= 0.78;
  if (springDip)   m *= 0.82;

  // Resort/spa amplify summer further
  if ((type === 'luxury_resort' || type === 'spa' || type === 'boutique_inn') && summerPeak) m *= 1.10;
  // Event venue is weddings-heavy, summer/fall lean
  if (type === 'event_venue') {
    if (month >= 4 && month <= 9) m *= 1.15; // May through Oct
    if (month === 11) m *= 1.35;             // Dec holiday corporate
    if (month === 1 || month === 2) m *= 0.65;
  }
  // Casual dining is steadier
  if (type === 'casual_dining') {
    if (summerPeak) m = 1.10;
    if (springDip)  m = 0.92;
  }
  return m;
}

// Tier thresholds calibrated for hospitality folio sizes (much higher than
// the cannabis sister product's $45 baskets). Platinum requires meaningful
// annual spend across the portfolio.
function tierFor(annualSpend) {
  if (annualSpend >= 3000) return 'Platinum';
  if (annualSpend >= 1000) return 'Gold';
  return 'Silver';
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function emailFor(first, last, idx) {
  const domains = ['gmail.com','outlook.com','yahoo.com','proton.me','icloud.com'];
  return `${first.toLowerCase()}.${last.toLowerCase()}${idx % 100}@${pick(domains)}`;
}

function phoneFake() {
  return `(${intBetween(231, 989)}) ${intBetween(200, 999)}-${intBetween(1000, 9999)}`;
}

// ──────────────────────────────────────────────────────────────────────────
// 1. Guests
// ──────────────────────────────────────────────────────────────────────────
const NUM_CUSTOMERS = 2400;
const customers = [];

const TODAY = new Date('2026-05-17');
const HORIZON_START = new Date(TODAY);
HORIZON_START.setMonth(HORIZON_START.getMonth() - 24);

for (let i = 0; i < NUM_CUSTOMERS; i++) {
  const home = pickStoreWeighted();
  const first = pick(FIRST_NAMES);
  const last  = pick(LAST_NAMES);

  const loyaltyEnrolled = rand() < home.loyaltyEnroll;

  const optInEmail = rand() < 0.68;
  const optInSms   = rand() < 0.51;
  const optInPush  = rand() < 0.38;

  const acqMonthsAgo = intBetween(0, 30);
  const acquiredAt = new Date(TODAY);
  acquiredAt.setMonth(acquiredAt.getMonth() - acqMonthsAgo);

  // Adult-leisure leaning age proxy
  const baseAge = home.type === 'casual_dining' ? gauss(31, 9) : gauss(44, 13);
  const age = Math.max(21, Math.round(baseAge));

  customers.push({
    customer_id: `GST-${String(i + 1).padStart(5, '0')}`,
    first_name: first,
    last_name: last,
    email: emailFor(first, last, i),
    phone: phoneFake(),
    age,
    home_store_id: home.id,
    home_store: home.name,
    acquired_at: fmtDate(acquiredAt),
    loyalty_enrolled: loyaltyEnrolled,
    opt_in_email: optInEmail,
    opt_in_sms: optInSms,
    opt_in_push: optInPush,
    annual_spend: 0,
    lifetime_spend: 0,
    visits_90d: 0,
    last_visit: null,
    avg_basket: 0,
    tier: 'Silver',
    churn_risk: 0,
    rising_star: false,
    decliner: false,
    near_platinum: false,
    vip_likely: false,
    favorite_category: null,
    category_diversity: 0,
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 2. Folios (transactions), 24 months, ~36k total
// ──────────────────────────────────────────────────────────────────────────
const TARGET_TX = 36000;
const transactions = [];
const txByCustomer = new Map();

for (const c of customers) {
  const store = STORES.find((s) => s.id === c.home_store_id);
  c._isChurner = rand() < store.churn;
}

// Rising Stars: 118 Wrightsville Beach Resort + Cape Fear Inn Silver guests with strong recent acceleration.
const risingStarPool = customers.filter(
  (c) => (c.home_store === 'Wrightsville Beach Resort' || c.home_store === 'Cape Fear Inn') && !c._isChurner,
);
risingStarPool.sort(() => rand() - 0.5);
const RISING_STARS = risingStarPool.slice(0, 118);
RISING_STARS.forEach((c) => (c._risingStar = true));

// Decliners: 203 guests with 20%+ spend decline, concentrated at Carolina Beach Tavern and Wrightsville Beach Resort.
const declinerPool = customers.filter(
  (c) => c.home_store === 'Carolina Beach Tavern' || c.home_store === 'Wrightsville Beach Resort',
);
declinerPool.sort(() => rand() - 0.5);
const DECLINERS = declinerPool.slice(0, 203);
DECLINERS.forEach((c) => (c._decliner = true));

let txCounter = 0;

const isHeavy = customers.map(() => rand() < 0.18);
const isWhale = customers.map(() => rand() < 0.07);

for (let ci = 0; ci < customers.length; ci++) {
  const c = customers[ci];
  const store = STORES.find((s) => s.id === c.home_store_id);

  let lambda = Math.max(0.04, gauss(0.20, 0.09));
  if (c.loyalty_enrolled) lambda += 0.04;
  if (store.type === 'luxury_resort') lambda += 0.08;
  if (store.type === 'casual_dining') lambda += 0.22;   // higher repeat cadence at the tavern
  if (store.type === 'fine_dining')   lambda += 0.10;
  if (store.type === 'event_venue')   lambda *= 0.5;    // events are infrequent
  if (isHeavy[ci]) lambda += 0.55;
  if (isWhale[ci]) lambda *= 7;
  lambda = Math.max(0.04, lambda);

  for (let m = 0; m < 24; m++) {
    const monthDate = new Date(HORIZON_START);
    monthDate.setMonth(monthDate.getMonth() + m);
    const monthIdx = monthDate.getMonth();

    const seasonMultiplier = seasonMult(monthIdx, store.type);

    const monthsAgo = 24 - m;
    let churnMult = 1.0;
    if (c._isChurner && monthsAgo <= 3) {
      churnMult = monthsAgo === 1 ? 0 : monthsAgo === 2 ? 0.15 : 0.4;
    }
    // Casual dining churn pattern: dips after Labor Day (Sep) then again post-holiday (Jan)
    if (store.type === 'casual_dining' && (monthIdx === 8 || monthIdx === 0)) {
      churnMult *= 0.7;
    }
    if (c._decliner && monthsAgo <= 6) churnMult *= 0.5;
    if (c._risingStar && monthsAgo <= 2) churnMult *= 4.0;

    const expected = lambda * seasonMultiplier * churnMult;
    const visits = Math.max(0, Math.round(gauss(expected, Math.sqrt(expected) || 0.4)));

    for (let v = 0; v < visits; v++) {
      if (txCounter >= TARGET_TX * 1.05) break;
      txCounter++;

      const day = intBetween(1, 28);
      const txDate = new Date(monthDate);
      txDate.setDate(day);
      txDate.setHours(intBetween(9, 21), intBetween(0, 59), 0, 0);

      const numItems = Math.max(1, Math.round(gauss(2.1, 0.8)));
      const items = [];
      let subtotal = 0;
      const anchor = pickCategory(store.type);
      for (let n = 0; n < numItems; n++) {
        const cat = n === 0 ? anchor : pickCategory(store.type);
        const unitPrice = Math.max(8, +gauss(cat.avgPrice, cat.avgPrice * 0.20).toFixed(2));
        const qty = rand() < 0.85 ? 1 : 2;
        items.push({ category: cat.name, qty, unit_price: unitPrice });
        subtotal += qty * unitPrice;
      }

      const discountP = rand();
      const discount = discountP < 0.08 ? 0.25 : discountP < 0.20 ? 0.15 : discountP < 0.40 ? 0.10 : 0;
      const total = +(subtotal * (1 - discount)).toFixed(2);

      const promoChannel = discount > 0
        ? (c.opt_in_push && rand() < 0.4 ? 'push'
          : c.opt_in_email && rand() < 0.6 ? 'email'
          : c.opt_in_sms ? 'sms' : 'organic')
        : 'organic';

      const tx = {
        transaction_id: `FOL-${String(txCounter).padStart(6, '0')}`,
        customer_id: c.customer_id,
        store_id: c.home_store_id,
        store: c.home_store,
        date: txDate.toISOString(),
        items,
        item_count: items.length,
        subtotal: +subtotal.toFixed(2),
        discount_pct: discount,
        total,
        channel: promoChannel,
      };
      transactions.push(tx);
      if (!txByCustomer.has(c.customer_id)) txByCustomer.set(c.customer_id, []);
      txByCustomer.get(c.customer_id).push(tx);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 3. Roll-up guest metrics
// ──────────────────────────────────────────────────────────────────────────
const ONE_DAY = 24 * 60 * 60 * 1000;
for (const c of customers) {
  const txs = txByCustomer.get(c.customer_id) || [];
  if (!txs.length) {
    c.tier = 'Silver';
    c.churn_risk = 0.5;
    continue;
  }
  txs.sort((a, b) => new Date(a.date) - new Date(b.date));
  const lifetime = txs.reduce((a, t) => a + t.total, 0);
  const lastTx = txs[txs.length - 1];
  const lastDate = new Date(lastTx.date);
  const daysSince = Math.round((TODAY - lastDate) / ONE_DAY);

  const yearAgo = new Date(TODAY); yearAgo.setMonth(yearAgo.getMonth() - 12);
  const annual = txs.filter((t) => new Date(t.date) >= yearAgo).reduce((a, t) => a + t.total, 0);

  const ninetyAgo = new Date(TODAY); ninetyAgo.setDate(ninetyAgo.getDate() - 90);
  const visits90 = txs.filter((t) => new Date(t.date) >= ninetyAgo).length;

  const avg = lifetime / txs.length;

  const catCounts = {};
  for (const t of txs) {
    for (const it of t.items) {
      catCounts[it.category] = (catCounts[it.category] || 0) + it.qty;
    }
  }
  const fav = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const diversity = Object.keys(catCounts).length;

  c.lifetime_spend = +lifetime.toFixed(2);
  c.annual_spend = +annual.toFixed(2);
  c.visits_90d = visits90;
  c.last_visit = fmtDate(lastDate);
  c.days_since_last = daysSince;
  c.avg_basket = +avg.toFixed(2);
  c.tier = tierFor(annual);
  c.favorite_category = fav;
  c.category_diversity = diversity;

  const recencyScore = Math.min(1, daysSince / 90);
  const freqScore = Math.max(0, 1 - visits90 / 6);
  const baseChurn = 0.55 * recencyScore + 0.45 * freqScore;
  const store = STORES.find((s) => s.id === c.home_store_id);
  c.churn_risk = +Math.min(0.99, Math.max(0.01, baseChurn * (0.7 + store.churn))).toFixed(3);

  c.rising_star  = !!c._risingStar;
  c.decliner     = !!c._decliner;
  c.near_platinum= c.tier === 'Gold' && annual >= (3000 - 400) && annual < 3000;
  c.vip_likely   = (store.type === 'luxury_resort' || store.type === 'spa') && c.tier !== 'Silver' && c.avg_basket >= 250;

  delete c._isChurner; delete c._risingStar; delete c._decliner;
}

function forceFlag(predicate, flagKey, exactCount) {
  const eligible = customers.filter(predicate);
  eligible.sort((a, b) => (b[flagKey] ? 1 : 0) - (a[flagKey] ? 1 : 0));
  for (let i = 0; i < eligible.length; i++) eligible[i][flagKey] = i < exactCount;
}

// 89 Near Platinum
const goldBucket = customers
  .filter((c) => c.tier === 'Gold')
  .sort((a, b) => b.annual_spend - a.annual_spend);
customers.forEach((c) => (c.near_platinum = false));
goldBucket.slice(0, 89).forEach((c) => (c.near_platinum = true));

// 118 Rising Stars from Wrightsville Beach Resort + Cape Fear Inn Silver
let rsFixed = 0;
for (const c of customers) {
  if (c.rising_star) {
    if (c.tier !== 'Silver' || (c.home_store !== 'Wrightsville Beach Resort' && c.home_store !== 'Cape Fear Inn')) {
      c.rising_star = false;
    } else {
      rsFixed++;
    }
  }
}
if (rsFixed < 118) {
  const candidates = customers.filter(
    (c) => !c.rising_star && c.tier === 'Silver' &&
      (c.home_store === 'Wrightsville Beach Resort' || c.home_store === 'Cape Fear Inn'),
  ).sort((a, b) => b.visits_90d - a.visits_90d);
  for (const c of candidates) {
    if (rsFixed >= 118) break;
    c.rising_star = true; rsFixed++;
  }
}

// 203 Decliners (Carolina Beach Tavern + Wrightsville Beach Resort)
let decFixed = customers.filter((c) => c.decliner).length;
if (decFixed > 203) {
  const cur = customers.filter((c) => c.decliner);
  cur.sort((a, b) => a.annual_spend - b.annual_spend);
  cur.slice(203).forEach((c) => (c.decliner = false));
} else if (decFixed < 203) {
  const candidates = customers.filter(
    (c) => !c.decliner && (c.home_store === 'Carolina Beach Tavern' || c.home_store === 'Wrightsville Beach Resort'),
  ).sort((a, b) => a.visits_90d - b.visits_90d);
  for (const c of candidates) {
    if (decFixed >= 203) break;
    c.decliner = true; decFixed++;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 4. Campaign records, 9,600 sends
// ──────────────────────────────────────────────────────────────────────────
const campaigns = [];
const campaignCount = 9600;
const PROGRAMS = [
  'Welcome Series',
  'Birthday Reward',
  'Tier Upgrade Nudge',
  'Reactivation 30d',
  'Reactivation 60d',
  'Summer Stay Drop',
  'Resort Weekender',
  'Platinum Exclusive',
  'Dining Bundle',
  'Spa + Stay Package',
];
for (let i = 0; i < campaignCount; i++) {
  const c = customers[intBetween(0, customers.length - 1)];
  const prog = pick(PROGRAMS);
  const pickChannel = () => {
    const allowed = [];
    if (c.opt_in_email) allowed.push('email');
    if (c.opt_in_sms) allowed.push('sms');
    if (c.opt_in_push) allowed.push('push');
    return allowed.length ? pick(allowed) : 'email';
  };
  const channel = pickChannel();
  let openRate = channel === 'push' ? 0.62 : channel === 'sms' ? 0.55 : 0.32;
  let clickRate = channel === 'push' ? 0.18 : channel === 'sms' ? 0.14 : 0.06;
  let redeemRate = channel === 'push' ? 0.075 : channel === 'sms' ? 0.06 : 0.035;
  if (c.tier === 'Silver' && channel === 'push') {
    openRate *= 1.28; clickRate *= 1.28; redeemRate *= 1.28;
  }
  const opened = rand() < openRate;
  const clicked = opened && rand() < clickRate / openRate;
  const redeemed = clicked && rand() < redeemRate / clickRate;

  const sentDaysAgo = intBetween(1, 540);
  const sentAt = new Date(TODAY); sentAt.setDate(sentAt.getDate() - sentDaysAgo);

  campaigns.push({
    campaign_id: `CMP-${String(i + 1).padStart(5, '0')}`,
    customer_id: c.customer_id,
    program: prog,
    channel,
    sent_at: sentAt.toISOString(),
    opened,
    clicked,
    redeemed,
    revenue: redeemed ? +(c.avg_basket * (1 - 0.12)).toFixed(2) : 0,
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 5. Pre-built rollups
// ──────────────────────────────────────────────────────────────────────────
const tierCounts = customers.reduce((a, c) => { a[c.tier] = (a[c.tier] || 0) + 1; return a; }, {});
const storeRevenue = STORES.map((s) => {
  const txs = transactions.filter((t) => t.store_id === s.id);
  const rev = txs.reduce((a, t) => a + t.total, 0);
  return {
    store_id: s.id,
    store: s.name,
    transactions: txs.length,
    revenue: +rev.toFixed(2),
    acv: txs.length ? +(rev / txs.length).toFixed(2) : 0,
  };
});

const acvTrend = [];
for (let m = 0; m < 24; m++) {
  const start = new Date(HORIZON_START); start.setMonth(start.getMonth() + m);
  const end = new Date(start); end.setMonth(end.getMonth() + 1);
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date); return d >= start && d < end;
  });
  const rev = monthTx.reduce((a, t) => a + t.total, 0);
  acvTrend.push({
    month: start.toISOString().slice(0, 7),
    transactions: monthTx.length,
    revenue: +rev.toFixed(2),
    acv: monthTx.length ? +(rev / monthTx.length).toFixed(2) : 0,
  });
}

const atRisk = customers.filter((c) => c.churn_risk >= 0.65 && (c.days_since_last || 0) >= 45);

const sortedBySpend = [...customers].sort((a, b) => b.lifetime_spend - a.lifetime_spend);
const top5pctCutoff = Math.ceil(sortedBySpend.length * 0.05);
const top5pctRev = sortedBySpend.slice(0, top5pctCutoff).reduce((a, c) => a + c.lifetime_spend, 0);
const allRev = sortedBySpend.reduce((a, c) => a + c.lifetime_spend, 0);

const summary = {
  generated_at: new Date().toISOString(),
  client: 'Cape Fear Hospitality Group',
  client_type: 'Fictional 9-property coastal North Carolina hospitality operator',
  totals: {
    customers: customers.length,
    transactions: transactions.length,
    campaigns: campaigns.length,
    revenue: +allRev.toFixed(2),
  },
  tier_counts: tierCounts,
  channel_optin: {
    email: customers.filter((c) => c.opt_in_email).length,
    sms: customers.filter((c) => c.opt_in_sms).length,
    push: customers.filter((c) => c.opt_in_push).length,
  },
  at_risk: {
    count: atRisk.length,
    pct_of_base: +((atRisk.length / customers.length) * 100).toFixed(1),
  },
  rising_stars:  customers.filter((c) => c.rising_star).length,
  near_platinum: customers.filter((c) => c.near_platinum).length,
  decliners:     customers.filter((c) => c.decliner).length,
  vip_likely:    customers.filter((c) => c.vip_likely).length,
  clv_top5_pct_share: +((top5pctRev / allRev) * 100).toFixed(1),
  store_revenue: storeRevenue,
  acv_trend: acvTrend,
};

// ──────────────────────────────────────────────────────────────────────────
// 6. Pre-built A/B experiment + holdout state
// ──────────────────────────────────────────────────────────────────────────
const experiments = [
  {
    id: 'EXP-001',
    name: 'Platinum Tier Double Points Weekend',
    status: 'completed',
    started_at: '2025-11-08',
    ended_at: '2025-11-16',
    population: 'Platinum tier (active in last 90d)',
    hypothesis: 'A double-points weekend will lift visit frequency among Platinum members vs. holdout.',
    variant_a: { name: 'Control (regular points)', size: 192, visits_per_member: 1.42, revenue_per_member: 312.40 },
    variant_b: { name: 'Treatment (2x points Sat-Sun)', size: 188, visits_per_member: 1.69, revenue_per_member: 388.20 },
    lift_pct: 19.0,
    p_value: 0.014,
    stat_sig: true,
    notes: '+19.0% lift in visit frequency, statistically significant at p=0.014. Recommend rolling forward to all Platinum guests as a quarterly cadence.',
  },
  {
    id: 'EXP-002',
    name: 'Resort Property Personalization (push)',
    status: 'running',
    started_at: '2026-04-12',
    ended_at: null,
    population: 'Resort home-property guests (Bald Head Island Club, Southport Waterfront Lodge, Oak Island Pier House), push opt-in',
    hypothesis: 'Mentioning the guest\'s home resort property in push copy outperforms generic copy on redemption rate.',
    variant_a: { name: 'Control (generic)', size: 412, redemption_rate: 0.071, revenue_per_member: 64.80 },
    variant_b: { name: 'Treatment (home-property named)', size: 408, redemption_rate: 0.084, revenue_per_member: 76.10 },
    lift_pct: 18.3,
    p_value: 0.087,
    stat_sig: false,
    notes: 'Trending positive but not yet stat sig. Continue running through May 2026.',
  },
];

const holdouts = [
  {
    id: 'HOL-001',
    name: 'Permanent 5% Marketing Holdout',
    pct: 5,
    population: 'All Cape Fear Rewards members',
    members: Math.round(customers.length * 0.05),
    started_at: '2025-01-01',
    purpose: 'Provide a clean control population for measuring marketing program total lift across properties.',
    locked: true,
  },
];

// ──────────────────────────────────────────────────────────────────────────
// 7. Write outputs
// ──────────────────────────────────────────────────────────────────────────
function writeJSON(file, obj) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(obj));
  const sizeKb = (fs.statSync(path.join(DATA_DIR, file)).size / 1024).toFixed(1);
  console.log(`  wrote ${file.padEnd(28)} ${sizeKb} KB`);
}

function writeCSV(file, rows, columns) {
  const header = columns.join(',');
  const lines = rows.map((r) =>
    columns.map((col) => {
      let v = r[col];
      if (v == null) return '';
      if (typeof v === 'object') v = JSON.stringify(v);
      v = String(v);
      if (v.includes(',') || v.includes('"') || v.includes('\n')) v = `"${v.replace(/"/g, '""')}"`;
      return v;
    }).join(','),
  );
  fs.writeFileSync(path.join(DATA_DIR, file), header + '\n' + lines.join('\n'));
}

console.log('\nCape Fear Hospitality Group, synthetic data');
console.log('─'.repeat(50));

writeJSON('summary.json', summary);
writeJSON('customers.json', customers);
writeJSON('transactions.json', transactions);
writeJSON('campaigns.json', campaigns);
writeJSON('experiments.json', experiments);
writeJSON('holdouts.json', holdouts);
writeJSON('stores.json', STORES);

writeCSV('customers.csv', customers, [
  'customer_id','first_name','last_name','email','phone','age','home_store',
  'acquired_at','loyalty_enrolled','opt_in_email','opt_in_sms','opt_in_push',
  'annual_spend','lifetime_spend','visits_90d','last_visit','avg_basket',
  'tier','churn_risk','rising_star','decliner','near_platinum','vip_likely',
  'favorite_category','category_diversity',
]);

const txRows = [];
for (const t of transactions) {
  for (const it of t.items) {
    txRows.push({
      transaction_id: t.transaction_id, customer_id: t.customer_id,
      store: t.store, date: t.date,
      category: it.category, qty: it.qty, unit_price: it.unit_price,
      basket_total: t.total, discount_pct: t.discount_pct, channel: t.channel,
    });
  }
}
writeCSV('transactions.csv', txRows, [
  'transaction_id','customer_id','store','date','category','qty','unit_price',
  'basket_total','discount_pct','channel',
]);
writeCSV('campaigns.csv', campaigns, [
  'campaign_id','customer_id','program','channel','sent_at','opened','clicked','redeemed','revenue',
]);

console.log('─'.repeat(50));
console.log(`  guests:        ${customers.length}`);
console.log(`  folios:        ${transactions.length}`);
console.log(`  campaigns:     ${campaigns.length}`);
console.log(`  tier mix:      Silver ${tierCounts.Silver}, Gold ${tierCounts.Gold}, Platinum ${tierCounts.Platinum}`);
console.log(`  rising stars:  ${customers.filter((c) => c.rising_star).length}`);
console.log(`  near platinum: ${customers.filter((c) => c.near_platinum).length}`);
console.log(`  decliners:     ${customers.filter((c) => c.decliner).length}`);
console.log(`  at-risk:       ${atRisk.length} (${summary.at_risk.pct_of_base}% of base)`);
console.log(`  top-5% CLV:    ${summary.clv_top5_pct_share}% of revenue`);
console.log('─'.repeat(50));
console.log('done.\n');
