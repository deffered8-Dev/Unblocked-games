import {
  clearCustomGames,
  clearRecentIds,
  formatIframeTag,
  getFavorites,
  getRecentIds,
  loadGamesRegistry,
  parseIframeSpec,
  pushRecentId,
  saveCustomGame,
  toggleFavoriteId,
} from './registry.js';
import { createGamePlayer } from './player.js';

const state = {
  games: [],
  favorites: getFavorites(),
  recentIds: getRecentIds(),
  activeCategory: 'All',
  searchQuery: '',
};

const dom = {
  grid: document.getElementById('games-grid'),
  tabs: document.getElementById('category-tabs'),
  searchInput: document.getElementById('search-input'),
  statusBox: document.getElementById('catalog-status'),
  statusTitle: document.getElementById('catalog-status-title'),
  statusBody: document.getElementById('catalog-status-body'),
  resetFiltersBtn: document.getElementById('reset-filters-btn'),
  recentStrip: document.getElementById('recent-strip'),
  recentList: document.getElementById('recent-list'),
  clearRecentBtn: document.getElementById('clear-recent-btn'),
  statTotalGames: document.getElementById('stat-total-games'),
  statTotalCategories: document.getElementById('stat-total-categories'),
  statTotalFavorites: document.getElementById('stat-total-favorites'),
  statTotalCustom: document.getElementById('stat-total-custom'),
  randomGameBtn: document.getElementById('random-game-btn'),
  heroPlayBtn: document.getElementById('hero-play-featured-btn'),
  navFavoritesBtn: document.getElementById('nav-favorites-btn'),
  registryPreview: document.getElementById('registry-json-preview'),
  addGameForm: document.getElementById('add-game-form'),
  titleInput: document.getElementById('game-title-input'),
  categoryInput: document.getElementById('game-category-input'),
  controlsInput: document.getElementById('game-controls-input'),
  iframeInput: document.getElementById('game-iframe-input'),
  formFeedback: document.getElementById('form-feedback'),
  clearCustomBtn: document.getElementById('clear-custom-btn'),
  copyAllJsonBtn: document.getElementById('copy-all-json-btn'),
  downloadJsonBtn: document.getElementById('download-json-btn'),
};

const player = createGamePlayer({
  onFavoriteToggle: handleFavoriteToggle,
  isFavorite: (id) => state.favorites.includes(id),
});

function handleFavoriteToggle(gameId) {
  state.favorites = toggleFavoriteId(gameId);
  updateStats();
  renderGrid();
}

function launchGameById(gameId) {
  const game = state.games.find((g) => g.id === gameId);
  if (!game) return;
  state.recentIds = pushRecentId(game.id);
  renderRecentStrip();
  player.openGame(game);
}

/**
 * Generates clean bespoke SVG artwork for games without raster cover images,
 * and also serves as fallback if an image fails to load.
 */
