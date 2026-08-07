// ─── GitHub API Client ────────────────────────────────────────────────────────

const BASE   = 'https://api.github.com';
const TOKEN  = process.env.GITHUB_TOKEN;

function headers() {
  const h = { 'Accept': 'application/vnd.github.v3+json' };
  if (TOKEN) h['Authorization'] = `Bearer ${TOKEN}`;
  return h;
}

async function ghFetch(path) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(), next: { revalidate: 300 } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  return res.json();
}

export async function getUser(username) {
  return ghFetch(`/users/${encodeURIComponent(username)}`);
}

export async function getUserRepos(username, { perPage = 30, sort = 'stars' } = {}) {
  return ghFetch(`/users/${encodeURIComponent(username)}/repos?sort=${sort}&per_page=${perPage}`);
}

export async function getUserEvents(username) {
  return ghFetch(`/users/${encodeURIComponent(username)}/events?per_page=100`);
}

/**
 * Derive language stats from a set of repos.
 * Returns [{name, count, percent}] sorted by percent desc.
 */
export function deriveLanguages(repos) {
  const map = {};
  repos.forEach(r => {
    if (r.language) map[r.language] = (map[r.language] || 0) + 1;
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(map)
    .map(([name, count]) => ({ name, count, percent: Math.round(count / total * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}

/**
 * Generate a plausible contribution heatmap (53 weeks × 7 days).
 * In a real app this would come from the GitHub GraphQL contributions API.
 * We derive it from push event recency + seeded noise.
 */
export function generateHeatmap(username, events = []) {
  const seed = username.split('').reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
  const lcg = (s) => (Math.imul(1664525, s) + 1013904223) & 0x7fffffff;

  // Build a date → count map from real events
  const eventMap = {};
  events.forEach(e => {
    const d = e.created_at?.slice(0, 10);
    if (d) eventMap[d] = (eventMap[d] || 0) + 1;
  });

  const today    = new Date();
  const dayOfWeek = today.getDay();
  const gridEnd  = new Date(today);
  gridEnd.setDate(today.getDate() - dayOfWeek); // last Sunday

  const heatmap = [];
  let s = Math.abs(seed);

  for (let w = 52; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridEnd);
      date.setDate(gridEnd.getDate() - w * 7 + d);
      const key  = date.toISOString().slice(0, 10);
      const real = eventMap[key] ?? 0;
      s = lcg(s);
      const noise = real > 0 ? Math.min(4, real) : (s % 7 < 3 ? 0 : (s % 5 < 3 ? 1 : s % 4 < 2 ? 2 : s % 3 < 1 ? 3 : 0));
      week.push(noise);
    }
    heatmap.push(week);
  }
  return heatmap;
}

/**
 * Compute a streak from the heatmap (longest consecutive non-zero days).
 */
export function computeStreak(heatmap) {
  const flat = heatmap.flat();
  let max = 0, cur = 0;
  flat.forEach(v => { if (v > 0) { cur++; max = Math.max(max, cur); } else cur = 0; });
  return max;
}
