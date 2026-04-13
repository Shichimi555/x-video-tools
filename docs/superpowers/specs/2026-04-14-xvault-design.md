# XVAULT — X動画抽出ツール 設計ドキュメント

**日付:** 2026-04-14  
**ステータス:** 承認済み

---

## 概要

XのポストURLを入力すると、添付動画のダイレクトURLを取得し、プレーヤーで再生・ダウンロードできるWebツール。Cloudflare Workers上で動作し、GitHub経由でデプロイされる。

---

## アーキテクチャ

### 構成

単一のCloudflare Worker（`src/worker.js`）がフロントエンドとAPIの両方を担当する。ビルドステップ不要。

```
x-video-tools/
├── src/
│   └── worker.js          # Worker本体（HTML/CSS/JS埋め込み + API）
├── wrangler.jsonc
├── package.json
└── .gitignore
```

### デプロイフロー

1. `git push` → GitHub リポジトリ
2. Cloudflare Workers Builds が自動検出してビルド・デプロイ  
   （GitHub Actions は使用しない。Cloudflareダッシュボードから Workers Builds でリポジトリ接続）

---

## バックエンド API

### エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/` | フロントエンドHTML配信 |
| `POST` | `/api/extract` | 動画URL抽出 |
| `OPTIONS` | `/api/extract` | CORS preflight |

### `POST /api/extract`

**リクエスト:**
```json
{ "tweetUrl": "https://x.com/ikomaiyo/status/1957074018609012998" }
```

**処理フロー:**
1. 正規表現でURLから `username` と `tweetId` を抽出  
   対応パターン: `x.com` / `twitter.com`、クエリパラメータは無視
2. `https://api.fxtwitter.com/{username}/status/{tweetId}` を呼び出し
3. レスポンスの `tweet.media.videos[].variants` から MP4直リンクを品質別に整形して返す

**レスポンス（成功時）:**
```json
{
  "tweetId": "1957074018609012998",
  "author": "ikomaiyo",
  "text": "ツイート本文（抜粋）",
  "videos": [
    {
      "url": "https://video.twimg.com/...",
      "bitrate": 2176000,
      "width": 1280,
      "height": 720,
      "type": "video/mp4"
    }
  ]
}
```

**エラーハンドリング:**
- 無効なURL → 400 + `{ "error": "Invalid tweet URL" }`
- fxtwitter APIが失敗 → 502 + `{ "error": "Failed to fetch tweet data" }`
- 動画が見つからない → 200 + `{ "videos": [] }` + フロント側でメッセージ表示

---

## フロントエンド設計

### デザイン: "XVAULT — Cinema Archive"

**コンセプト:** 映画アーカイブの質感。動画という素材とテーマが一致し、他のツールと差別化できるビジュアル。

**配色:**
```
--bg:        #0a0908   // 深いチャコール
--surface:   #141210
--border:    #2d2820
--gold:      #c9a44a   // ウォームゴールド（メインアクセント）
--gold-lt:   #e8c878   // 明るいゴールド
--text:      #d8cfc0   // ウォームホワイト
--text-dim:  #6b6258   // ミュートテキスト
```

**フォント:**
- 見出し・ロゴ: `Playfair Display` (Google Fonts, serif)
- UI・URL・コード: `JetBrains Mono` (Google Fonts, monospace)

**装飾要素:**
- 上下端にフィルムストリップ（CSSのみ、スプロケット穴付き）
- グレインテクスチャオーバーレイ（SVG filter + opacity）

### UIコンポーネント

1. **ヘッダー**
   - ロゴ: "X**VAULT**" （X部分をゴールドで強調）
   - サブタイトル: `EXTRACT · PREVIEW · DOWNLOAD`

2. **入力エリア**
   - URLテキストフィールド（プレースホルダー: `https://x.com/...`）
   - 抽出ボタン（ローディング中はスピナー + テキスト変更）

3. **結果カード**（抽出成功後にスライドインで表示）
   - 著者名 + ツイート本文（最大140文字）
   - `<video>` プレーヤー（controls付き、autoplay無し）
   - 品質セレクター（ビットレート別にボタンで切り替え）
   - 直リンクURL表示 + コピーボタン
   - ダウンロードリンク（`download` 属性付き `<a>` タグ）

4. **エラー表示**
   - ゴールドのボーダー付きエラーカード

### アニメーション

- ページロード: コンテンツのフェードイン
- 抽出中: ボタンの脈動アニメーション
- 結果表示: カードのスライドイン + フェード

---

## 技術仕様

- **ランタイム:** Cloudflare Workers (V8 isolate)
- **互換性日付:** 2024-11-01
- **外部依存:** fxtwitter API (`api.fxtwitter.com`) — 認証不要
- **ビルドツール:** Wrangler v3
- **フォント:** Google Fonts (CDN)

---

## 制約・前提

- fxtwitter APIはサードパーティサービスのため、将来的に仕様変更の可能性あり
- Twitter/Xの動画はMP4形式（複数品質バリアント）で提供される前提
- HLS (m3u8) が返される場合は対応しない（fxtwitter APIは通常MP4を返す）
