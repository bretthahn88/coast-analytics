/**
 * Lead capture endpoints.
 *
 *   POST /api/leads           public form submission from the demo widget
 *   POST /api/contact         public form submission from the About page
 *   GET  /api/admin/leads     admin-gated full lead export (JSON)
 *   GET  /api/admin/leads.csv admin-gated CSV download
 *
 * Admin auth is a simple shared password sent in the x-admin-password header
 * (also accepted as ?password= query for the CSV download anchor). Works for
 * a low-traffic demo, not a substitute for real auth.
 */
import express from 'express';
import { stringify } from 'csv-stringify/sync';
import db from '../db.js';

export const leadsRouter = express.Router();

const NUM_PROP_OPTIONS = ['1-2', '3-5', '6-10', '10+'];
const REFERRAL_OPTIONS = [
  'Google', 'LinkedIn', 'Referral', 'Oak Island AI website', 'Other',
];

function isEmail(s) { return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

function adminGate(req, res, next) {
  const sent = req.get('x-admin-password') || req.query.password || '';
  const expected = process.env.ADMIN_PASSWORD || 'ilpadmin2026';
  if (sent !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

leadsRouter.post('/leads', (req, res) => {
  const b = req.body || {};
  const errors = [];
  if (!b.first_name || !String(b.first_name).trim()) errors.push('first_name required');
  if (!b.last_name || !String(b.last_name).trim()) errors.push('last_name required');
  if (!b.company_name || !String(b.company_name).trim()) errors.push('company_name required');
  if (!isEmail(b.email)) errors.push('valid email required');
  if (b.num_properties && !NUM_PROP_OPTIONS.includes(b.num_properties)) errors.push('num_properties invalid');
  if (b.referral_source && !REFERRAL_OPTIONS.includes(b.referral_source)) errors.push('referral_source invalid');
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const stmt = db.prepare(`
    INSERT INTO leads (first_name, last_name, company_name, email, phone,
                       num_properties, referral_source, page_viewed, user_agent, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    String(b.first_name).trim().slice(0, 80),
    String(b.last_name).trim().slice(0, 80),
    String(b.company_name).trim().slice(0, 200),
    String(b.email).trim().toLowerCase().slice(0, 200),
    b.phone ? String(b.phone).trim().slice(0, 40) : null,
    b.num_properties || null,
    b.referral_source || null,
    b.page_viewed ? String(b.page_viewed).slice(0, 200) : null,
    req.get('user-agent')?.slice(0, 400) || null,
    (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '').slice(0, 80),
  );
  res.status(201).json({ id: result.lastInsertRowid, message: 'Thanks, we will be in touch within 1 business day.' });
});

leadsRouter.post('/contact', (req, res) => {
  const b = req.body || {};
  if (!b.name || !isEmail(b.email) || !b.message) {
    return res.status(400).json({ error: 'name, email, and message required' });
  }
  const stmt = db.prepare(`
    INSERT INTO contact_submissions (name, company_name, email, phone, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    String(b.name).trim().slice(0, 200),
    b.company_name ? String(b.company_name).trim().slice(0, 200) : null,
    String(b.email).trim().toLowerCase().slice(0, 200),
    b.phone ? String(b.phone).trim().slice(0, 40) : null,
    String(b.message).trim().slice(0, 4000),
  );
  res.status(201).json({ id: result.lastInsertRowid, message: 'Thanks, we will be in touch shortly.' });
});

leadsRouter.get('/admin/leads', adminGate, (_req, res) => {
  const leads = db.prepare(`SELECT * FROM leads ORDER BY datetime(created_at) DESC`).all();
  const contacts = db.prepare(`SELECT * FROM contact_submissions ORDER BY datetime(created_at) DESC`).all();
  const gateLeads = db.prepare(
    `SELECT * FROM gate_leads_fallback ORDER BY datetime(created_at) DESC`,
  ).all();
  const gateOk = gateLeads.filter((g) => g.klaviyo_status === 'synced' || g.klaviyo_status === 'ok').length;
  const gateErr = gateLeads.length - gateOk;
  res.json({
    leads, contacts,
    lead_count: leads.length,
    contact_count: contacts.length,
    gate_leads: gateLeads,
    gate_count: gateLeads.length,
    gate_ok_count: gateOk,
    gate_error_count: gateErr,
  });
});

leadsRouter.get('/admin/leads.csv', adminGate, (_req, res) => {
  const leads = db.prepare(`SELECT * FROM leads ORDER BY datetime(created_at) DESC`).all();
  const csv = stringify(leads, { header: true });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="ilp-leads-${Date.now()}.csv"`);
  res.send(csv);
});
