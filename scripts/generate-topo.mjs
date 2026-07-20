/**
 * Blog topographic hero pattern generator.
 *
 * Produces client/public/images/blog-topo-pattern.svg by extracting real
 * contour lines (marching squares) from a procedurally generated height
 * field. The field is a sum of Gaussian "hills" (and one negative Gaussian
 * "basin") plus fractal value noise, so the resulting contours are organic,
 * nested, multi-feature, and reach the frame edges, the way contour lines
 * on an actual USGS topographic map behave. Not concentric ovals.
 *
 * Run:  node scripts/generate-topo.mjs
 *
 * Deterministic (seeded PRNG), so re-running yields the same SVG. Bump
 * SEED to get a different terrain.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'client', 'public', 'images', 'blog-topo-pattern.svg');

const SEED = 20260519;
const W = 400, H = 300;            // viewBox, 4:3 (unchanged aspect)
const COLS = 100, ROWS = 75;       // sampling grid (cell = 4 x 4)
const N_LEVELS = 11;               // contour count
const DP_EPS = 0.5;                // polyline simplification tolerance (px)

// ── seeded PRNG ────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);

// ── fractal value noise ────────────────────────────────────────────────────
// Coarse random lattice, smoothstep-interpolated, summed across octaves.
function makeNoise(gw, gh) {
  const g = [];
  for (let i = 0; i <= gh; i++) {
    g[i] = [];
    for (let j = 0; j <= gw; j++) g[i][j] = rand();
  }
  return (u, v) => {
    const x = u * gw, y = v * gh;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, gw), y1 = Math.min(y0 + 1, gh);
    const fx = x - x0, fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = g[y0][x0], b = g[y0][x1], c = g[y1][x0], d = g[y1][x1];
    return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
  };
}
const n1 = makeNoise(5, 4);
const n2 = makeNoise(11, 8);
const n3 = makeNoise(23, 17);
const fbm = (u, v) => 0.55 * n1(u, v) + 0.30 * n2(u, v) + 0.15 * n3(u, v);

// ── height field: Gaussian features + noise perturbation ───────────────────
// Two dominant features (upper-left, lower-right), two edge-clipped ridges,
// and one basin (negative amp). The noise term makes the contour lines
// meander instead of forming clean ellipses.
const FEATURES = [
  { cx: 0.24, cy: 0.30, amp:  1.00, sig: 0.30 },
  { cx: 0.79, cy: 0.74, amp:  0.92, sig: 0.27 },
  { cx: 0.62, cy: 0.08, amp:  0.55, sig: 0.22 },
  { cx: 1.04, cy: 0.48, amp:  0.60, sig: 0.24 },
  { cx: 0.50, cy: 0.60, amp: -0.42, sig: 0.18 },
  { cx: 0.06, cy: 0.88, amp:  0.46, sig: 0.20 },
];
function height(u, v) {
  let h = 0;
  for (const f of FEATURES) {
    const dx = u - f.cx, dy = v - f.cy;
    h += f.amp * Math.exp(-(dx * dx + dy * dy) / (2 * f.sig * f.sig));
  }
  h += (fbm(u, v) - 0.5) * 0.34; // organic perturbation
  return h;
}

// ── sample the field ───────────────────────────────────────────────────────
const field = [];
let hmin = Infinity, hmax = -Infinity;
for (let i = 0; i <= ROWS; i++) {
  field[i] = [];
  for (let j = 0; j <= COLS; j++) {
    const h = height(j / COLS, i / ROWS);
    field[i][j] = h;
    if (h < hmin) hmin = h;
    if (h > hmax) hmax = h;
  }
}

// ── marching squares for one contour level ─────────────────────────────────
function contourSegments(level) {
  const segs = [];
  const cw = W / COLS, ch = H / ROWS;
  const t = (a, b) => (level - a) / (b - a);
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const tl = field[i][j], tr = field[i][j + 1];
      const br = field[i + 1][j + 1], bl = field[i + 1][j];
      let idx = 0;
      if (tl > level) idx |= 8;
      if (tr > level) idx |= 4;
      if (br > level) idx |= 2;
      if (bl > level) idx |= 1;
      if (idx === 0 || idx === 15) continue;
      const x = j * cw, y = i * ch;
      const top = () => [x + cw * t(tl, tr), y];
      const right = () => [x + cw, y + ch * t(tr, br)];
      const bottom = () => [x + cw * t(bl, br), y + ch];
      const left = () => [x, y + ch * t(tl, bl)];
      const push = (p, q) => segs.push([p[0], p[1], q[0], q[1]]);
      switch (idx) {
        case 1:  push(left(), bottom()); break;
        case 2:  push(bottom(), right()); break;
        case 3:  push(left(), right()); break;
        case 4:  push(top(), right()); break;
        case 5:  push(top(), right()); push(left(), bottom()); break;
        case 6:  push(top(), bottom()); break;
        case 7:  push(top(), left()); break;
        case 8:  push(top(), left()); break;
        case 9:  push(top(), bottom()); break;
        case 10: push(top(), left()); push(bottom(), right()); break;
        case 11: push(top(), right()); break;
        case 12: push(left(), right()); break;
        case 13: push(right(), bottom()); break;
        case 14: push(left(), bottom()); break;
      }
    }
  }
  return segs;
}

// ── join segments into continuous polylines ────────────────────────────────
function joinSegments(segs) {
  const key = (x, y) => `${x.toFixed(2)},${y.toFixed(2)}`;
  const used = new Array(segs.length).fill(false);
  const adj = new Map();
  segs.forEach((s, i) => {
    for (const k of [key(s[0], s[1]), key(s[2], s[3])]) {
      if (!adj.has(k)) adj.set(k, []);
      adj.get(k).push(i);
    }
  });
  const lines = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const s = segs[i];
    const pts = [[s[0], s[1]], [s[2], s[3]]];
    for (const dir of ['fwd', 'back']) {
      let grow = true;
      while (grow) {
        grow = false;
        const node = dir === 'fwd' ? pts[pts.length - 1] : pts[0];
        const k = key(node[0], node[1]);
        for (const ci of adj.get(k) || []) {
          if (used[ci]) continue;
          const c = segs[ci];
          const next = key(c[0], c[1]) === k ? [c[2], c[3]] : [c[0], c[1]];
          if (dir === 'fwd') pts.push(next); else pts.unshift(next);
          used[ci] = true;
          grow = true;
          break;
        }
      }
    }
    lines.push(pts);
  }
  return lines;
}

// ── Douglas-Peucker polyline simplification ────────────────────────────────
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    let maxD = 0, idx = -1;
    const [ax, ay] = pts[lo], [bx, by] = pts[hi];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-9;
    for (let k = lo + 1; k < hi; k++) {
      const [px, py] = pts[k];
      let tt = ((px - ax) * dx + (py - ay) * dy) / len2;
      tt = Math.max(0, Math.min(1, tt));
      const d = Math.hypot(px - (ax + dx * tt), py - (ay + dy * tt));
      if (d > maxD) { maxD = d; idx = k; }
    }
    if (maxD > eps && idx > 0) {
      keep[idx] = true;
      stack.push([lo, idx], [idx, hi]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

// ── build the contour set ──────────────────────────────────────────────────
// Levels are placed slightly non-uniformly so spacing varies. Each level is
// flagged primary or secondary for stroke weight; one mid level is the rust
// accent.
const PRIMARY_LEVELS = new Set([0, 1, 4, 6, 9]);
const RUST_LEVEL = 5;

function polylineLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return len;
}

const layers = [];
for (let k = 0; k < N_LEVELS; k++) {
  // jittered placement inside [hmin, hmax]
  const frac = (k + 0.5 + (rand() - 0.5) * 0.45) / N_LEVELS;
  const level = hmin + (hmax - hmin) * frac;
  const lines = joinSegments(contourSegments(level))
    .map((pl) => simplify(pl, DP_EPS))
    // drop sub-3px specks (collapsed micro-contours) so they do not
    // render as stray dots under round linecaps
    .filter((pl) => pl.length >= 2 && polylineLength(pl) >= 3);
  layers.push({ k, lines });
}

// ── emit SVG ───────────────────────────────────────────────────────────────
const fmt = (n) => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};
const polyline = (pts) =>
  pts.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ');

let body = '';
let count = 0;
for (const { k, lines } of layers) {
  const isRust = k === RUST_LEVEL;
  const isPrimary = PRIMARY_LEVELS.has(k);
  const stroke = isRust ? '#c27c2a' : '#95aead';
  const opacity = isRust ? 0.30 : isPrimary ? 0.80 : 0.50;
  const width = isRust ? 1.2 : isPrimary ? 1.5 : 1.0;
  for (const pl of lines) {
    body += `    <polyline points="${polyline(pl)}" stroke="${stroke}" `
          + `stroke-width="${width}" opacity="${opacity}"/>\n`;
    count++;
  }
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Blog hero topographic pattern. Procedurally generated: marching-squares
  contour extraction from a Gaussian + fractal-noise height field. Regenerate
  with  node scripts/generate-topo.mjs
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
     preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="${W}" height="${H}" fill="#eee5d3"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
${body}  </g>
</svg>
`;

fs.writeFileSync(OUT, svg);
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`wrote ${OUT}`);
console.log(`  ${count} contour polylines, ${N_LEVELS} levels, ${kb} KB`);