function buildVectorThumbnail(game) {
  const id = game.id || '';
  if (id === 'tile-2048') {
    return `
      <svg viewBox="0 0 320 240" class="h-full w-full" aria-hidden="true">
        <rect width="320" height="240" fill="#181b22"/>
        <rect x="64" y="24" width="192" height="192" rx="12" fill="#232730" stroke="rgba(255,255,255,0.08)"/>
        <rect x="76" y="36" width="38" height="38" rx="6" fill="#334155"/><text x="95" y="61" text-anchor="middle" fill="#e2e8f0" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">4</text>
        <rect x="120" y="36" width="38" height="38" rx="6" fill="#475569"/><text x="139" y="61" text-anchor="middle" fill="#f8fafc" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">16</text>
        <rect x="164" y="36" width="38" height="38" rx="6" fill="#d97706"/><text x="183" y="61" text-anchor="middle" fill="#fffbeb" font-family="JetBrains Mono, monospace" font-size="15" font-weight="700">64</text>
        <rect x="208" y="36" width="38" height="38" rx="6" fill="#2d333f"/>
        <rect x="76" y="80" width="38" height="38" rx="6" fill="#2d333f"/>
        <rect x="120" y="80" width="38" height="38" rx="6" fill="#b45309"/><text x="139" y="105" text-anchor="middle" fill="#fffbeb" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700">128</text>
        <rect x="164" y="80" width="38" height="38" rx="6" fill="#f59e0b"/><text x="183" y="105" text-anchor="middle" fill="#0f172a" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700">512</text>
        <rect x="208" y="80" width="38" height="38" rx="6" fill="#475569"/><text x="227" y="105" text-anchor="middle" fill="#f8fafc" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">32</text>
        <rect x="76" y="124" width="38" height="38" rx="6" fill="#334155"/><text x="95" y="149" text-anchor="middle" fill="#e2e8f0" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">2</text>
        <rect x="120" y="124" width="38" height="38" rx="6" fill="#fbbf24"/><text x="139" y="149" text-anchor="middle" fill="#0f172a" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">2048</text>
        <rect x="164" y="124" width="38" height="38" rx="6" fill="#334155"/><text x="183" y="149" text-anchor="middle" fill="#e2e8f0" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">8</text>
        <rect x="208" y="124" width="38" height="38" rx="6" fill="#2d333f"/>
        <rect x="76" y="168" width="38" height="38" rx="6" fill="#2d333f"/>
        <rect x="120" y="168" width="38" height="38" rx="6" fill="#475569"/><text x="139" y="193" text-anchor="middle" fill="#f8fafc" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">16</text>
        <rect x="164" y="168" width="38" height="38" rx="6" fill="#2d333f"/>
        <rect x="208" y="168" width="38" height="38" rx="6" fill="#334155"/><text x="227" y="193" text-anchor="middle" fill="#e2e8f0" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">4</text>
      </svg>
    `;
  }

  if (id === 'mine-grid') {
    return `
      <svg viewBox="0 0 320 240" class="h-full w-full" aria-hidden="true">
        <rect width="320" height="240" fill="#181b22"/>
        <g transform="translate(70,30)">
          <rect width="180" height="180" rx="10" fill="#232730" stroke="rgba(255,255,255,0.08)"/>
          <g transform="translate(12,12)">
            <rect x="0" y="0" width="34" height="34" rx="4" fill="#161920"/><text x="17" y="23" text-anchor="middle" fill="#60a5fa" font-family="JetBrains Mono, monospace" font-size="15" font-weight="700">1</text>
            <rect x="40" y="0" width="34" height="34" rx="4" fill="#161920"/><text x="57" y="23" text-anchor="middle" fill="#34d399" font-family="JetBrains Mono, monospace" font-size="15" font-weight="700">2</text>
            <rect x="80" y="0" width="34" height="34" rx="4" fill="#334155"/><path d="M92 10 L92 26 M92 10 L105 15 L92 20" stroke="#f59e0b" fill="#f59e0b" stroke-width="2"/>
            <rect x="120" y="0" width="34" height="34" rx="4" fill="#334155"/>
            <rect x="0" y="40" width="34" height="34" rx="4" fill="#161920"/>
            <rect x="40" y="40" width="34" height="34" rx="4" fill="#161920"/><text x="57" y="63" text-anchor="middle" fill="#f87171" font-family="JetBrains Mono, monospace" font-size="15" font-weight="700">3</text>
            <rect x="80" y="40" width="34" height="34" rx="4" fill="#161920"/><text x="97" y="63" text-anchor="middle" fill="#60a5fa" font-family="JetBrains Mono, monospace" font-size="15" font-weight="700">1</text>
            <rect x="120" y="40" width="34" height="34" rx="4" fill="#334155"/>
            <rect x="0" y="80" width="34" height="34" rx="4" fill="#161920"/><text x="17" y="103" text-anchor="middle" fill="#60a5fa" font-family="JetBrains Mono, monospace" font-size="15" font-weight="700">1</text>
            <rect x="40" y="80" width="34" height="34" rx="4" fill="#334155"/><path d="M52 90 L52 106 M52 90 L65 95 L52 100" stroke="#f59e0b" fill="#f59e0b" stroke-width="2"/>
            <rect x="80" y="80" width="34" height="34" rx="4" fill="#161920"/><text x="97" y="103" text-anchor="middle" fill="#34d399" font-family="JetBrains Mono, monospace" font-size="15" font-weight="700">2</text>
            <rect x="120" y="80" width="34" height="34" rx="4" fill="#334155"/>
            <rect x="0" y="120" width="34" height="34" rx="4" fill="#334155"/>
            <rect x="40" y="120" width="34" height="34" rx="4" fill="#334155"/>
            <rect x="80" y="120" width="34" height="34" rx="4" fill="#161920"/><text x="97" y="143" text-anchor="middle" fill="#60a5fa" font-family="JetBrains Mono, monospace" font-size="15" font-weight="700">1</text>
            <rect x="120" y="120" width="34" height="34" rx="4" fill="#161920"/>
          </g>
        </g>
      </svg>
    `;
  }

  if (id === 'paddle-duel') {
    return `
      <svg viewBox="0 0 320 240" class="h-full w-full" aria-hidden="true">
        <rect width="320" height="240" fill="#161920"/>
        <rect x="24" y="24" width="272" height="192" rx="8" fill="#111318" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
        <line x1="160" y1="32" x2="160" y2="208" stroke="rgba(255,255,255,0.18)" stroke-width="2" stroke-dasharray="6 6"/>
        <rect x="40" y="64" width="10" height="58" rx="5" fill="#f8fafc"/>
        <rect x="270" y="114" width="10" height="58" rx="5" fill="#f59e0b"/>
        <circle cx="196" cy="96" r="8" fill="#fbbf24"/>
        <text x="128" y="64" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="JetBrains Mono, monospace" font-size="22" font-weight="600">04</text>
        <text x="192" y="64" text-anchor="middle" fill="rgba(245,158,11,0.75)" font-family="JetBrains Mono, monospace" font-size="22" font-weight="600">06</text>
      </svg>
    `;
  }

  if (id === 'pair-match') {
    return `
      <svg viewBox="0 0 320 240" class="h-full w-full" aria-hidden="true">
        <rect width="320" height="240" fill="#181b22"/>
        <g transform="translate(56,36)">
          <rect x="0" y="0" width="46" height="72" rx="7" fill="#232730" stroke="rgba(255,255,255,0.12)"/>
          <circle cx="23" cy="36" r="11" fill="none" stroke="#f59e0b" stroke-width="3"/>
          <rect x="54" y="0" width="46" height="72" rx="7" fill="#2d333f" stroke="rgba(255,255,255,0.08)"/>
          <path d="M77 24 L89 36 L77 48 L65 36 Z" fill="#38bdf8" opacity="0.25"/>
          <rect x="108" y="0" width="46" height="72" rx="7" fill="#232730" stroke="#f59e0b" stroke-opacity="0.6"/>
          <circle cx="131" cy="36" r="11" fill="none" stroke="#f59e0b" stroke-width="3"/>
          <rect x="162" y="0" width="46" height="72" rx="7" fill="#2d333f" stroke="rgba(255,255,255,0.08)"/>
          <rect x="0" y="84" width="46" height="72" rx="7" fill="#2d333f" stroke="rgba(255,255,255,0.08)"/>
          <rect x="54" y="84" width="46" height="72" rx="7" fill="#232730" stroke="rgba(255,255,255,0.12)"/>
          <polygon points="77,108 89,130 65,130" fill="#34d399"/>
          <rect x="108" y="84" width="46" height="72" rx="7" fill="#2d333f" stroke="rgba(255,255,255,0.08)"/>
          <rect x="162" y="84" width="46" height="72" rx="7" fill="#232730" stroke="rgba(255,255,255,0.12)"/>
          <polygon points="185,108 197,130 173,130" fill="#34d399"/>
        </g>
      </svg>
    `;
  }

  // Generic crisp fallback for custom games without a thumbnail
  return `
    <svg viewBox="0 0 320 240" class="h-full w-full" aria-hidden="true">
      <rect width="320" height="240" fill="#181b22"/>
      <rect x="44" y="40" width="232" height="160" rx="12" fill="#232730" stroke="rgba(255,255,255,0.1)"/>
      <polygon points="148,100 184,120 148,140" fill="#f59e0b"/>
      <rect x="64" y="176" width="84" height="6" rx="3" fill="rgba(255,255,255,0.12)"/>
    </svg>
  `;
}

