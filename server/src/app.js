/**
 * Express app builder. Used by `server/src/index.js` for local dev and by
 * `api/index.js` for the Vercel serverless wrapper.
 */
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { leadsRouter } from './routes/leads.js';
import { demoRouter } from './routes/demo.js';
import { gateRouter } from './routes/gate.js';

export function buildApp() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: false,
  }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'coast-analytics-api',
      time: new Date().toISOString(),
      ml_engine: process.env.ML_SERVICE_URL ? 'python-or-fallback' : 'js-heuristic',
    });
  });

  app.use('/api', leadsRouter);
  app.use('/api', demoRouter);
  app.use('/api', gateRouter);

  app.use((err, _req, res, _next) => {
    console.error('Express error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
