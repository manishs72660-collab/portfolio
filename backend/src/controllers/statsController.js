const { env } = require('../config/env');
const AppError = require('../utils/AppError');

const cacheDurationMs = 5 * 60 * 1000;
let cachedStats;
let cachedAt = 0;

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Upstream service returned ${response.status}`);
  }

  return response.json();
}

function normalizeContributions(contributions) {
  return contributions.map(({ date, count }) => ({
    date,
    count: Number(count) || 0,
  }));
}

async function getGithubStats() {
  const username = encodeURIComponent(env.githubUsername);
  const [profile, calendar] = await Promise.all([
    fetchJson(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'portfolio-stats',
      },
    }),
    fetchJson(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`),
  ]);

  if (!Array.isArray(calendar.contributions)) {
    throw new Error('GitHub contribution data is unavailable');
  }

  return {
    username: profile.login,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    profileUrl: profile.html_url,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    heatmap: {
      total: calendar.contributions.reduce((sum, day) => sum + (Number(day.count) || 0), 0),
      contributions: normalizeContributions(calendar.contributions),
    },
  };
}

async function getLeetCodeStats() {
  const query = `
    query userStats($username: String!, $year: Int!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        userCalendar(year: $year) {
          streak
          totalActiveDays
          submissionCalendar
        }
      }
    }
  `;

  const result = await fetchJson('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: `https://leetcode.com/${env.leetcodeUsername}/`,
      'User-Agent': 'Mozilla/5.0 portfolio-stats',
    },
    body: JSON.stringify({
      query,
      variables: {
        username: env.leetcodeUsername,
        year: new Date().getUTCFullYear(),
      },
    }),
  });

  if (result.errors?.length) {
    throw new Error('LeetCode profile data is unavailable');
  }

  const user = result.data?.matchedUser;
  const calendar = user?.userCalendar;
  if (!user || !calendar) {
    throw new Error('LeetCode profile was not found');
  }

  let submissionCalendar;
  try {
    submissionCalendar = typeof calendar.submissionCalendar === 'string'
      ? JSON.parse(calendar.submissionCalendar)
      : calendar.submissionCalendar;
  } catch {
    throw new Error('LeetCode submission calendar is invalid');
  }

  const contributions = Object.entries(submissionCalendar || {})
    .map(([timestamp, count]) => ({
      date: new Date(Number(timestamp) * 1000).toISOString().slice(0, 10),
      count: Number(count) || 0,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
  const accepted = user.submitStats.acSubmissionNum;
  const all = accepted.find(({ difficulty }) => difficulty === 'All');

  return {
    username: user.username,
    profileUrl: `https://leetcode.com/${encodeURIComponent(user.username)}/`,
    ranking: user.profile.ranking,
    solved: all?.count || 0,
    submissions: all?.submissions || 0,
    difficulty: Object.fromEntries(
      accepted
        .filter(({ difficulty }) => difficulty !== 'All')
        .map(({ difficulty, count }) => [difficulty.toLowerCase(), count]),
    ),
    streak: calendar.streak,
    activeDays: calendar.totalActiveDays,
    heatmap: {
      total: contributions.reduce((sum, day) => sum + day.count, 0),
      contributions,
    },
  };
}

async function loadProfile(name, getStats) {
  try {
    return await getStats();
  } catch (error) {
    console.error(`Unable to load ${name} stats:`, error.message);
    return { error: `Unable to load ${name} data right now.` };
  }
}

async function getCodingStats(req, res) {
  if (cachedStats && Date.now() - cachedAt < cacheDurationMs) {
    return res.json({ success: true, data: cachedStats });
  }

  const [github, leetcode] = await Promise.all([
    loadProfile('GitHub', getGithubStats),
    loadProfile('LeetCode', getLeetCodeStats),
  ]);

  if (github.error && leetcode.error) {
    throw new AppError('Unable to load coding profile data right now', 502);
  }

  const data = { github, leetcode };
  if (!github.error && !leetcode.error) {
    cachedStats = data;
    cachedAt = Date.now();
  }

  res.json({ success: true, data });
}

module.exports = { getCodingStats };