function updateStats() {
  const categories = new Set(state.games.map((g) => g.category).filter(Boolean));
  const customCount = state.games.filter((g) => g.isCustom).length;

  dom.statTotalGames.textContent = String(state.games.length);
  dom.statTotalCategories.textContent = String(categories.size);
  dom.statTotalFavorites.textContent = String(state.favorites.length);
  dom.statTotalCustom.textContent = String(customCount);
}

function renderCategoryTabs() {
  const categories = ['All', ...new Set(state.games.map((g) => g.category).filter(Boolean)), 'Favorites'];
  dom.tabs.innerHTML = '';

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'tab';
    const isActive = state.activeCategory === cat;
    btn.setAttribute('aria-selected', String(isActive));
    btn.textContent = cat;
    btn.className = `px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      isActive
        ? 'bg-amber-500 text-slate-950 font-semibold'
        : 'text-slate-300 hover:text-white hover:bg-white/5'
    }`;

    btn.addEventListener('click', () => {
      state.activeCategory = cat;
      renderCategoryTabs();
      renderGrid();
    });

    dom.tabs.appendChild(btn);
  });
}

function renderRecentStrip() {
  const recentGames = state.recentIds
    .map((id) => state.games.find((g) => g.id === id))
    .filter(Boolean);

  if (recentGames.length === 0) {
    dom.recentStrip.classList.add('hidden');
    return;
  }

  dom.recentStrip.classList.remove('hidden');
  dom.recentList.innerHTML = '';

  recentGames.forEach((game) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#1A1D24] px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-amber-500/40 hover:text-white whitespace-nowrap shrink-0 cursor-pointer';
    btn.innerHTML = `
      <span>${escapeHtml(game.title)}</span>
      <span class="text-slate-500" aria-hidden="true">·</span>
      <span class="text-slate-400">${escapeHtml(game.category)}</span>
    `;
    btn.addEventListener('click', () => launchGameById(game.id));
    dom.recentList.appendChild(btn);
  });
}

