// Prefixes internal paths with the deploy base (e.g. "/portfolio/" on GitHub Pages project sites).
export function url(path = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return clean ? `${base}/${clean}` : `${base}/`;
}
