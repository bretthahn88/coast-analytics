/**
 * Local dev entrypoint. Vercel uses /api/index.js instead.
 */
import 'dotenv/config';
import { buildApp } from './app.js';

const port = +(process.env.PORT || 3001);
const app = buildApp();
app.listen(port, () => {
  console.log(`Coast Analytics API listening on http://localhost:${port}`);
});
