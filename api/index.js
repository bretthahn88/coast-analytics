/**
 * Vercel serverless function. The vercel.json `routes` config rewrites every
 * `/api/...` URL to this single endpoint and stashes the original captured
 * path in the `x-original-path` header. We restore `req.url` from that header
 * before handing the request to the Express app -- otherwise Express only
 * ever sees `/api/index` and 404s every nested route.
 *
 * Lazy-init the app on first request so any module-level error (SQLite open,
 * data file read) returns a clean JSON 500 instead of FUNCTION_INVOCATION_FAILED.
 */
let _app;
let _err;

async function getApp() {
  if (_app) return _app;
  if (_err) throw _err;
  try {
    const { buildApp } = await import('../server/src/app.js');
    _app = buildApp();
    return _app;
  } catch (e) {
    _err = e;
    throw e;
  }
}

export default async function handler(req, res) {
  // Recover the real URL the user requested. Vercel rewrites have already
  // overwritten req.url to '/api/index'; the route config preserves the
  // original capture in this header.
  const originalPath = req.headers['x-original-path'];
  if (originalPath) {
    const qIdx = req.url.indexOf('?');
    const qs = qIdx >= 0 ? req.url.slice(qIdx) : '';
    req.url = '/api/' + originalPath + qs;
  }

  try {
    const app = await getApp();
    return app(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      error: 'Function init failed',
      message: e?.message || String(e),
    }));
  }
}
