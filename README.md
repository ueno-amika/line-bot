# LINE FAQ Bot

LINE Messaging API と Claude API を組み合わせた FAQ 自動応答 Bot。ユーザーからの質問に Claude が FAQ データをもとに回答し、確信度が低い場合はオーナーに LINE で自動エスカレーション通知します。

**公開URL（本番）**: https://line-bot-ivory-five.vercel.app

## Screenshots

| ユーザーとの会話（LINE） | 管理画面トップ |
|---|---|
| <img width="1060" height="724" alt="スクリーンショット 2026-08-23 14 30 00" src="https://github.com/user-attachments/assets/1b3b235a-c46a-4b8d-adc0-7136babcd514" /> | <img width="1183" height="455" alt="スクリーンショット 2026-08-23 14 30 20" src="https://github.com/user-attachments/assets/7dd90f11-e2e7-4cec-90f2-7eb1102475cb" /> |

| FAQ 管理 | 会話ログ |
|---|---|
| <img width="1182" height="705" alt="スクリーンショット 2026-08-23 14 30 37" src="https://github.com/user-attachments/assets/0baef805-1b60-4ac1-92cd-7de5c680f6ff" /> | <img width="1187" height="458" alt="スクリーンショット 2026-08-23 14 53 00" src="https://github.com/user-attachments/assets/bcedff7d-4cdb-4f6d-9067-86a339526827" /> |

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

## ドキュメント

| ドキュメント | 対象 | 内容 |
|---|---|---|
| [SETUP.md](./SETUP.md) | エンジニア | 開発環境構築・デプロイ手順 |
| [OPERATIONS_GUIDE.md](./OPERATIONS_GUIDE.md) | オーナー | FAQ追加・お知らせ配信・Botの返答対処（スマホ向け） |
| [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) | エンジニア | API仕様・DB設計・連携図・既知の課題 |
