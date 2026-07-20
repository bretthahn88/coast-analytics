import { useEffect } from 'react';

/**
 * Per-page document head management. Lightweight alternative to react-helmet
 * for a small site.
 *
 * Supports:
 *   title         -- <title>
 *   description   -- <meta name="description">
 *   ogTitle       -- <meta property="og:title">    (defaults to `title`)
 *   ogDescription -- <meta property="og:description"> (defaults to `description`)
 *   ogImage       -- <meta property="og:image">    (skipped when not provided)
 *   ogType        -- <meta property="og:type">     (defaults to "website")
 *   canonical     -- <link rel="canonical">         (skipped when not provided)
 */
export function useSEO({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
  canonical,
} = {}) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMeta('name', 'description', description);

    setMeta('property', 'og:title', ogTitle || title || null);
    setMeta('property', 'og:description', ogDescription || description || null);
    setMeta('property', 'og:type', ogType || 'website');
    setMeta('property', 'og:image', ogImage || null);

    setLink('canonical', canonical || null);
  }, [title, description, ogTitle, ogDescription, ogImage, ogType, canonical]);
}

function setMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (value == null || value === '') {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (href == null || href === '') {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}
