# セットアップ手順書（開発環境構築マニュアル）

このドキュメントは、このプロジェクトを初めて触るエンジニア（引き継ぎ想定）向けの環境構築手順です。
プロジェクト概要は [README.md](./README.md)、仕様の詳細は [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) を参照してください。

## 前提条件

- Node.js 18 以上
- npm
- GitHub アカウント（このリポジトリへのアクセス権）
- LINE Business Account（LINE Developers コンソールへのアクセス権）
- Supabase アカウント（プロジェクトへのアクセス権）
- Anthropic Console アカウント（Claude API キー発行用）
- Vercel アカウント（本番デプロイ先へのアクセス権）

既存の本番環境（後述）に触る場合は、現オーナーから以下の招待を受けてください。

- GitHub リポジトリのコラボレーター招待
- Vercel プロジェクトのメンバー招待
- Supabase プロジェクトのメンバー招待
- LINE Developers コンソールのチームメンバー招待
- Anthropic Console の Workspace 招待

## 1. リポジトリを取得

```bash
git clone https://github.com/ueno-amika/line-bot.git
cd line-bot
npm install
```

## 2. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開いて、以下の値を埋めます。

| 変数名 | 取得元 | 用途 |
|---|---|---|
| `LINE_CHANNEL_SECRET` | LINE Developers コンソール → チャネル基本設定 | Webhook 署名検証 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Developers コンソール → Messaging API 設定 | LINE への返信・通知・配信 |
| `LINE_OWNER_USER_ID` | オーナーの LINE userId（LINE Developers の Webhook ログ等から取得可能） | エスカレーション通知の送信先 |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) | FAQ 自動応答の生成 |
| `SUPABASE_URL` | Supabase プロジェクト → Settings → API | DB 接続先 |
| `SUPABASE_ANON_KEY` | Supabase プロジェクト → Settings → API | DB 接続キー |
| `ADMIN_USERNAME` | 自分で決める | 管理画面（`/admin`）の Basic 認証ユーザー名 |
| `ADMIN_PASSWORD` | 自分で決める（`openssl rand -base64 18` 等で生成推奨） | 管理画面の Basic 認証パスワード |

既存の本番プロジェクトに参加する場合は、上記をゼロから取得する必要はありません。現オーナーに直接値を共有してもらってください（Slack 等の平文チャットではなく、1Password 等のパスワード共有ツールを推奨）。

## 3. Supabase テーブルを準備

**新規に Supabase プロジェクトを作る場合のみ**、SQL Editor で以下のマイグレーションを**この順番で**実行してください。

```
supabase/migrations/002_create_faq_table.sql
supabase/migrations/003_create_menus_and_conversations.sql
supabase/migrations/004_relax_faq_write_policies.sql
```

> ⚠️ **`001_init_tables.sql` は実行しないでください。**
> 現在の実装（`src/lib/faq/service.ts` 等）と互換性のない古いテーブル定義です。詳細は [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) の「既知の課題」を参照してください。

既存の本番 Supabase プロジェクトに接続する場合は、このステップは不要です（テーブルは作成済みです）。

## 4. 開発サーバーを起動

```bash
npm run dev
```

`http://localhost:3000` でトップページ、`http://localhost:3000/admin` で管理画面が確認できます。

## 5. LINE Webhook をローカルで試す

LINE は Webhook 先が `https://` の公開 URL でないと通信できないため、[ngrok](https://ngrok.com/) 等でトンネルを張ります。

```bash
# 別ターミナルで
ngrok http 3000
```

発行された URL（例: `https://xxxx.ngrok-free.dev`）に `/api/line/webhook` を付けたものを、LINE Developers コンソールの「Messaging API設定」→「Webhook URL」に設定してください。

```
https://xxxx.ngrok-free.dev/api/line/webhook
```

設定後、「検証」ボタンで疎通確認 → LINE アプリで Bot にメッセージを送って、FAQ に基づいた回答が返ってくれば成功です。

## 6. ビルド・型チェック

```bash
npm run type-check   # 型エラーのみ確認
npm run build        # 本番ビルド
```

## 7. 本番（Vercel）へのデプロイ

初回のみ:

```bash
npx vercel link      # Vercel プロジェクトと接続
```

環境変数を Vercel にも登録します（`.env.local` と同じ8つ）。

```bash
npx vercel env add LINE_CHANNEL_SECRET production
npx vercel env add LINE_CHANNEL_ACCESS_TOKEN production
npx vercel env add LINE_OWNER_USER_ID production
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add SUPABASE_URL production
npx vercel env add SUPABASE_ANON_KEY production
npx vercel env add ADMIN_USERNAME production
npx vercel env add ADMIN_PASSWORD production
```

デプロイ:

```bash
npx vercel deploy --prod
```

**デプロイ後、LINE Developers コンソールの Webhook URL を本番 URL に更新するのを忘れずに。**

```
https://<本番ドメイン>/api/line/webhook
```

更新を忘れると、デプロイは成功しているのに Bot からの応答が来ない、という事故になります。「検証」ボタンで疎通確認してから本番切り替え完了とみなしてください。

## トラブルシューティング

### Webhook が呼ばれない
- [ ] LINE Developers の Webhook URL が現在の環境（ngrok / 本番）と一致しているか
- [ ] 「Webhookの利用」がオンになっているか
- [ ] ngrok を使っている場合、ngrok が起動し続けているか（PC がスリープすると切れます）

### 署名検証エラー（401）
- [ ] `LINE_CHANNEL_SECRET` が正しいか（コピペミス・改行混入に注意）

### メッセージが返ってこない（200 は返っているのに無反応）
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` が正しいか
- [ ] サーバーログを確認（Vercel の場合は Vercel ダッシュボード → プロジェクト → Logs）
- [ ] `ANTHROPIC_API_KEY` が有効か（Claude API 呼び出しで失敗している可能性）

### 管理画面で FAQ が保存できない
- [ ] `SUPABASE_URL` / `SUPABASE_ANON_KEY` が正しいか
- [ ] Supabase 側でテーブルが作成済みか（手順3を参照）

### 管理画面にアクセスするとID・パスワードを聞かれる／401になる
- [ ] `ADMIN_USERNAME` / `ADMIN_PASSWORD` が正しいか（Basic 認証。管理画面全体を保護しています）

### Supabase 接続エラー
- [ ] Supabase プロジェクトが一時停止していないか（無料プランは一定期間アクセスがないと自動停止します）

## 現在の本番環境（参考）

| 項目 | 値 |
|---|---|
| リポジトリ | https://github.com/ueno-amika/line-bot |
| 本番 URL | https://line-bot-ivory-five.vercel.app |
| 管理画面 | https://line-bot-ivory-five.vercel.app/admin |
| Webhook URL | https://line-bot-ivory-five.vercel.app/api/line/webhook |

管理画面（`/admin`, `/api/admin/*`）は Basic 認証で保護されています。ID・パスワードは現オーナーまたは `ADMIN_USERNAME` / `ADMIN_PASSWORD`（Vercel の環境変数）から確認してください。
