/**
 * Demo gate route. Every visitor who wants to enter /demo posts their name
 * and email here. The handler:
 *
 *   1. Validates the inputs.
 *   2. CALL 1 -- POST /api/profiles/ to upsert the profile (email, first_name,
 *      and custom properties company_name + source). Klaviyo's subscribe
 *      job endpoint does not accept first_name or properties at the profile
 *      attributes level; those have to be set via this separate call.
 *   3. CALL 2 -- POST /api/profile-subscription-bulk-create-jobs/ to add the
 *      now-existing profile to the configured list (default VvYAe4) with
 *      email-marketing consent.
 *   4. If CALL 1 fails, log and continue to CALL 2 -- the profile may already
 *      exist in Klaviyo, in which case the upsert returns 409 (treated as
 *      success here) but a hard 4xx/5xx still lets the subscribe attempt
 *      proceed.
 *   5. If CALL 2 succeeds, the audit row is written with status="synced"
 *      regardless of CALL 1's outcome (the visitor is in the list -- which
 *      is the primary goal). Any CALL 1 error is preserved in the
 *      klaviyo_error column for context.
 *   6. If CALL 2 fails, the row is written with status="error" + the full
 *      error chain (subscribe + any upsert error). We STILL return
 *      { success: true } so a flaky third-party doesn't lock the visitor out.
 *
 * The Klaviyo API key is read from process.env.KLAVIYO_API_KEY and is NEVER
 * exposed to the browser -- the React side only ever talks to this endpoint.
 */
import express from 'express';
import db from '../db.js';

export const gateRouter = express.Router();

const KLAVIYO_PROFILES_ENDPOINT     = 'https://a.klaviyo.com/api/profiles/';
const KLAVIYO_SUBSCRIBE_ENDPOINT    = 'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/';
const KLAVIYO_REVISION              = '2023-12-15';

const isEmail = (s) =>
  typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function klaviyoHeaders(apiKey) {
  return {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,
    'accept': 'application/json',
    'content-type': 'application/json',
    'revision': KLAVIYO_REVISION,
  };
}