function getFilteredGames() {
  const query = state.searchQuery.trim().toLowerCase();

  return state.games.filter((game) => {
    if (state.activeCategory === 'Favorites') {
      if (!state.favorites.includes(game.id)) return false;
    } else if (state.activeCategory !== 'All') {
      if (game.category !== state.activeCategory) return false;
    }

    if (!query) return true;
    const haystack = `${game.title} ${game.category} ${game.description || ''}`.toLowerCase();
    return haystack.includes(query);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderGrid() {
  const filtered = getFilteredGames();
  dom.grid.innerHTML = '';

  if (filtered.length === 0) {
    dom.statusBox.classList.remove('hidden');
    dom.statusTitle.textContent =
      state.activeCategory === 'Favorites'
        ? 'No favorite games saved yet'
        : 'No matching games found';
    dom.statusBody.textContent =
      state.activeCategory === 'Favorites'
        ? 'Star any game from the catalog or active stage to pin it here.'
        : 'Try clearing your search query or switching back to all categories.';
    dom.resetFiltersBtn.classList.remove('hidden');
    return;
  }

  dom.statusBox.classList.add('hidden');
  dom.resetFiltersBtn.classList.add('hidden');

  filtered.forEach((game) => {
    const isFav = state.favorites.includes(game.id);
    const card = document.createElement('article');
    card.className =
      'game-card group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1A1D24] hover:border-amber-500/40';

    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'relative aspect-[4/3] w-full overflow-hidden bg-[#151820]';

    if (game.thumbnail) {
      const img = document.createElement('img');
      img.src = game.thumbnail;
      img.alt = `${game.title} cover artwork`;
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.className = 'h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]';
      img.addEventListener('error', () => {
        mediaWrapper.innerHTML = buildVectorThumbnail(game);
      });
      mediaWrapper.appendChild(img);
    } else {
      mediaWrapper.innerHTML = buildVectorThumbnail(game);
    }

    // Subtle scrim at bottom of thumbnail for crisp favorite button contrast
    const favButton = document.createElement('button');
    favButton.type = 'button';
    favButton.setAttribute('aria-label', isFav ? `Remove ${game.title} from favorites` : `Save ${game.title} to favorites`);
    favButton.className = `absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#111318]/85 backdrop-blur-sm transition-colors hover:border-amber-400 cursor-pointer ${
      isFav ? 'text-amber-400' : 'text-slate-300 hover:text-white'
    }`;
    favButton.innerHTML = `
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `;
    favButton.addEventListener('click', (e) => {
      e.stopPropagation();
      handleFavoriteToggle(game.id);
      player.syncFavoriteButton();
    });
    mediaWrapper.appendChild(favButton);

    const body = document.createElement('div');
    body.className = 'flex flex-1 flex-col justify-between p-5';
    body.innerHTML = `
      <div>
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span>${escapeHtml(game.category || 'Arcade')}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(game.players || '1 Player')}</span>
          ${game.isCustom ? '<span aria-hidden="true">·</span><span class="text-amber-400">Custom</span>' : ''}
        </div>
        <h3 class="mt-1.5 font-display text-lg font-bold text-slate-50 truncate">${escapeHtml(game.title)}</h3>
        <p class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-400">${escapeHtml(game.description || '')}</p>
      </div>
      <div class="mt-5 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
        <span class="truncate text-xs text-slate-400">${escapeHtml(game.controls || 'Keyboard / Mouse')}</span>
        <button
          type="button"
          class="play-card-btn inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Play</span>
        </button>
      </div>
    `;

    card.addEventListener('click', () => launchGameById(game.id));
    const playBtn = body.querySelector('.play-card-btn');
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      launchGameById(game.id);
    });

    card.appendChild(mediaWrapper);
    card.appendChild(body);
    dom.grid.appendChild(card);
  });
}

function renderRegistryPreview() {
  const cleanList = state.games.map(({ isCustom, ...rest }) => rest);
  dom.registryPreview.textContent = JSON.stringify(cleanList, null, 2);
}

function showFormFeedback(message, isError = false) {
  dom.formFeedback.textContent = message;
  dom.formFeedback.className = `text-xs ${isError ? 'text-rose-400' : 'text-emerald-400'}`;
  dom.formFeedback.classList.remove('hidden');
}

async function init() {
  dom.statusBox.classList.remove('hidden');
  dom.statusTitle.textContent = 'Loading games.json...';
  dom.statusBody.textContent = 'Reading the iframe game registry.';

  try {
    const { allGames } = await loadGamesRegistry();
    state.games = allGames;
    updateStats();
    renderCategoryTabs();
    renderRecentStrip();
    renderGrid();
    renderRegistryPreview();
  } catch (err) {
    dom.statusBox.classList.remove('hidden');
    dom.statusTitle.textContent = 'Unable to load games.json';
    dom.statusBody.textContent = err instanceof Error ? err.message : 'Check that /public/games.json exists.';
  }
}

// Event Listeners
dom.searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  renderGrid();
});

