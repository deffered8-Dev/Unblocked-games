import { parseIframeSpec } from './registry.js';

/**
 * Controls the active Game Theater stage and mounts the game's iframe safely.
 */
export function createGamePlayer({ onFavoriteToggle, isFavorite }) {
  const section = document.getElementById('player-section');
  const titleEl = document.getElementById('player-title');
  const categoryEl = document.getElementById('player-category');
  const controlsEl = document.getElementById('player-controls');
  const mountEl = document.getElementById('iframe-mount');
  const stageEl = document.getElementById('iframe-stage');
  const favoriteBtn = document.getElementById('player-favorite-btn');
  const favoriteIcon = document.getElementById('player-favorite-icon');
  const favoriteLabel = document.getElementById('player-favorite-label');
  const restartBtn = document.getElementById('player-restart-btn');
  const inspectBtn = document.getElementById('player-inspect-btn');
  const fullscreenBtn = document.getElementById('player-fullscreen-btn');
  const closeBtn = document.getElementById('player-close-btn');
  const jsonDrawer = document.getElementById('player-json-drawer');
  const jsonCode = document.getElementById('player-json-code');
  const copyEntryBtn = document.getElementById('copy-entry-json-btn');

  let activeGame = null;
  let activeIframe = null;

  function syncFavoriteButton() {
    if (!activeGame) return;
    const fav = isFavorite(activeGame.id);
    favoriteLabel.textContent = fav ? 'Favorited' : 'Favorite';
    favoriteIcon.setAttribute('fill', fav ? 'currentColor' : 'none');
    favoriteBtn.classList.toggle('text-amber-300', fav);
    favoriteBtn.classList.toggle('border-amber-500/40', fav);
  }

  function mountGameIframe(game) {
    mountEl.innerHTML = '';
    const spec = parseIframeSpec(game.iframe, game.title);

    if (!spec) {
      const errorBox = document.createElement('div');
      errorBox.className = 'flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center';
      errorBox.innerHTML = `
        <p class="font-display text-lg font-semibold text-slate-100">Invalid iframe configuration</p>
        <p class="mt-1 text-sm text-slate-400">Only valid http, https, or local relative iframe URLs are permitted.</p>
      `;
      mountEl.appendChild(errorBox);
      activeIframe = null;
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = spec.src;
    iframe.title = spec.title;
    iframe.setAttribute('allow', spec.allow);
    if (spec.allowfullscreen) {
      iframe.setAttribute('allowfullscreen', '');
    }
    iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-pointer-lock allow-forms'
    );
    iframe.loading = 'eager';

    mountEl.appendChild(iframe);
    activeIframe = iframe;

    // Move keyboard focus into the game iframe once loaded so arrow keys work immediately
    iframe.addEventListener('load', () => {
      try {
        iframe.focus();
      } catch {
        // Ignore cross-origin focus restrictions
      }
    });
  }

  function openGame(game) {
    activeGame = game;
    titleEl.textContent = game.title;
    categoryEl.textContent = game.category || 'Game';
    controlsEl.textContent = game.controls || 'Keyboard or Mouse';

    const cleanEntry = {
      id: game.id,
      title: game.title,
      category: game.category,
      description: game.description,
      controls: game.controls,
      players: game.players || '1 Player',
      thumbnail: game.thumbnail || '',
      iframe: game.iframe,
    };
    jsonCode.textContent = JSON.stringify(cleanEntry, null, 2);

    syncFavoriteButton();
    mountGameIframe(game);
    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeGame() {
    activeGame = null;
    activeIframe = null;
    mountEl.innerHTML = '';
    jsonDrawer.classList.add('hidden');
    section.classList.add('hidden');
  }

  favoriteBtn.addEventListener('click', () => {
    if (!activeGame) return;
    onFavoriteToggle(activeGame.id);
    syncFavoriteButton();
  });

  restartBtn.addEventListener('click', () => {
    if (!activeGame) return;
    mountGameIframe(activeGame);
  });

  inspectBtn.addEventListener('click', () => {
    jsonDrawer.classList.toggle('hidden');
  });

  fullscreenBtn.addEventListener('click', async () => {
    if (!stageEl) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await stageEl.requestFullscreen();
      }
    } catch {
      if (activeIframe && activeIframe.requestFullscreen) {
        activeIframe.requestFullscreen().catch(() => {});
      }
    }
  });

  closeBtn.addEventListener('click', closeGame);

  copyEntryBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(jsonCode.textContent || '');
      copyEntryBtn.textContent = 'Copied';
      setTimeout(() => {
        copyEntryBtn.textContent = 'Copy JSON';
      }, 1500);
    } catch {
      copyEntryBtn.textContent = 'Copy failed';
    }
  });

  return {
    openGame,
    closeGame,
    syncFavoriteButton,
  };
}
