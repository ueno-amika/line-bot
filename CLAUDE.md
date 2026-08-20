# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
LINE Messaging API + Claude API で FAQ 自動応答する Bot。
フェーズ1: Echo（オウム返し）の最小構成で LINE Webhook 連携を動作確認。

## Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **External APIs**: LINE Messaging API, Claude API

## Directory Structure
```
line-bot/
├── app/
│   ├── api/
│   │   └── line/
│   │       └── webhook/     # POST /api/line/webhook - LINE からのメッセージ受信
│   ├── layout.tsx
│   └── page.tsx
├── src/
│   ├── lib/
│   │   ├── line/
│   │   │   ├── client.ts    # LINE SDK ラッパー
│   │   │   └── types.ts     # LINE 型定義
│   │   ├── supabase.ts      # Supabase クライアント
│   │   └── utils.ts         # ユーティリティ関数
│   ├── types/
│   │   ├── line.ts          # LINE Webhook イベント型
│   │   └── db.ts            # DB スキーマ型
│   └── constants.ts         # 定数定義
├── .env.local               # 環境変数（ローカル用）
├── package.json
├── tsconfig.json
└── CLAUDE.md                # このファイル
```

## Development Commands
```bash
# インストール
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# 本番実行
pnpm start

# 型チェック
pnpm type-check

# 型エラーのみ表示
pnpm tsc --noEmit
```

## Environment Variables
```
# .env.local に設定
LINE_CHANNEL_SECRET=        # LINE Developers コンソールから取得
LINE_CHANNEL_ACCESS_TOKEN=  # LINE Developers コンソールから取得
SUPABASE_URL=               # Supabase プロジェクト URL
SUPABASE_ANON_KEY=          # Supabase 匿名キー
```

## KEY ARCHITECTURE DECISIONS

### 1. LINE Webhook エンドポイント設計
- **Route**: `POST /api/line/webhook`
- **Signature Validation**: LINE_CHANNEL_SECRET で署名検証必須
- **Response**: 200 OK を即座に返す（LINE は 3秒以内の応答を期待）
- **Message Processing**: 非同期タスク化（将来的に Supabase Jobs or Queue に移行可能）

### 2. Message Flow (Echo 最小実装)
```
LINE ユーザー
    ↓
[POST /api/line/webhook] ← LINE が Webhook を叩く
    ↓
Signature 検証（LINE_CHANNEL_SECRET）
    ↓
メッセージ内容 取得
    ↓
LINE_CHANNEL_ACCESS_TOKEN で reply API 呼び出し
    ↓
メッセージをそのまま返送（Echo）
    ↓
[200 OK]
```

### 3. Database Schema (Phase 1 では未使用、Phase 2 以降で活用)
```sql
-- FAQ テーブル
CREATE TABLE faq (
  id UUID PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- メニュー（富豪選択肢）
CREATE TABLE menus (
  id UUID PRIMARY KEY,
  label TEXT NOT NULL,
  action_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 会話ログ
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  line_user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. コーディング規約
- **ファイル名**: kebab-case（`line-client.ts`）
- **フォルダ名**: kebab-case
- **変数名**: camelCase
- **型名**: PascalCase
- **定数**: UPPER_SNAKE_CASE
- **環境変数**: UPPER_SNAKE_CASE

### 5. Error Handling
- LINE Webhook 署名検証失敗 → 401 Unauthorized
- LINE API 呼び出し失敗 → ログに記録、ユーザーには通知しない（ただし開発時は console error）
- 予期しないエラー → 500 Internal Server Error

## Testing LINE Webhook Locally
Ngrok や Vercel Preview を使って、local サーバーを LINE に公開し Webhook テスト可能。

```bash
# Option 1: Ngrok
ngrok http 3000
# https://xxxx-xx-xx-xxx-xxx.ngrok.io/api/line/webhook を LINE に設定

# Option 2: Vercel Preview
pnpm build && vercel deploy --prod
```

## Next Steps (Phase 2 以降)
1. Claude API 連携（FAQ 検索 + 生成応答）
2. Supabase での会話ログ保存
3. 管理画面実装（FAQ 更新）
4. メッセージ種別の対応（画像、動画など）

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
