# Code Quest Arena

Code Quest Arena は、授業や研修で使うためのクエスト形式の理解度チェックアプリです。管理者がミッションとクエストを作成し、参加者は参加コードと表示名だけでクエストに参加できます。

## 主な機能

- 参加者はアカウント不要で `/join` から参加
- 管理者は `/admin` からミッション、クエスト、セッションを管理
- Python / PHP / 汎用問題に対応したミッション作成
- 選択式問題、コード片、解説、タグ、難易度を管理
- 複数ミッションを組み合わせたクエスト作成
- クエストごとの満点、制限時間、時間ボーナス設定
- セッションごとの参加コード発行
- 参加者の進捗、正答数、スコア、時間ボーナスを集計
- 表示用ランキングボード `/display/[sessionId]`
- Docker Compose + Caddy による本番公開

## 技術スタック

- Next.js 15
- React 19
- TypeScript
- Prisma Client
- SQLite
- Tailwind CSS
- Docker / Docker Compose
- Caddy

## 主要URL

| 用途 | URL |
| --- | --- |
| 参加者トップ | `/join` |
| 参加者プレイ画面 | `/play/[sessionId]` |
| 参加者結果画面 | `/result/[sessionId]` |
| 管理者ログイン | `/admin/login` |
| 管理ダッシュボード | `/admin` |
| ミッション管理 | `/admin/missions` |
| クエスト管理 | `/admin/quests` |
| セッション詳細 | `/admin/sessions/[sessionId]` |
| 表示用ランキング | `/display/[sessionId]` |

## 環境変数

`.env.example` を参考に `.env` を作成します。

```env
DATABASE_URL="file:./data/dev.db"
APP_URL="http://localhost:3000"
CADDY_HOSTNAME="localhost"
SESSION_SECRET="change-this-to-a-long-random-string"
INITIAL_ADMIN_EMAIL="admin@example.com"
INITIAL_ADMIN_PASSWORD="changeme"
```

| 変数 | 説明 |
| --- | --- |
| `DATABASE_URL` | Prisma / SQLite の接続先。SQLiteファイルは `prisma/` からの相対パスとして扱われます。 |
| `APP_URL` | アプリの公開URL。Cookieや外部URL生成の基準になります。 |
| `CADDY_HOSTNAME` | Caddyで受けるホスト名。本番では公開ドメインを指定します。 |
| `SESSION_SECRET` | 本番では必ず長くランダムな値に変更してください。 |
| `INITIAL_ADMIN_EMAIL` | 初期管理者メールアドレス。 |
| `INITIAL_ADMIN_PASSWORD` | 初期管理者パスワード。初回起動前に必ず変更してください。 |

初期管理者は `npm run seed` またはDocker起動時のseed処理で作成されます。既に同じメールアドレスの管理者が存在する場合、seedはパスワードを上書きしません。

## 開発時の起動

### Docker Composeで開発する

依存関係やNode.jsのバージョンをコンテナ側に任せたい場合はこちらを使います。

```bash
docker compose -f compose.dev.yml up --build
```

起動後、以下にアクセスします。

- 参加者画面: <http://localhost:3000/join>
- 管理者画面: <http://localhost:3000/admin>

開発用Composeは以下を自動で実行します。

- SQLiteスキーマ作成: `npm run db:setup`
- 初期データ投入: `npm run seed`
- Next.js開発サーバー起動: `npm run dev:fast -- --hostname 0.0.0.0`

開発用データベースはホスト側の `data/` に保存され、コンテナ内では `/app/prisma/data` にマウントされます。

### 開発時にHTTPSで確認する

Caddyの開発用profileを有効にします。

```bash
docker compose -f compose.dev.yml --profile https up --build
```

起動後、以下にアクセスします。

- 参加者画面: <https://localhost:8443/join>
- 管理者画面: <https://localhost:8443/admin>

開発用Caddyは `tls internal` を使います。ブラウザで証明書警告が出る場合は、ローカル開発用として例外許可するか、CaddyのローカルCAを信頼してください。

### npmで直接開発する

ローカルのNode.jsで起動する場合は、Node.js 24系を推奨します。

```bash
npm ci
npm run prisma:generate
npm run db:setup
npm run seed
npm run dev:fast
```

起動後、以下にアクセスします。

