/**
 * Demo data + ML model endpoints. All read-only and public, no guest PII is
 * at risk because the dataset is synthetic.
 */
import express from 'express';
import { stringify } from 'csv-stringify/sync';
import * as data from '../data-store.js';
import { MODEL_HANDLERS, nextBestAction } from '../ml-models.js';

export const demoRouter = express.Router();

demoRouter.get('/summary', (_req, res) => res.json(data.summary()));
demoRouter.get('/stores', (_req, res) => res.json(data.stores()));
demoRouter.get('/customers', (req, res) => {
  const { tier, store, limit } = req.query;
  let rows = data.customers();
  if (tier) rows = rows.filter((c) => c.tier === tier);
  if (store) rows = rows.filter((c) => c.home_store === store);
  if (limit) rows = rows.slice(0, +limit);
  res.json({ count: rows.length, customers: rows });
});
demoRouter.get('/experiments', (_req, res) => res.json(data.experiments()));
demoRouter.get('/holdouts', (_req, res) => res.json(data.holdouts()));

// Models, dynamic dispatch
demoRouter.get('/models', (_req, res) => {
  res.json({ models: Object.keys(MODEL_HANDLERS) });
});

// CSV export wrapper for any model. Declared BEFORE the :id route so the
// extension does not get swallowed by the dynamic param.
demoRouter.get('/models/:id.csv', (req, res) => {
  const handler = MODEL_HANDLERS[req.params.id];
  if (!handler) return res.status(404).json({ error: 'Unknown model id' });
  const out = handler();
  const candidates = ['ranked','list','top_customers','rows','due_in_next_7_days','store_breakdown','by_store','distribution','candidate_products','top_recommendations'];
  let rows = null;
  let key;
  for (const k of candidates) {
    if (out[k] && Array.isArray(out[k]) && out[k].length) { rows = out[k]; key = k; break; }
  }
  if (!rows && out.flows && typeof out.flows === 'object') {
    rows = Object.entries(out.flows).map(([flow, count]) => ({ flow, count }));
    key = 'flows';
  }
  if (!rows) return res.status(400).json({ error: 'No tabular data for this model' });
  const csv = stringify(rows, { header: true });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}-${key}.csv"`);
  res.send(csv);
});

demoRouter.get('/models/:id', async (req, res) => {
  const handler = MODEL_HANDLERS[req.params.id];
  if (!handler) return res.status(404).json({ error: 'Unknown model id', id: req.params.id });

  // Optional: try Python ML service first if configured.
  const pyUrl = process.env.ML_SERVICE_URL;
  if (pyUrl) {
    try {
      const r = await fetch(`${pyUrl}/score/${req.params.id}`, { method: 'GET' });
      if (r.ok) {
        const out = await r.json();
        res.setHeader('x-ilp-engine', 'python');
        return res.json(out);
      }
    } catch {
      // fall through to JS heuristic
    }
  }
  res.setHeader('x-ilp-engine', 'js-heuristic');
  res.json(handler());
});

// Next Best Action, top 10 priority guests across all models.
demoRouter.get('/nba', (_req, res) => {
  res.json({ priority: nextBestAction() });
});

// Customers CSV (for Data Manager export)
demoRouter.get('/customers.csv', (_req, res) => {
  const rows = data.customers();
  const csv = stringify(rows, { header: true });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="northwood-guests.csv"`);
  res.send(csv);
});
