# LINE Bot 最小実装チェックリスト

## ✅ 完了した項目

### 1. プロジェクトセットアップ
- [x] Next.js（App Router）初期化
- [x] TypeScript 設定完了
- [x] Tailwind CSS 設定完了
- [x] パスエイリアス（@/*）設定完了

### 2. CLAUDE.md 設計
- [x] プロジェクト概要記載
- [x] ディレクトリ構造定義
- [x] コーディング規約定義
- [x] 環境変数一覧作成
- [x] アーキテクチャ決定事項記載

### 3. Supabase セットアップ
- [x] テーブル設計（faq / menus / conversations）
- [x] SQL マイグレーション作成
- [x] Supabase クライアント実装

### 4. LINE Messaging API セットアップ
- [x] LINE クライアント実装（署名検証含む）
- [x] 型定義完成

### 5. Echo（オウム返し）実装
- [x] Webhook エンドポイント実装
  - [x] 署名検証
  - [x] メッセージ解析
  - [x] Echo 返信
- [x] 型チェック完了（エラーなし）
- [x] ビルド完了（エラーなし）

---

## 🚀 次のステップ（Phase 2）

1. **LINE Business Account セットアップ**
   - [ ] Channel Secret 取得
   - [ ] Channel Access Token 取得
   - [ ] Webhook URL 設定

2. **Supabase プロジェクト作成**
   - [ ] プロジェクト作成
   - [ ] SQL テーブル作成（マイグレーション実行）
   - [ ] Project URL、Anon Key 取得

3. **環境変数設定**
   - [ ] `.env.local` に以下を記入：
     ```
     LINE_CHANNEL_SECRET=
     LINE_CHANNEL_ACCESS_TOKEN=
     SUPABASE_URL=
     SUPABASE_ANON_KEY=
     ```

4. **動作確認**
   - [ ] `npm run dev` で開発サーバー起動
   - [ ] ngrok で localhost を公開（開発時）
   - [ ] LINE で Bot 追加
   - [ ] メッセージ送信 → Echo 返信確認

5. **デプロイ**
   - [ ] Vercel にデプロイ
   - [ ] Webhook URL を Vercel の本番 URL に設定

---

## 📂 ファイル構造

```
line-bot/
├── app/
│   ├── api/
│   │   └── line/
│   │       └── webhook/route.ts      # ✨ Webhook エンドポイント
│   ├── layout.tsx
│   └── page.tsx
├── src/
│   ├── lib/
│   │   ├── line/
│   │   │   ├── client.ts             # LINE API ラッパー
│   │   │   └── types.ts              # LINE 型定義
│   │   └── supabase.ts               # Supabase クライアント
│   └── types/
├── supabase/
│   └── migrations/
│       └── 001_init_tables.sql       # DB スキーマ
├── CLAUDE.md                         # プロジェクト設計書
├── SETUP.md                          # セットアップガイド
├── CHECKLIST.md                      # このファイル
├── .env.local.example                # 環境変数テンプレート
└── package.json
```

---

## 🧪 ローカルテスト手順

### 1. インストール＆環境変数設定
```bash
npm install
cp .env.local.example .env.local
# .env.local を編集して、環境変数を設定
```

### 2. 開発サーバー起動
```bash
npm run dev
# http://localhost:3000 で起動
```

### 3. ngrok で公開（別ターミナル）
```bash
ngrok http 3000
# https://xxxx-xxxx-xxxx.ngrok.io が表示される
```

### 4. Webhook URL を LINE に設定
```
https://xxxx-xxxx-xxxx.ngrok.io/api/line/webhook
```

### 5. LINE で Bot 友だち追加 → メッセージ送信 → Echo 確認

---

## ⚠️ トラブルシューティング

| 問題 | 対処法 |
|------|--------|
| Webhook が呼ばれない | ngrok URL が正しいか、LINE 設定が正しいか確認 |
| 署名検証エラー | `LINE_CHANNEL_SECRET` が正しいか確認 |
| メッセージが返ってこない | `LINE_CHANNEL_ACCESS_TOKEN` が正しいか確認、サーバーログ確認 |
| Supabase 接続エラー | `SUPABASE_URL`, `SUPABASE_ANON_KEY` が正しいか確認 |

---

## 💾 コミット準備

すべてのチェックが完了したら、以下でコミット：

```bash
git add .
git commit -m "feat: LINE Bot echo feature - minimal implementation"
```
