# 技術ドキュメント

エンジニア向けの技術的な引き継ぎ資料です。セットアップ手順は [SETUP.md](./SETUP.md)、プロジェクト概要は [README.md](./README.md) を参照してください。

## 目次

1. [システム構成・外部サービス連携図](#1-システム構成外部サービス連携図)
2. [API仕様](#2-api仕様)
3. [DB設計](#3-db設計)
4. [確信度判定・エスカレーションのロジック](#4-確信度判定エスカレーションのロジック)
5. [環境変数一覧](#5-環境変数一覧)
6. [インフラ・アクセス権](#6-インフラアクセス権)
7. [既知の課題](#7-既知の課題)

---

## 1. システム構成・外部サービス連携図

```
                     ┌─────────────────────┐
                     │   LINE ユーザー       │
                     └──────────┬──────────┘
                                │ メッセージ送信
                                ▼
                     ┌─────────────────────┐
                     │  LINE Messaging API  │
                     └──────────┬──────────┘
                                │ Webhook (署名付き POST)
                                ▼
   ┌───────────────────────────────────────────────────┐
   │  Next.js App (Vercel)                              │
   │                                                     │
   │  POST /api/line/webhook ─┬─▶ Claude API に質問+FAQ  │
   │                          │   を渡して回答生成       │
   │                          ├─▶ Supabase に会話ログ記録 │
   │                          └─▶ 確信度が低ければ        │
   │                              LINE Push でオーナーに  │
   │                              エスカレーション通知    │
   │                                                     │
   │  /admin/*  (管理画面 UI)                            │
   │  /api/admin/* (管理画面 API) ──▶ Supabase 読み書き   │
   │                              └▶ お知らせは LINE      │
   │                                 Broadcast API 経由   │
   └───────────────────────────────────────────────────┘
              │                    │                  │
              ▼                    ▼                  ▼
     ┌───────────────┐   ┌────────────────┐  ┌────────────────┐
     │  Claude API    │   │   Supabase      │  │  LINE Messaging │
     │ (Anthropic)    │   │  (PostgreSQL)   │  │  API (Push /    │
     │                │   │  faq / menus /  │  │  Broadcast)     │
     │                │   │  conversations  │  │                 │
     └───────────────┘   └────────────────┘  └────────────────┘
```

**ポイント**

- LINE ユーザーとのやり取りは Webhook（受信）と Reply API（返信）で完結する。オーナーへの通知だけは Push API を使う（ユーザーからのアクションなしに一方的に送るため）
- 管理画面からの「お知らせ配信」は Broadcast API（友だち全員への一斉送信）
- FAQ 検索用のキーワード絞り込みロジック（`faqService.searchFAQsByKeywords` 等）はコード上に存在するが、実際の Webhook 処理では**使われていない**。FAQ 件数が少ないため、全件をそのまま Claude に渡して判断させる方式になっている（[app/api/line/webhook/route.ts](./app/api/line/webhook/route.ts) のコメント参照）

---

## 2. API仕様

### 外部向け（LINE から呼ばれる）

#### `POST /api/line/webhook`

LINE プラットフォームが、ユーザーのメッセージ受信時に呼び出す。

- **認証**: `X-Line-Signature` ヘッダーの HMAC-SHA256 署名検証（`LINE_CHANNEL_SECRET`）
- **レスポンス**: 常に `200 OK`（LINE 側の再送を防ぐため、内部処理の成否に関わらず早期に返す）
- **異常系**:
  - 署名ヘッダーなし → `400`
  - 署名不一致 → `401`
- **処理内容**:
  1. イベント配列をパース
  2. テキストメッセージのみ処理（それ以外は無視）
  3. FAQ 全件 + ユーザーの質問を Claude API に渡し、回答と確信度を生成
  4. ユーザーに Reply
  5. 会話ログを Supabase に非同期保存（保存失敗は返信を妨げない）
  6. `should_escalate: true` の場合、オーナー（`LINE_OWNER_USER_ID`）に Push 通知

### 管理画面向け（Basic 認証で保護）

| メソッド | パス | 用途 | body |
|---|---|---|---|
| GET | `/api/admin/faq` | FAQ 一覧取得 | - |
| POST | `/api/admin/faq` | FAQ 新規追加 | `{ category, question, answer, keywords? }` |
| PUT | `/api/admin/faq/[id]` | FAQ 更新 | `{ category, question, answer, keywords? }` |
| DELETE | `/api/admin/faq/[id]` | FAQ 削除 | - |
| GET | `/api/admin/menus` | メニュー一覧取得 | - |
| POST | `/api/admin/menus` | メニュー新規追加 | `{ name, price, description?, display_order? }` |
| PUT | `/api/admin/menus/[id]` | メニュー更新 | `{ name, price, description?, is_active? }` |
| DELETE | `/api/admin/menus/[id]` | メニュー削除 | - |
| GET | `/api/admin/conversations` | 会話ログ取得（最新100件） | - |
| POST | `/api/admin/broadcast` | 友だち全員に一斉配信 | `{ text, confirm: true }` |

- FAQ / メニューの POST・PUT は必須項目が欠けていると `400` を返す
- `/api/admin/broadcast` は `confirm: true` が明示されていないと `400`（UI の `confirm()` はブラウザ側の防止策に過ぎないため、API 側でも二重チェックしている）。配信内容は 5000 文字まで
- これらの管理 API は [middleware.ts](./middleware.ts) の Basic 認証で保護されている（`/admin` 配下の UI と同じ認証情報）

---

## 3. DB設計

Supabase (PostgreSQL)。以下は `supabase/migrations/002〜004` を適用した後の、**現在アプリが実際に前提としているスキーマ**です。

### `faq`

| カラム | 型 | 備考 |
|---|---|---|
| id | UUID (PK) | `gen_random_uuid()` |
| category | VARCHAR(50) NOT NULL | 例: 営業情報・料金・配送 |
| question | TEXT NOT NULL | |
| answer | TEXT NOT NULL | |
| keywords | TEXT[] | 検索用キーワード（現状は Webhook 処理では未使用） |
| created_at / updated_at | TIMESTAMP | |

インデックス: `category`、`keywords`（GIN）

### `menus`

| カラム | 型 | 備考 |
|---|---|---|
| id | UUID (PK) | |
| name | TEXT NOT NULL | メニュー名 |
| price | INTEGER NOT NULL | 円単位 |
| description | TEXT | |
| display_order | INTEGER | 表示順 |
| is_active | BOOLEAN | |
| created_at / updated_at | TIMESTAMP | |

### `conversations`

| カラム | 型 | 備考 |
|---|---|---|
| id | UUID (PK) | |
| line_user_id | TEXT NOT NULL | |
| message | TEXT NOT NULL | ユーザーの質問 |
| response | TEXT | Bot の回答 |
| confidence_level | VARCHAR(10) | 高 / 中 / 低 |
| confidence_score | NUMERIC | 0.0〜1.0 |
| escalated | BOOLEAN | オーナーに通知したか |
| created_at | TIMESTAMP | |

インデックス: `created_at DESC`、`line_user_id`

### RLS（Row Level Security）ポリシー

3テーブルとも RLS 有効。現状は **anon キーで全操作（SELECT/INSERT/UPDATE/DELETE）が許可**されている（管理画面に認証がないため、暫定的にこうなっている。[既知の課題](#7-既知の課題) 参照）。

---

## 4. 確信度判定・エスカレーションのロジック

`src/lib/claude/client.ts` の `generateAnswer()` が、回答生成と確信度判定を**1回の Claude API 呼び出し**にまとめている（LINE の3秒以内レスポンス制約のため、往復回数を最小化する設計）。

- モデル: `claude-sonnet-4-6`
- システムプロンプトに FAQ 全件を埋め込み、以下を JSON 形式で返させる
  ```json
  {
    "answer": "回答本文",
    "confidence_level": "高 | 中 | 低",
    "confidence_score": 0.0〜1.0,
    "should_escalate": true または false
  }
  ```
- 判定基準（プロンプト内で明示）:
  - 高: FAQ に完全マッチ
  - 中: 部分的に関連、推論を含む
  - 低: FAQ にない、人間の判断が必要
- パース失敗・型不正時は安全側に倒し、**確信度「低」＝エスカレーション扱い**にフォールバックする
- `.claude/agents/confidence-judge.md` に判定ロジックの設計メモ（初期は回答生成と別呼び出しで判定する想定だった名残）がある。実装は上記の通り1回に統合済み

---

## 5. 環境変数一覧

| 変数名 | 用途 | 備考 |
|---|---|---|
| `LINE_CHANNEL_SECRET` | Webhook 署名検証 | LINE Developers から取得 |
| `LINE_CHANNEL_ACCESS_TOKEN` | Reply / Push / Broadcast API 認証 | LINE Developers から取得。長期間有効なチャネルアクセストークンを推奨 |
| `LINE_OWNER_USER_ID` | エスカレーション通知の送信先 | オーナーの LINE userId |
| `ANTHROPIC_API_KEY` | Claude API 認証 | console.anthropic.com |
| `SUPABASE_URL` | DB 接続先 | |
| `SUPABASE_ANON_KEY` | DB 接続キー（anon） | RLS ポリシーで権限制御（現状はほぼ無制限、課題参照） |

---

## 6. インフラ・アクセス権

| サービス | 用途 | URL |
|---|---|---|
| GitHub | ソースコード管理 | https://github.com/ueno-amika/line-bot |
| Vercel | ホスティング・デプロイ | https://line-bot-ivory-five.vercel.app |
| Supabase | DB | プロジェクト管理者に確認 |
| LINE Developers | Messaging API チャネル管理 | https://developers.line.biz/ |
| Anthropic Console | Claude API キー管理 | https://console.anthropic.com/ |

デプロイフロー: ローカルで `npx vercel deploy --prod`（Vercel と GitHub リポジトリは連携済みだが、GitHub push 時の自動デプロイは未設定。手動デプロイが必要）。

---

## 7. 既知の課題

引き継ぎ時に優先度をつけて対応してほしい項目です。

1. ~~`/admin` に認証がない~~ **→ 対応済み**
   [middleware.ts](./middleware.ts) で `/admin/*` と `/api/admin/*` を Basic 認証（`ADMIN_USERNAME` / `ADMIN_PASSWORD`）で保護済み。環境変数が未設定の場合は認証失敗（`500`）として扱い、意図せず全開放にならないようにしている。
   なお、Supabase 側の RLS ポリシー自体は `004_relax_faq_write_policies.sql` により anon キーで書き込み可能な状態が残っている（`SUPABASE_ANON_KEY` はサーバー側専用でブラウザには渡していないため、現状の直接的なリスクは低い）。将来的にログイン機能をユーザー単位の認証に発展させる場合は、RLS ポリシーも `authenticated` 限定に戻すことを検討する。

2. **`supabase/migrations/001_init_tables.sql` が現行スキーマと非互換**
   `001` は `menus`（`label/action_type/action_value` 等）・`conversations`（`message_text/response_text` 等）について、`002`/`003` と全く異なるカラム構成で `CREATE TABLE IF NOT EXISTS` している。本番 DB は `002`〜`004` 準拠のスキーマで実際に稼働していることを確認済み（管理画面が正常動作しているため）。`001` は実行しないこと。新規環境構築時に誤って先に流さないよう、削除もしくは明確に「非推奨」と分かるようリネームすることを推奨。

3. **`src/lib/supabase.ts` の `Database` 型が未使用かつ不整合**
   ここで定義された型は `001` 時代のスキーマを反映しており、実際に各 service ファイル（`faqService` 等）が使っているローカルの interface とは異なる。型としてどこからも import されておらず死んでいる可能性が高い。実スキーマに合わせて更新するか削除するか要検討。

4. **FAQ のキーワード検索機能が未使用**
   `faqService.searchFAQsByKeywords` / `findRelevantFAQs` はコード上に存在するが、Webhook 処理では呼ばれていない（全件を Claude に渡す方式）。FAQ 件数が増えてトークン数・レイテンシが問題になった場合は、この機能を使った絞り込みへの切り替えを検討。

5. **一斉配信にレート制限・対象絞り込みがない**
   `POST /api/admin/broadcast` は LINE 公式アカウントの友だち全員に無条件で送信する。特定セグメントへの配信や送信頻度の制限は未実装。