- 参加者画面: <http://localhost:3000/join>
- 管理者画面: <http://localhost:3000/admin>

Windows PowerShellで `.env` を作成する場合:

```powershell
Copy-Item .env.example .env
```

ローカルnpm起動では、`.env` の `APP_URL` は `http://localhost:3000` にしておくと扱いやすいです。

## 本番公開

本番は `compose.yml` を使います。構成は次の通りです。

- `web`: Next.jsアプリ本体
- `caddy`: 80/443番ポートを受け、`web:3000` にリバースプロキシ
- `app-data`: SQLiteデータ永続化用Docker volume
- `caddy-data` / `caddy-config`: Caddy証明書と設定用Docker volume

### 1. サーバーを準備する

本番サーバーに以下を用意します。

- Docker
- Docker Compose
- 80番 / 443番ポートの公開
- 公開ドメインのDNS AレコードまたはAAAAレコード

例: `code-quest.example.com` をサーバーのIPアドレスに向けます。

### 2. `.env` を作成する

本番サーバーで `.env.example` をコピーし、本番値に変更します。

```bash
cp .env.example .env
```

本番用の例:

```env
DATABASE_URL="file:./data/prod.db"
APP_URL="https://code-quest.example.com"
CADDY_HOSTNAME="code-quest.example.com"
SESSION_SECRET="replace-with-a-long-random-secret"
INITIAL_ADMIN_EMAIL="teacher@example.com"
INITIAL_ADMIN_PASSWORD="replace-before-first-start"
```

`SESSION_SECRET` と `INITIAL_ADMIN_PASSWORD` は必ず変更してください。初期管理者パスワードは初回seed時に作成されるため、最初の本番起動前に設定しておくのが安全です。

### 3. 起動する

```bash
docker compose up --build -d
```

Caddyが公開ドメインでHTTPSを終端し、Next.jsアプリへ転送します。

起動後、以下にアクセスします。

- 参加者画面: `https://code-quest.example.com/join`
- 管理者画面: `https://code-quest.example.com/admin`

初回起動時に、コンテナ内で以下が実行されます。

- `npm run db:setup`
- `npm run seed`
- `npm run start -- --hostname 0.0.0.0`

### 4. ログ確認

```bash
docker compose logs -f web
docker compose logs -f caddy
```

### 5. 更新デプロイ

```bash
git pull
docker compose up --build -d
```

## 管理者の基本操作

1. `/admin` にログインする
2. `/admin/missions` で問題を作成する
3. `/admin/quests` で複数の問題を並べたクエストを作成する
4. クエストからセッションを開始する
5. 参加コードを参加者へ共有する
6. 参加者は `/join` で参加コードと表示名を入力する
7. 管理画面で進捗を確認する
8. 必要に応じてランキング公開をONにする
9. 授業後にセッションを削除する

## npm scripts

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | Next.js開発サーバーを起動 |
| `npm run dev:fast` | TurbopackでNext.js開発サーバーを起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run prisma:generate` | Prisma Client生成 |
| `npm run db:setup` | SQLiteスキーマ作成・更新 |
| `npm run seed` | 初期管理者とサンプルデータ投入 |
| `npm run test:domain` | スコア計算などのドメインロジック確認 |
| `npm run docker:dev` | 開発用Docker Compose起動 |
| `npm run docker:dev:https` | HTTPS付き開発用Docker Compose起動 |

## リポジトリ構成

```text
src/app/                 Next.js App Router
src/app/actions/         Server Actions
src/components/          UIコンポーネント
src/lib/                 認証、Prisma、スコア計算
prisma/schema.prisma     Prismaスキーマ
prisma/setup-db.ts       SQLiteスキーマ作成・更新スクリプト
prisma/seed.ts           初期データ投入スクリプト
public/                  画像などの静的ファイル
compose.dev.yml          開発用Docker Compose
compose.yml              本番用Docker Compose
Caddyfile.dev            開発HTTPS用Caddy設定
Caddyfile                本番公開用Caddy設定
```

## 補足

- Prisma Migrateではなく `prisma/setup-db.ts` でSQLiteスキーマを作成・更新しています。
- `PRISMA_DEBUG_QUERIES=1` を設定すると、Prismaクエリログを出せます。
- 参加者Cookieはセッションごとに発行され、参加者はログイン不要です。
- 管理者セッションはCookieで管理されます。
