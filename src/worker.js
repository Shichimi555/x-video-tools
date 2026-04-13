const HTML = /* html */`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XVAULT — X Video Extractor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg:       #0a0908;
      --surface:  #141210;
      --surface2: #1e1c18;
      --border:   #2d2820;
      --border2:  #3d3428;
      --gold:     #c9a44a;
      --gold-lt:  #e8c878;
      --gold-dk:  #7a5c20;
      --text:     #d8cfc0;
      --text-dim: #6b6258;
      --white:    #f0ede8;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
    }

    /* Grain overlay */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
      opacity: 0.04;
      pointer-events: none;
      z-index: 9998;
    }

    /* Film strips */
    .film-strip {
      position: fixed;
      left: 0; right: 0;
      height: 20px;
      background: var(--surface);
      z-index: 100;
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 0 8px;
    }
    .film-strip.top    { top: 0;    border-bottom: 1px solid var(--border); }
    .film-strip.bottom { bottom: 0; border-top:    1px solid var(--border); }

    .film-hole {
      width: 10px;
      min-width: 10px;
      height: 10px;
      border-radius: 2px;
      background: var(--bg);
    }

    /* Layout */
    .spacer { height: 20px; }
    .container { max-width: 680px; margin: 0 auto; padding: 0 24px; }

    /* Header */
    header { padding: 72px 0 56px; text-align: center; }

    .eyebrow {
      font-size: 10px;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: var(--gold-dk);
      margin-bottom: 16px;
    }

    .logo {
      font-family: 'Playfair Display', serif;
      font-size: clamp(3rem, 8vw, 5rem);
      font-weight: 700;
      color: var(--white);
      line-height: 1;
      letter-spacing: 0.05em;
      margin-bottom: 20px;
    }

    .logo .x { color: var(--gold); font-style: italic; }

    .divider {
      width: 48px; height: 1px;
      background: var(--gold);
      margin: 20px auto;
    }

    .tagline {
      font-size: 11px;
      letter-spacing: 0.3em;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    /* Input section */
    .input-section { margin-bottom: 40px; }

    .input-label {
      display: block;
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 10px;
    }

    .input-row { display: flex; gap: 10px; }

    .url-input {
      flex: 1;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 13px 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      min-width: 0;
    }

    .url-input::placeholder { color: var(--text-dim); }

    .url-input:focus {
      border-color: var(--gold-dk);
      box-shadow: 0 0 0 2px rgba(201,164,74,0.08);
    }

    .extract-btn {
      background: var(--gold);
      border: none;
      border-radius: 4px;
      padding: 13px 22px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--bg);
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      white-space: nowrap;
    }

    .extract-btn:hover:not(:disabled) { background: var(--gold-lt); }
    .extract-btn:active:not(:disabled) { transform: scale(0.98); }
    .extract-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    @keyframes pulse-btn {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.55; }
    }
    .extract-btn.loading { animation: pulse-btn 1.2s ease-in-out infinite; }

    /* Cards */
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .result-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
      display: none;
      margin-bottom: 24px;
    }
    .result-card.visible { display: block; animation: slide-in 0.35s ease; }

    .error-card {
      background: var(--surface);
      border: 1px solid rgba(192,57,43,0.4);
      border-radius: 6px;
      padding: 14px 18px;
      font-size: 12px;
      color: #e07060;
      display: none;
      margin-bottom: 24px;
    }
    .error-card.visible { display: block; animation: slide-in 0.35s ease; }

    /* Card internals */
    .card-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
    }

    .author-badge { font-size: 12px; font-weight: 600; color: var(--gold); letter-spacing: 0.06em; }
    .author-badge::before { content: '@'; color: var(--text-dim); }

    .tweet-text {
      padding: 12px 18px;
      font-size: 12px;
      color: var(--text-dim);
      line-height: 1.6;
      border-bottom: 1px solid var(--border);
    }

    .player-wrap { background: #000; aspect-ratio: 16/9; }
    .player-wrap video { width: 100%; height: 100%; display: block; }

    .quality-row {
      padding: 10px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .quality-label {
      font-size: 10px;
      letter-spacing: 0.2em;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    .quality-btn {
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: 3px;
      padding: 4px 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--text-dim);
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }

    .quality-btn:hover, .quality-btn.active {
      border-color: var(--gold-dk);
      color: var(--gold-lt);
    }

    .url-row {
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .url-display {
      flex: 1;
      font-size: 11px;
      color: var(--text-dim);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .copy-btn, .dl-btn {
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: 3px;
      padding: 5px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.04em;
      color: var(--text-dim);
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
      transition: border-color 0.15s, color 0.15s;
    }

    .copy-btn:hover, .dl-btn:hover {
      border-color: var(--gold-dk);
      color: var(--gold-lt);
    }

    .copy-btn.copied { color: var(--gold); border-color: var(--gold-dk); }

    /* Footer */
    footer {
      padding: 40px 0 80px;
      text-align: center;
      font-size: 10px;
      letter-spacing: 0.2em;
      color: var(--text-dim);
      text-transform: uppercase;
    }
  </style>
</head>
<body>

<div class="film-strip top"  id="filmTop"></div>
<div class="film-strip bottom" id="filmBot"></div>

<div class="spacer"></div>
<div class="container">

  <header>
    <p class="eyebrow">Video Extraction Tool</p>
    <h1 class="logo"><span class="x">X</span>VAULT</h1>
    <div class="divider"></div>
    <p class="tagline">Extract &middot; Preview &middot; Download</p>
  </header>

  <section class="input-section">
    <label class="input-label" for="urlInput">Post URL</label>
    <div class="input-row">
      <input id="urlInput" type="url" class="url-input"
             placeholder="https://x.com/username/status/..."
             autocomplete="off" spellcheck="false">
      <button id="extractBtn" class="extract-btn">Extract</button>
    </div>
  </section>

  <div id="errorCard" class="error-card"></div>

  <div id="resultCard" class="result-card">
    <div class="card-header">
      <span class="author-badge" id="authorBadge"></span>
    </div>
    <p class="tweet-text" id="tweetText"></p>
    <div class="player-wrap">
      <video id="videoPlayer" controls playsinline></video>
    </div>
    <div class="quality-row" id="qualityRow">
      <span class="quality-label">Quality</span>
    </div>
    <div class="url-row">
      <span class="url-display" id="urlDisplay"></span>
      <button class="copy-btn" id="copyBtn">Copy URL</button>
      <a class="dl-btn" id="dlBtn" target="_blank" rel="noopener">Download</a>
    </div>
  </div>

  <footer>XVAULT &mdash; X Video Extractor</footer>
</div>
<div class="spacer"></div>

<script>
(function () {
  // Film strip holes
  function fillHoles(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const n = Math.ceil(window.innerWidth / 24) + 4;
    el.innerHTML = Array(n).fill('<div class="film-hole"></div>').join('');
  }
  fillHoles('filmTop');
  fillHoles('filmBot');

  const urlInput   = document.getElementById('urlInput');
  const extractBtn = document.getElementById('extractBtn');
  const errorCard  = document.getElementById('errorCard');
  const resultCard = document.getElementById('resultCard');
  const authorBadge = document.getElementById('authorBadge');
  const tweetText  = document.getElementById('tweetText');
  const videoPlayer = document.getElementById('videoPlayer');
  const qualityRow = document.getElementById('qualityRow');
  const urlDisplay = document.getElementById('urlDisplay');
  const copyBtn    = document.getElementById('copyBtn');
  const dlBtn      = document.getElementById('dlBtn');

  let videos = [];
  let currentUrl = '';

  function showError(msg) {
    errorCard.textContent = msg;
    errorCard.classList.add('visible');
    resultCard.classList.remove('visible');
  }

  function setSource(url) {
    currentUrl = url;
    videoPlayer.src = url;
    urlDisplay.textContent = url;
    dlBtn.href = url;
    dlBtn.setAttribute('download', 'xvault-video.mp4');
  }

  function renderQualities() {
    [...qualityRow.querySelectorAll('.quality-btn')].forEach(b => b.remove());
    videos.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'quality-btn' + (i === 0 ? ' active' : '');
      btn.textContent = v.width + 'p \u00b7 ' + Math.round(v.bitrate / 1000) + 'k';
      btn.addEventListener('click', () => {
        qualityRow.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setSource(v.url);
      });
      qualityRow.appendChild(btn);
    });
  }

  async function doExtract() {
    const url = urlInput.value.trim();
    if (!url) return;

    errorCard.classList.remove('visible');
    extractBtn.classList.add('loading');
    extractBtn.disabled = true;
    extractBtn.textContent = 'Extracting...';

    try {
      const res  = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetUrl: url })
      });
      const data = await res.json();

      if (!res.ok) { showError(data.error || 'Extraction failed'); return; }
      if (!data.videos || data.videos.length === 0) {
        showError('No video found in this post.');
        return;
      }

      videos = data.videos;
      authorBadge.textContent = data.author;
      tweetText.textContent = data.text.length > 140
        ? data.text.slice(0, 137) + '...' : data.text;

      setSource(videos[0].url);
      renderQualities();
      resultCard.classList.add('visible');

    } catch {
      showError('Network error. Please try again.');
    } finally {
      extractBtn.classList.remove('loading');
      extractBtn.disabled = false;
      extractBtn.textContent = 'Extract';
    }
  }

  extractBtn.addEventListener('click', doExtract);
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') doExtract(); });

  copyBtn.addEventListener('click', async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      copyBtn.classList.add('copied');
      copyBtn.textContent = 'Copied!';
    } catch {
      copyBtn.textContent = 'Failed';
    }
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.textContent = 'Copy URL';
    }, 2000);
  });
})();
</script>
</body>
</html>`;

