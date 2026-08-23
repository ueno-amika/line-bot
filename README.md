# LINE FAQ Bot

LINE Messaging API と Claude API を組み合わせた FAQ 自動応答 Bot。ユーザーからの質問に Claude が FAQ データをもとに回答し、確信度が低い場合はオーナーに LINE で自動エスカレーション通知します。

**公開URL（本番）**: https://line-bot-ivory-five.vercel.app

## Screenshots

| ユーザーとの会話（LINE） | 管理画面トップ |
|---|---|
| _(スクリーンショットを追加予定)_ | _(スクリーンショットを追加予定)_ |

| FAQ 管理 | 会話ログ |
|---|---|
| _(スクリーンショットを追加予定)_ | _(スクリーンショットを追加予定)_ |

## 主な機能

- **LINE Webhook 連携**: 署名検証つきの `POST /api/line/webhook` でメッセージを受信
- **FAQ 自動応答**: Claude API が登録済み FAQ をもとに回答を生成
- **確信度判定 & エスカレーション**: 回答の確信度（高・中・低）を自己判定し、低い場合はオーナーへ LINE プッシュ通知
- **会話ログ**: ユーザーとのやり取りを Supabase に記録し、管理画面で閲覧可能
- **管理画面**（`/admin`）
  - FAQ の追加・編集・削除
  - メニュー・料金の管理
  - 会話ログの閲覧
  - 友だち全員への一斉配信（ブロードキャスト）

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | [Next.js](https://nextjs.org/) 16 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| データベース | [Supabase](https://supabase.com/) (PostgreSQL) |
| AI | [Claude API](https://www.anthropic.com/api) (`claude-sonnet-4-6`) |
| メッセージング | [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/) |
| デプロイ | [Vercel](https://vercel.com/) |

## アーキテクチャ

```
LINE ユーザー
    ↓
POST /api/line/webhook  ← LINE から Webhook
    ↓
署名検証（LINE_CHANNEL_SECRET）
    ↓
Claude API に質問 + FAQ 全件を渡して回答生成
    ↓
確信度（高・中・低）を自己判定
    ↓
ユーザーに返信（reply API） + 会話ログを Supabase に保存
    ↓
確信度が低い場合 → オーナーに LINE プッシュ通知でエスカレーション
```

## ディレクトリ構成

```
line-bot/
├── app/
│   ├── admin/                # 管理画面（FAQ / メニュー / 会話ログ / 配信）
│   └── api/
│       ├── line/webhook/     # LINE Webhook エンドポイント
│       └── admin/            # 管理画面用 API
├── src/
│   └── lib/
│       ├── line/              # LINE SDK ラッパー・署名検証
│       ├── claude/            # Claude API クライアント
│       ├── faq/                # FAQ サービス
│       ├── conversations/      # 会話ログサービス
│       └── menus/              # メニューサービス
└── supabase/
    └── migrations/            # DB スキーマ（faq / menus / conversations）
```

## ローカル開発

```bash
# インストール
npm install

# 環境変数を設定
cp .env.local.example .env.local
# .env.local を編集して各キーを設定

# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# ビルド
npm run build
```

### 必要な環境変数

```
LINE_CHANNEL_SECRET         # LINE Developers コンソールから取得
LINE_CHANNEL_ACCESS_TOKEN   # LINE Developers コンソールから取得
LINE_OWNER_USER_ID          # エスカレーション通知の送信先ユーザーID
ANTHROPIC_API_KEY           # Claude API キー
SUPABASE_URL                # Supabase プロジェクト URL
SUPABASE_ANON_KEY           # Supabase 匿名キー
```

### Webhook をローカルで試す

[ngrok](https://ngrok.com/) などで localhost を一時的に公開し、LINE Developers コンソールの Webhook URL に設定します。

```bash
ngrok http 3000
# 発行された URL + /api/line/webhook を LINE Developers に設定
```

## デプロイ

Vercel に接続してデプロイ後、LINE Developers コンソールの Webhook URL を本番 URL（`https://<your-app>.vercel.app/api/line/webhook`）に更新してください。
