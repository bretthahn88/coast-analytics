/**
 * Loads the synthetic Cape Fear Hospitality Group data from /data and exposes
 * read-only accessors. Caches in-memory after first load.
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');

function loadJSON(name) {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Synthetic data missing at ${p}. Run \`npm run seed\` first.`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

let _summary, _customers, _transactions, _campaigns, _experiments, _holdouts, _stores;

export function summary()      { return _summary      ??= loadJSON('summary.json'); }
export function customers()    { return _customers    ??= loadJSON('customers.json'); }
export function transactions() { return _transactions ??= loadJSON('transactions.json'); }
export function campaigns()    { return _campaigns    ??= loadJSON('campaigns.json'); }
export function experiments() { return _experiments  ??= loadJSON('experiments.json'); }
export function holdouts()     { return _holdouts     ??= loadJSON('holdouts.json'); }
export function stores()       { return _stores       ??= loadJSON('stores.json'); }