/**
 * XのポストURLからユーザー名とツイートIDを抽出する。
 * @param {string|null|undefined} url
 * @returns {{ username: string, tweetId: string } | null}
 */
export function extractTweetInfo(url) {
  const match = (url || '').match(/(?:x\.com|twitter\.com)\/([^/?#]+)\/status\/(\d+)/);
  if (!match) return null;
  return { username: match[1], tweetId: match[2] };
}

/**
 * fxtwitter APIレスポンスからMP4バリアントをビットレート降順で返す。
 * @param {object|null} fxData
 * @returns {Array<{ url: string, bitrate: number, width: number, height: number, type: string }>}
 */
export function formatVideos(fxData) {
  const videos = fxData?.tweet?.media?.videos;
  if (!videos) return [];
  return videos
    .flatMap(v =>
      (v.variants || [])
        .filter(variant => variant.type === 'video/mp4')
        .map(variant => ({
          url: variant.url,
          bitrate: variant.bitrate,
          width: v.width,
          height: v.height,
          type: variant.type
        }))
    )
    .sort((a, b) => b.bitrate - a.bitrate);
}

// ─── ユーティリティ ───────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function jsonError(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ─── API ハンドラー ───────────────────────────────────────────

async function handleExtract(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { tweetUrl } = body;
  if (!tweetUrl) return jsonError('tweetUrl is required', 400);

  const info = extractTweetInfo(tweetUrl);
  if (!info) return jsonError('Invalid tweet URL', 400);

  let fxRes;
  try {
    fxRes = await fetch(
      `https://api.fxtwitter.com/${info.username}/status/${info.tweetId}`,
      { headers: { 'User-Agent': 'xvault/1.0' } }
    );
  } catch {
    return jsonError('Failed to reach fxtwitter API', 502);
  }

  if (!fxRes.ok) {
    return jsonError('Tweet not found or unavailable', fxRes.status === 404 ? 404 : 502);
  }

  let data;
  try {
    data = await fxRes.json();
  } catch {
    return jsonError('Invalid response from fxtwitter API', 502);
  }

  const tweet = data.tweet;
  const videos = formatVideos(data);

  return jsonResponse({
    tweetId: info.tweetId,
    author: tweet?.author?.screen_name || info.username,
    text: tweet?.text || '',
    videos
  });
}

// ─── Worker エントリポイント ──────────────────────────────────

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    if (url.pathname === '/api/extract') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      return handleExtract(request);
    }

    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
};