function logFallback(row) {
  try {
    db.prepare(`
      INSERT INTO gate_leads_fallback
        (first_name, email, company_name, klaviyo_status, klaviyo_error, user_agent, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.first_name,
      row.email,
      row.company_name || null,
      row.klaviyo_status,
      row.klaviyo_error || null,
      row.user_agent ? row.user_agent.slice(0, 400) : null,
      row.ip ? row.ip.slice(0, 80) : null,
    );
  } catch (e) {
    // SQLite write failed too -- log loudly but don't bubble; we still want
    // the visitor to enter the demo.
    console.error('[gate] SQLite fallback write failed:', e?.message || e);
  }
}

// CALL 1: upsert the profile so first_name + custom properties are attached
// to the email, then CALL 2 can subscribe it. Returns { ok, error?, note? }.
// 409 (profile already exists) is treated as success since the email is the
// stable identifier and the second call will subscribe whichever profile
// holds it. Note: Klaviyo POST /api/profiles/ does NOT update existing
// profiles -- a 409 means the existing profile's first_name/properties are
// unchanged. PATCH /api/profiles/{id} would be required to mutate them.
async function upsertProfile({ apiKey, firstName, email, companyName }) {
  const payload = {
    data: {
      type: 'profile',
      attributes: {
        email,
        first_name: firstName,
        properties: {
          company_name: companyName || '',
          source: 'Coast Analytics Demo Gate',
        },
      },
    },
  };
  let res;
  try {
    res = await fetch(KLAVIYO_PROFILES_ENDPOINT, {
      method: 'POST',
      headers: klaviyoHeaders(apiKey),
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return { ok: false, error: `Network error on profile upsert: ${e?.message || e}` };
  }
  if (res.status >= 200 && res.status < 300) return { ok: true };
  if (res.status === 409) return { ok: true, note: 'profile already exists' };
  let body = '';
  try { body = await res.text(); } catch { /* ignore */ }
  return { ok: false, error: `profile upsert HTTP ${res.status}: ${body.slice(0, 400)}` };
}

// CALL 2: subscribe an existing profile to KLAVIYO_LIST_ID. The bulk-create
// jobs endpoint only accepts email + subscriptions on the profile -- no
// first_name, no properties. Those were set by upsertProfile above.
async function subscribeToList({ apiKey, listId, email }) {
  // NOTE: the 2023-12-15 revision does not accept `historical_import` at
  // this attributes level (Klaviyo returns HTTP 400 'invalid field'). The
  // default behavior without it is the real-time signup we want -- consent
  // gets recorded with this request as the source-of-truth event.
  const payload = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        profiles: {
          data: [{
            type: 'profile',
            attributes: {
              email,
              subscriptions: {
                email: { marketing: { consent: 'SUBSCRIBED' } },
              },
            },
          }],
        },
      },
      relationships: {
        list: { data: { type: 'list', id: listId } },
      },
    },
  };
  let res;
  try {
    res = await fetch(KLAVIYO_SUBSCRIBE_ENDPOINT, {
      method: 'POST',
      headers: klaviyoHeaders(apiKey),
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return { ok: false, error: `Network error on subscribe: ${e?.message || e}` };
  }
  // 202 Accepted on success for bulk jobs.
  if (res.status >= 200 && res.status < 300) return { ok: true };
  let body = '';
  try { body = await res.text(); } catch { /* ignore */ }
  return { ok: false, error: `subscribe HTTP ${res.status}: ${body.slice(0, 400)}` };
}

gateRouter.post('/gate/subscribe', async (req, res) => {
  const b = req.body || {};
  const firstName = String(b.firstName || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const companyName = b.companyName ? String(b.companyName).trim() : '';

  if (!firstName) return res.status(400).json({ success: false, error: 'first_name required' });
  if (!isEmail(email)) return res.status(400).json({ success: false, error: 'valid email required' });

  const apiKey = process.env.KLAVIYO_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID || 'VvYAe4';

  let upsert = { ok: false, error: 'KLAVIYO_API_KEY not configured on server' };
  let subscribe = { ok: false, error: 'KLAVIYO_API_KEY not configured on server' };

  if (apiKey) {
    // Call 1
    upsert = await upsertProfile({ apiKey, firstName, email, companyName });
    if (!upsert.ok) {
      console.error('[gate] profile upsert failed (continuing to subscribe):', upsert.error);
    }
    // Call 2 -- always run, even if upsert failed
    subscribe = await subscribeToList({ apiKey, listId, email });
    if (!subscribe.ok) {
      console.error('[gate] list subscribe failed:', subscribe.error);
    }
  } else {
    console.error('[gate] KLAVIYO_API_KEY not configured -- skipping both calls');
  }

  // Status comes from CALL 2 (the subscription is what actually adds the
  // visitor to the list). If subscribe succeeded, the row is "synced" even
  // if the upsert failed -- the lead is in Klaviyo, just without first_name.
  const klaviyoOk = subscribe.ok;
  const errorParts = [];
  if (!upsert.ok) errorParts.push(`upsert: ${upsert.error}`);
  if (!subscribe.ok) errorParts.push(`subscribe: ${subscribe.error}`);

  logFallback({
    first_name: firstName.slice(0, 80),
    email: email.slice(0, 200),
    company_name: companyName.slice(0, 200) || null,
    klaviyo_status: klaviyoOk ? 'synced' : 'error',
    klaviyo_error: errorParts.length ? errorParts.join(' | ').slice(0, 1000) : null,
    user_agent: req.get('user-agent'),
    ip: req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '',
  });

  // Always 200 OK to the browser -- a flaky third-party never traps the visitor.
  res.json({ success: true });
});
