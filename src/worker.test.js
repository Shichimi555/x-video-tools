import { describe, it, expect } from 'vitest';
import { extractTweetInfo, formatVideos } from './worker.js';

describe('extractTweetInfo', () => {
  it('x.com の標準URLからユーザー名とIDを抽出する', () => {
    const result = extractTweetInfo('https://x.com/ikomaiyo/status/1957074018609012998');
    expect(result).toEqual({ username: 'ikomaiyo', tweetId: '1957074018609012998' });
  });

  it('クエリパラメータ付きのURLも正しく処理する', () => {
    const result = extractTweetInfo('https://x.com/ikomaiyo/status/1957074018609012998?');
    expect(result).toEqual({ username: 'ikomaiyo', tweetId: '1957074018609012998' });
  });

  it('twitter.com のURLも処理する', () => {
    const result = extractTweetInfo('https://twitter.com/user/status/123456789');
    expect(result).toEqual({ username: 'user', tweetId: '123456789' });
  });

  it('無効なURLはnullを返す', () => {
    expect(extractTweetInfo('https://example.com/foo')).toBeNull();
    expect(extractTweetInfo('not-a-url')).toBeNull();
    expect(extractTweetInfo('')).toBeNull();
  });
});

describe('formatVideos', () => {
  const mockFxData = {
    tweet: {
      author: { screen_name: 'ikomaiyo', name: 'ikomaiyo' },
      text: 'test tweet',
      media: {
        videos: [
          {
            url: 'https://video.twimg.com/test.mp4',
            thumbnail_url: 'https://pbs.twimg.com/thumb.jpg',
            width: 1280,
            height: 720,
            duration: 15.0,
            variants: [
              { url: 'https://video.twimg.com/high.mp4', type: 'video/mp4', bitrate: 2176000 },
              { url: 'https://video.twimg.com/low.mp4',  type: 'video/mp4', bitrate: 832000 },
              { url: 'https://video.twimg.com/playlist.m3u8', type: 'application/x-mpegURL', bitrate: 0 }
            ]
          }
        ]
      }
    }
  };

  it('mp4バリアントのみをビットレート降順で返す', () => {
    const result = formatVideos(mockFxData);
    expect(result).toHaveLength(2);
    expect(result[0].bitrate).toBe(2176000);
    expect(result[1].bitrate).toBe(832000);
    expect(result.every(v => v.type === 'video/mp4')).toBe(true);
  });

  it('動画ごとに width/height を引き継ぐ', () => {
    const result = formatVideos(mockFxData);
    expect(result[0].width).toBe(1280);
    expect(result[0].height).toBe(720);
  });

  it('mediaがない場合は空配列を返す', () => {
    expect(formatVideos({ tweet: {} })).toEqual([]);
    expect(formatVideos({})).toEqual([]);
    expect(formatVideos(null)).toEqual([]);
  });

  it('複数の動画がある場合はすべてのバリアントをビットレート降順でマージする', () => {
    const multiVideoData = {
      tweet: {
        media: {
          videos: [
            {
              width: 1280, height: 720,
              variants: [
                { url: 'https://video.twimg.com/v1-high.mp4', type: 'video/mp4', bitrate: 2176000 }
              ]
            },
            {
              width: 640, height: 360,
              variants: [
                { url: 'https://video.twimg.com/v2-low.mp4', type: 'video/mp4', bitrate: 500000 },
                { url: 'https://video.twimg.com/v2-mid.mp4', type: 'video/mp4', bitrate: 832000 }
              ]
            }
          ]
        }
      }
    };
    const result = formatVideos(multiVideoData);
    expect(result).toHaveLength(3);
    expect(result[0].bitrate).toBe(2176000);
    expect(result[1].bitrate).toBe(832000);
    expect(result[2].bitrate).toBe(500000);
  });
});
