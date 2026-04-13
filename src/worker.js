/**
 * XのポストURLからユーザー名とツイートIDを抽出する。
 * @param {string} url
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

// Worker ハンドラー (Task 3 で追加)
export default {};
