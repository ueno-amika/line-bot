# LINE Bot セットアップガイド

このドキュメントは、LINE Bot を初期セットアップするための手順を記載しています。

## 前提条件
- Node.js 18+
- npm または yarn
- LINE Business Account
- Supabase アカウント

## セットアップ手順

### 1. LINE Developers でチャネル作成

1. [LINE Developers](https://developers.line.biz/) にアクセス
2. 新しい**Channel** を作成 → **Messaging API** を選択
3. チャネル設定から以下を取得：
   - **Channel Secret** → `LINE_CHANNEL_SECRET`
   - **Channel Access Token** → `LINE_CHANNEL_ACCESS_TOKEN`

### 2. Webhook URL 設定

1. LINE Developers の「Webhook 設定」で以下を設定：
   ```
   https://your-domain.vercel.app/api/line/webhook
   ```

2. 開発時（localhost）は ngrok を使用：
   ```bash
   # 別ターミナルで
   ngrok http 3000
   # https://xxxx-xx-xx-xxx-xxx.ngrok.io/api/line/webhook を LINE に設定
   ```

### 3. Supabase プロジェクト作成

1. [Supabase](https://supabase.com/) にログイン
2. 新しいプロジェクトを作成
3. Project Settings から以下を取得：
   - **Project URL** → `SUPABASE_URL`
   - **Anon Key** → `SUPABASE_ANON_KEY`

### 4. Supabase テーブル作成

1. Supabase コンソール → SQL Editor を開く
2. `supabase/migrations/001_init_tables.sql` の内容をコピーして実行

### 5. 環境変数を設定

```bash
# .env.local ファイルを作成
cp .env.local.example .env.local

# 以下の値を編集
LINE_CHANNEL_SECRET=your_secret
LINE_CHANNEL_ACCESS_TOKEN=your_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key
```

### 6. 開発サーバーを起動

```bash
npm run dev
```

### 7. LINE で動作確認

1. LINE アプリで Bot を友だち追加
2. メッセージを送信
3. 同じメッセージが返ってくれば成功（Echo 動作）

## トラブルシューティング

### Webhook が呼ばれない
- [ ] Webhook URL が正しいか確認
- [ ] Channel Secret が正しいか確認
- [ ] localhost の場合は ngrok が起動しているか確認
- [ ] ファイアウォール・プロキシ設定を確認

### メッセージが返ってこない
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` が正しいか確認
- [ ] サーバーログを確認 (`npm run dev` の出力)
- [ ] LINE Business Account が有効か確認

### Supabase 接続エラー
- [ ] `SUPABASE_URL` と `SUPABASE_ANON_KEY` が正しいか確認
- [ ] Supabase プロジェクトが有効か確認

## 次のステップ

- [ ] Claude API 連携（FAQ 回答の生成）
- [ ] 会話ログの Supabase 保存
- [ ] 管理画面実装（FAQ 更新画面）
- [ ] リッチメニュー実装
