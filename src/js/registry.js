const CUSTOM_GAMES_KEY = 'recess_arcade_custom_games_v1';
const FAVORITES_KEY = 'recess_arcade_favorites_v1';
const RECENT_KEY = 'recess_arcade_recent_v1';

/**
 * Validates that a URL string uses a safe scheme (http, https, or local relative path).
 * Rejects javascript:, data:, vbscript:, etc.
 * @param {string} rawUrl
 * @returns {string | null}
 */
export function sanitizeIframeSrc(rawUrl) {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Parses an iframe HTML string (or direct URL) from games.json into safe attributes.
 * Uses DOMParser instead of raw innerHTML injection.
 * @param {string} iframeHtmlOrUrl
 * @param {string} fallbackTitle
 * @returns {{ src: string, title: string, allow: string, allowfullscreen: boolean } | null}
 */
export function parseIframeSpec(iframeHtmlOrUrl, fallbackTitle = 'Game') {
  if (typeof iframeHtmlOrUrl !== 'string') return null;
  const input = iframeHtmlOrUrl.trim();
  if (!input) return null;

  // Allow direct URL input in custom form or JSON convenience
  if (!input.startsWith('<')) {
    const safeSrc = sanitizeIframeSrc(input);
    if (!safeSrc) return null;
    return {
      src: safeSrc,
      title: fallbackTitle,
      allow: 'fullscreen',
      allowfullscreen: true,
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const iframeEl = doc.querySelector('iframe');
  if (!iframeEl) return null;

  const safeSrc = sanitizeIframeSrc(iframeEl.getAttribute('src') || '');
  if (!safeSrc) return null;

  const title = (iframeEl.getAttribute('title') || fallbackTitle).trim();
  const allow = (iframeEl.getAttribute('allow') || 'fullscreen').trim();
  const allowfullscreen =
    iframeEl.hasAttribute('allowfullscreen') ||
    allow.toLowerCase().includes('fullscreen');

  return {
    src: safeSrc,
    title,
    allow,
    allowfullscreen,
  };
}

/**
 * Builds a clean canonical <iframe> tag string for storage in games.json.
 * @param {string} src
 * @param {string} title
 * @returns {string}
 */
export function formatIframeTag(src, title) {
  const escapedSrc = src.replace(/"/g, '&quot;');
  const escapedTitle = title.replace(/"/g, '&quot;');
  return `<iframe src="${escapedSrc}" title="${escapedTitle}" allow="fullscreen" loading="lazy"></iframe>`;
}

/**
 * Fetches /games.json and merges any user-saved custom games from localStorage.
 * @returns {Promise<{ baseGames: Array<any>, customGames: Array<any>, allGames: Array<any> }>}
 */
export async function loadGamesRegistry() {
  const response = await fetch('/games.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch games.json (${response.status})`);
  }
  const baseGames = await response.json();
  if (!Array.isArray(baseGames)) {
    throw new Error('games.json must contain an array of game objects');
  }

  const customGames = getCustomGames();
  const merged = [
    ...baseGames.map((g) => ({ ...g, isCustom: false })),
    ...customGames.map((g) => ({ ...g, isCustom: true })),
  ];

  return {
    baseGames,
    customGames,
    allGames: merged,
  };
}

export function getCustomGames() {
  try {
    const raw = localStorage.getItem(CUSTOM_GAMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomGame(entry) {
  const existing = getCustomGames();
  const updated = [...existing, entry];
  localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(updated));
  return updated;
}

export function clearCustomGames() {
  localStorage.removeItem(CUSTOM_GAMES_KEY);
}

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteId(gameId) {
  const current = new Set(getFavorites());
  if (current.has(gameId)) {
    current.delete(gameId);
  } else {
    current.add(gameId);
  }
  const next = Array.from(current);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function getRecentIds() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentId(gameId) {
  const current = getRecentIds().filter((id) => id !== gameId);
  const next = [gameId, ...current].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

export function clearRecentIds() {
  localStorage.removeItem(RECENT_KEY);
}
