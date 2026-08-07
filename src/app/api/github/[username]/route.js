// GET /api/github/:username — full profile + repos + language stats
import { NextResponse } from 'next/server';
import { getUser, getUserRepos, getUserEvents, deriveLanguages, generateHeatmap, computeStreak } from '@/lib/github';

export async function GET(_, { params }) {
  try {
    const { username } = params;
    if (!username?.trim()) {
      return NextResponse.json({ success: false, error: 'Username required' }, { status: 400 });
    }

    const [user, repos, events] = await Promise.all([
      getUser(username),
      getUserRepos(username, { perPage: 30 }).catch(() => []),
      getUserEvents(username).catch(() => []),
    ]);

    const languages  = deriveLanguages(repos);
    const heatmap    = generateHeatmap(username, events);
    const streak     = computeStreak(heatmap);
    const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);

    const topRepos = repos
      .filter(r => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map(r => ({
        name:        r.name,
        fullName:    r.full_name,
        description: r.description ?? '',
        stars:       r.stargazers_count ?? 0,
        forks:       r.forks_count ?? 0,
        language:    r.language ?? null,
        url:         r.html_url,
        updatedAt:   r.updated_at,
      }));

    return NextResponse.json({
      success: true,
      profile: {
        login:       user.login,
        name:        user.name ?? user.login,
        bio:         user.bio ?? '',
        company:     user.company ?? '',
        location:    user.location ?? '',
        blog:        user.blog ?? '',
        avatarUrl:   user.avatar_url,
        htmlUrl:     user.html_url,
        publicRepos: user.public_repos ?? 0,
        publicGists: user.public_gists ?? 0,
        followers:   user.followers ?? 0,
        following:   user.following ?? 0,
        createdAt:   user.created_at,
      },
      stats: {
        totalStars,
        longestStreak: streak,
        totalRepos: repos.length,
      },
      languages,
      topRepos,
      heatmap,
    });
  } catch (err) {
    const status = err.message?.includes('Not Found') ? 404 : err.message?.includes('rate limit') ? 429 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
