# Code Quest Arena

IT基礎授業向けのクエスト型理解確認アプリです。学生はアカウント不要で、参加コードと表示名だけで参加できます。講師・管理者だけがログインします。

## 開発起動

1. `.env.example` を参考に `.env` を作成します。
2. 通常は軽量な HTTP 開発環境を起動します。

```bash
docker compose -f compose.dev.yml up --build
```

起動後:

- 学生画面: <http://localhost:3000/join>
- 講師画面: <http://localhost:3000/admin>

開発用 Compose は依存関係を `Dockerfile.dev` のビルド時に入れ、起動時は DB セットアップ、seed、`next dev --turbo` のみを実行します。Prisma schema を変更した場合は `--build` 付きで再起動してください。

HTTPS を含めて確認したい場合だけ Caddy profile を有効にします。

```bash
docker compose -f compose.dev.yml --profile https up --build
```

HTTPS確認時:

- 学生画面: <https://localhost:8443/join>
- 講師画面: <https://localhost:8443/admin>

開発用 Caddy は `tls internal` を使います。ブラウザで証明書警告が出る場合は、開発中は例外として進むか、Caddy のローカルCA証明書を信頼してください。

初期ログイン:

- メール: `admin@example.com`
- パスワード: `changeme`

本番では `.env` の `INITIAL_ADMIN_PASSWORD` と `SESSION_SECRET` を必ず変更してください。

## 開発用 npm scripts

```bash
npm run dev:fast
npm run docker:dev
npm run docker:dev:https
```

SQLログは通常出しません。Prisma のクエリを見たい場合だけ `PRISMA_DEBUG_QUERIES=1` を設定してください。

## 本番起動

```bash
docker compose up --build -d
```

`CADDY_HOSTNAME` に公開ドメインを指定すると、Caddy が HTTPS を終端して `web:3000` にリバースプロキシします。

## データ

SQLite は `prisma/data` 配下に配置されます。Compose では永続ボリュームを使います。
この環境では Prisma Schema Engine のOS依存問題を避けるため、起動時に `npm run db:setup` でSQLiteテーブルを作成します。Prisma Client生成は通常どおり `npx prisma generate` を使います。

推奨運用:

- 授業後に `/admin/sessions/[sessionId]` から CSV を出力する。
- 必要に応じてセッション削除を行う。
- `DATA_RETENTION_DAYS` を過ぎたセッションは管理画面から削除できる。
- バックアップは DB ファイルと `compose.yml`、`.env` をセットで保管する。

## 主要仕様

- 学生参加: `/join`
- 学生プレイ: `/play/[sessionId]`
- 学生結果: `/result/[sessionId]`
- 講師管理: `/admin`
- ミッション管理: `/admin/missions`
- クエスト管理: `/admin/quests`
- セッション監視: `/admin/sessions/[sessionId]`

学生画面では全ランキングを表示せず、ランキングON時でも上位5名と自分の順位のみを表示します。
