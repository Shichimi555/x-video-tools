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

    // フロントエンド HTML は Task 4 で追加
    return new Response('<h1>XVAULT</h1><p>Coming soon</p>', {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
};
