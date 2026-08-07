# GitHub Stats Dashboard
### Portfolio Project — Day 24

A GitHub profile analytics dashboard with server-side API proxying, contribution heatmap, language breakdown, repository cards, and streak stats. Built with **Next.js 15 App Router**.

---

## Features

- **Profile overview** — avatar, bio, company, location, follow counts
- **Stats grid** — repositories, stars, followers, longest streak
- **Language breakdown** — derived from repo languages with colour dots
- **Contribution heatmap** — 53-week grid (green shades like GitHub)
- **Top repositories** — sorted by stars, click to open on GitHub
- **Rate-limit friendly** — set `GITHUB_TOKEN` for 5000 req/hr vs 60/hr
- **Graceful fallback** — meaningful error messages for 404/rate limit

---

## API Endpoints

| Method | Endpoint                | Description                        |
|--------|-------------------------|------------------------------------|
| GET    | /api/github/:username   | Full profile + repos + stats       |

### Response shape
```json
{
  "success": true,
  "profile": { "login", "name", "bio", "avatarUrl", "followers", ... },
  "stats": { "totalStars", "longestStreak", "totalRepos" },
  "languages": [{ "name", "count", "percent" }],
  "topRepos": [{ "name", "description", "stars", "forks", "language", "url" }],
  "heatmap": [[0,1,2,0,1,3,0], ...]  // 53 weeks × 7 days
}
```

---

## Getting Started

```bash
npm install

# Optional: add a GitHub token for higher rate limits
echo "GITHUB_TOKEN=ghp_your_token" > .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── api/github/[username]/
│   │   └── route.js    # GET — fetch user + repos + events, return aggregated data
│   ├── layout.jsx      # Dark GitHub-inspired theme
│   ├── page.jsx
│   └── globals.css
├── components/
│   ├── Dashboard.jsx   # Search + profile + stats + heatmap + repos
│   └── Dashboard.module.css
└── lib/
    └── github.js       # getUser, getUserRepos, getUserEvents, deriveLanguages, generateHeatmap, computeStreak
```

---

## Key Concepts Demonstrated

- **Server-side API proxy** — GitHub API called from Next.js route handlers, not the browser; keeps token private
- **`Promise.all`** — user + repos + events fetched in parallel for minimum latency
- **`next: { revalidate: 300 }`** — responses cached for 5 minutes via Next.js ISR
- **Language aggregation** — count repos per language, normalise to percentages
- **Heatmap generation** — 53-week × 7-day grid from event timestamps + seeded noise (real contribution API requires GraphQL + OAuth)
- **Streak computation** — scan flat heatmap array for longest consecutive non-zero run

---

*Part of a 30-day CS Portfolio Project series. Week 4: AI, Interpreters & Capstone.*
