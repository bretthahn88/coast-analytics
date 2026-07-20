/**
 * Source of truth for the thirteen predictive models. Drives the sidebar
 * navigation and the dynamic ModelPage renderer.
 *
 * Logic is shared with the Pinelands sister product. Copy and slugs are
 * rewritten for hospitality (return-visit replaces replenishment, etc.).
 */
export const MODEL_SECTIONS = [
  {
    title: 'Core Models',
    models: [
      { id: 'churn',             slug: 'churn-risk',          name: 'Churn Risk' },
      { id: 'acv-forecast',      slug: 'acv-forecast',        name: 'Revenue / Folio Forecasting' },
      { id: 'tier-migration',    slug: 'tier-migration',      name: 'Loyalty Tier Migration' },
      { id: 'campaign-response', slug: 'campaign-response',   name: 'Campaign Response' },
    ],
  },
  {
    title: 'Guest Scoring',
    models: [
      { id: 'decliners',    slug: 'decliner-detection', name: 'Decliner Detection' },
      { id: 'rising-stars', slug: 'rising-stars',       name: 'Rising Stars' },
      { id: 'near-platinum',slug: 'near-platinum',      name: 'Near Platinum' },
      { id: 'vip-likely',   slug: 'vip-likely',         name: 'VIP Likely' },
      { id: 'clv',          slug: 'clv',                name: 'Guest Lifetime Value' },
    ],
  },
  {
    title: 'Basket & Cross-Property',
    models: [
      { id: 'basket',        slug: 'basket-recommendation', name: 'Basket Recommendation' },
      { id: 'upsell',        slug: 'upsell',                name: 'Upsell Recommendation' },
      { id: 'cross-sell',    slug: 'cross-sell',            name: 'Cross-Sell Recommendation' },
      { id: 'return-visit',  slug: 'return-visit',          name: 'Return-Visit Predictor' },
    ],
  },
];

export const MODELS = MODEL_SECTIONS.flatMap((s) => s.models.map((m) => ({ ...m, section: s.title })));

export const MODEL_BY_SLUG = Object.fromEntries(MODELS.map((m) => [m.slug, m]));
export const MODEL_BY_ID = Object.fromEntries(MODELS.map((m) => [m.id, m]));
