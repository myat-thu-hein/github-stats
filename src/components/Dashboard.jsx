'use client';

import { useState, useCallback } from 'react';
import styles from './Dashboard.module.css';

const LANG_COLORS = {
  JavaScript:'#F7DF1E', TypeScript:'#3178C6', Python:'#3572A5', Rust:'#DEA584',
  Go:'#00ADD8', Java:'#B07219', C:'#555555', 'C++':'#F34B7D', Ruby:'#CC342D',
  Kotlin:'#7F52FF', Swift:'#F05138', PHP:'#4F5D95', CSS:'#563D7C', HTML:'#E34C26',
  Shell:'#89E051', Lua:'#000080', Dart:'#00B4AB', Scala:'#C22D40',
};

const HEAT_SHADES = ['#161B22','#0E4429','#006D32','#26A641','#39D353'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 3600)   return `${Math.round(diff/60)}m ago`;
  if (diff < 86400)  return `${Math.round(diff/3600)}h ago`;
  if (diff < 2592000)return `${Math.round(diff/86400)}d ago`;
  return `${Math.round(diff/2592000)}mo ago`;
}

export default function Dashboard() {
  const [username, setUsername] = useState('torvalds');
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchData = useCallback(async (user) => {
    if (!user.trim()) return;
    setLoading(true); setError(null); setData(null);
    try {
      const res  = await fetch(`/api/github/${encodeURIComponent(user.trim())}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  function handleSearch() { fetchData(username); }

  const p = data?.profile;
  const s = data?.stats;

  return (
    <div className={styles.container}>
      {/* Search */}
      <div className={styles.searchRow}>
        <div className={styles.searchInputWrap}>
          <span className={styles.atSign}>@</span>
          <input
            className={styles.searchInput}
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="GitHub username"
            aria-label="GitHub username"
          />
        </div>
        <button className={styles.searchBtn} onClick={handleSearch} disabled={loading}>
          {loading ? 'Loading…' : 'Load stats'}
        </button>
        <div className={styles.suggestions}>
          {['torvalds','sindresorhus','gaearon','yyx990803'].map(u => (
            <button key={u} className={styles.suggestBtn} onClick={() => { setUsername(u); fetchData(u); }}>
              {u}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          {error.includes('Not Found') ? `User "${username}" not found.` : error}
          {error.includes('rate limit') && ' Add a GITHUB_TOKEN to .env.local for higher limits.'}
        </div>
      )}

      {loading && <div className={styles.skeleton} />}

      {data && (
        <>
          {/* Profile */}
          <div className={styles.profileCard}>
            <img className={styles.avatar} src={p.avatarUrl} alt={p.login} loading="lazy" />
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{p.name}</div>
              <div className={styles.profileLogin}>@{p.login}</div>
              {p.bio && <div className={styles.profileBio}>{p.bio}</div>}
              <div className={styles.profileMeta}>
                {p.company  && <span>🏢 {p.company}</span>}
                {p.location && <span>📍 {p.location}</span>}
                {p.blog     && <a href={p.blog.startsWith('http') ? p.blog : `https://${p.blog}`} target="_blank" rel="noopener noreferrer" className={styles.blogLink}>{p.blog.replace(/^https?:\/\//, '')}</a>}
              </div>
              <div className={styles.followRow}>
                <span><strong>{fmtNum(p.followers)}</strong> followers</span>
                <span className={styles.followDot}>·</span>
                <span><strong>{fmtNum(p.following)}</strong> following</span>
                <span className={styles.followDot}>·</span>
                <span>joined {new Date(p.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            {[
              ['Repositories', p.publicRepos],
              ['Stars earned', fmtNum(s.totalStars)],
              ['Followers',    fmtNum(p.followers)],
              ['Longest streak', `${s.longestStreak}d`],
            ].map(([label, value]) => (
              <div key={label} className={styles.statCard}>
                <div className={styles.statLabel}>{label}</div>
                <div className={styles.statValue}>{value}</div>
              </div>
            ))}
          </div>

          {/* Languages + Heatmap */}
          <div className={styles.twoCol}>
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Top languages</div>
              {data.languages.length === 0
                ? <p className={styles.emptyMsg}>No language data</p>
                : data.languages.map(l => (
                    <div key={l.name} className={styles.langRow}>
                      <div className={styles.langDot} style={{ background: LANG_COLORS[l.name] ?? '#888780' }} />
                      <span className={styles.langName}>{l.name}</span>
                      <div className={styles.langBarWrap}>
                        <div className={styles.langBar} style={{ width: `${l.percent}%`, background: LANG_COLORS[l.name] ?? '#888780' }} />
                      </div>
                      <span className={styles.langPct}>{l.percent}%</span>
                    </div>
                  ))}
            </div>

            <div className={styles.panel}>
              <div className={styles.panelTitle}>Contribution activity</div>
              <div className={styles.heatmapWrap}>
                <div className={styles.heatmap}>
                  {data.heatmap.map((week, wi) => (
                    <div key={wi} className={styles.heatWeek}>
                      {week.map((val, di) => (
                        <div
                          key={di}
                          className={styles.heatCell}
                          style={{ background: HEAT_SHADES[Math.min(val, 4)] }}
                          title={`${val} contribution${val !== 1 ? 's' : ''}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className={styles.heatLegend}>
                  <span>Less</span>
                  {HEAT_SHADES.map((c, i) => (
                    <div key={i} className={styles.legendCell} style={{ background: c }} />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top repos */}
          <div className={styles.panelTitle} style={{ marginBottom: 8 }}>Top repositories</div>
          <div className={styles.repoGrid}>
            {data.topRepos.map(repo => (
              <a key={repo.fullName} href={repo.url} target="_blank" rel="noopener noreferrer" className={styles.repoCard}>
                <div className={styles.repoName}>{repo.name}</div>
                <div className={styles.repoDesc}>{repo.description || 'No description'}</div>
                <div className={styles.repoMeta}>
                  {repo.language && (
                    <span className={styles.repoLang}>
                      <span className={styles.langDot} style={{ background: LANG_COLORS[repo.language] ?? '#888780', display:'inline-block', marginRight:4, verticalAlign:'middle' }} />
                      {repo.language}
                    </span>
                  )}
                  <span>
                    <span className={styles.metaIcon}>★</span>
                    {fmtNum(repo.stars)}
                  </span>
                  <span>
                    <span className={styles.metaIcon}>⑂</span>
                    {fmtNum(repo.forks)}
                  </span>
                  {repo.updatedAt && <span>{timeAgo(repo.updatedAt)}</span>}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className={styles.emptyState}>
          Enter a GitHub username to load their stats.
        </div>
      )}
    </div>
  );
}
