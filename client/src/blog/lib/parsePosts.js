/**
 * Auto-discovers every markdown post under blog/posts/ at build time and
 * exposes them as `{ frontmatter, body, raw, filename }` records sorted by
 * date desc.
 *
 * Drop a new YYYY-MM-DD-slug.md into client/src/blog/posts/ and it shows
 * up on /blog the next build -- no registration step.
 *
 * Frontmatter is a minimalist YAML subset: `key: "string value"` or
 * `key: bareValue` (booleans + ISO dates supported). No nested objects,
 * no arrays. Three dashes top and bottom.
 */

// Vite glob import. `query: '?raw'` returns the file as a string.
const RAW_POSTS = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const FRONTMATTER_BOUNDARY = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_BOUNDARY);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  const yaml = match[1];
  const body = match[2];
  const frontmatter = {};
  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    let value = trimmed.slice(colon + 1).trim();
    // Strip wrapping quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Type coercion
    if (value === 'true')  frontmatter[key] = true;
    else if (value === 'false') frontmatter[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(value)) frontmatter[key] = Number(value);
    else frontmatter[key] = value;
  }
  return { frontmatter, body };
}

function deriveFilename(path) {
  const m = path.match(/([^/]+)\.md$/);
  return m ? m[1] : path;
}

const POSTS = Object.entries(RAW_POSTS)
  .map(([path, raw]) => {
    const { frontmatter, body } = parseFrontmatter(String(raw));
    return {
      filename: deriveFilename(path),
      frontmatter,
      body,
      raw: String(raw),
    };
  })
  // Sort by date desc, falling back to filename desc when dates are equal.
  .sort((a, b) => {
    const da = a.frontmatter.date || '';
    const db = b.frontmatter.date || '';
    if (db !== da) return db.localeCompare(da);
    return b.filename.localeCompare(a.filename);
  });

export const allPosts = POSTS;

export function getPostBySlug(slug) {
  return POSTS.find((p) => p.frontmatter.slug === slug) || null;
}

export function getFeaturedPost() {
  return POSTS.find((p) => p.frontmatter.featured === true) || POSTS[0] || null;
}

export function getNonFeaturedPosts() {
  const featured = getFeaturedPost();
  return POSTS.filter((p) => p !== featured);
}

export function getRelatedPosts(currentSlug, limit = 2) {
  return POSTS.filter((p) => p.frontmatter.slug !== currentSlug).slice(0, limit);
}

/**
 * Format an ISO date (YYYY-MM-DD) the way the blog displays it:
 * "April 28, 2026". Falls back to the raw string on parse failure.
 */
export function formatPostDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return String(iso);
  }
}