dom.resetFiltersBtn.addEventListener('click', () => {
  state.activeCategory = 'All';
  state.searchQuery = '';
  dom.searchInput.value = '';
  renderCategoryTabs();
  renderGrid();
});

dom.navFavoritesBtn.addEventListener('click', () => {
  state.activeCategory = 'Favorites';
  renderCategoryTabs();
  renderGrid();
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
});

dom.randomGameBtn.addEventListener('click', () => {
  if (state.games.length === 0) return;
  const pick = state.games[Math.floor(Math.random() * state.games.length)];
  launchGameById(pick.id);
});

dom.heroPlayBtn.addEventListener('click', () => {
  if (state.games.length === 0) return;
  const featured = state.games.find((g) => g.featured) || state.games[0];
  launchGameById(featured.id);
});

dom.clearRecentBtn.addEventListener('click', () => {
  clearRecentIds();
  state.recentIds = [];
  renderRecentStrip();
});

dom.addGameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = dom.titleInput.value.trim();
  const category = dom.categoryInput.value;
  const controls = dom.controlsInput.value.trim() || 'Keyboard or Mouse';
  const rawIframe = dom.iframeInput.value.trim();

  const parsed = parseIframeSpec(rawIframe, title);
  if (!parsed) {
    showFormFeedback(
      'Enter a valid <iframe src="..."> tag or a safe http/https/local game URL.',
      true
    );
    return;
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const id = `${slug || 'custom-game'}-${Date.now().toString(36).slice(-4)}`;

  const entry = {
    id,
    title,
    category,
    description: `Custom iframe entry pointing to ${parsed.src}`,
    controls,
    players: '1 Player',
    featured: false,
    thumbnail: '',
    iframe: formatIframeTag(parsed.src, title),
  };

  saveCustomGame(entry);
  state.games = [...state.games, { ...entry, isCustom: true }];
  updateStats();
  renderCategoryTabs();
  renderGrid();
  renderRegistryPreview();

  dom.addGameForm.reset();
  showFormFeedback(`Added "${title}" to the registry and launched preview.`);
  launchGameById(entry.id);
});

dom.clearCustomBtn.addEventListener('click', async () => {
  clearCustomGames();
  const { allGames } = await loadGamesRegistry();
  state.games = allGames;
  updateStats();
  renderCategoryTabs();
  renderGrid();
  renderRegistryPreview();
  showFormFeedback('Cleared custom browser games.');
});

dom.copyAllJsonBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(dom.registryPreview.textContent || '');
    dom.copyAllJsonBtn.textContent = 'Copied';
    setTimeout(() => {
      dom.copyAllJsonBtn.textContent = 'Copy JSON';
    }, 1500);
  } catch {
    dom.copyAllJsonBtn.textContent = 'Copy failed';
  }
});

dom.downloadJsonBtn.addEventListener('click', () => {
  const blob = new Blob([dom.registryPreview.textContent || '[]'], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'games.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

init();
