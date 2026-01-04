# 営業日報システム (Daily Report System)

営業担当者が日々の営業活動を報告し、上長が確認・フィードバックできる日報管理システム。

## 技術スタック

- **言語**: TypeScript
- **フレームワーク**: Next.js 14+ (App Router)
- **UIコンポーネント**: shadcn/ui + Tailwind CSS
- **APIスキーマ定義**: OpenAPI (Zodによる検証)
- **DBスキーマ定義**: Prisma.js
- **テスト**: Vitest
- **デプロイ**: Google Cloud Run

## 前提条件

- Node.js 20.x以上
- PostgreSQL 15.x
- Git
- Google Cloud CLI (デプロイ時)

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd daily-report
```

### 2. 依存関係のインストール

```bash
make install
# または
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local`を編集して必要な環境変数を設定してください。

### 4. 開発環境の準備

```bash
make prepare
# または
npm run prepare
npx prisma generate
```

### 5. データベースのセットアップ

```bash
make prisma-migrate
make prisma-seed
# または
npx prisma migrate dev
npx prisma db seed
```

### 6. 開発サーバーの起動

```bash
make dev
# または
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 開発コマンド

### Makefileコマンド

```bash
make help              # 利用可能なコマンド一覧を表示
make dev              # 開発サーバー起動
make build            # アプリケーションビルド
make test             # テスト実行
make test-coverage    # カバレッジ付きテスト実行
make lint             # Lintチェック
make lint-fix         # Lintエラー自動修正
make format           # コード整形
make type-check       # 型チェック
make prisma-studio    # Prisma Studio起動
make check            # 全チェック実行 (lint + type-check + test)
make ci               # CIパイプライン実行
```

### Dockerコマンド

```bash
make docker-build     # Dockerイメージビルド
make docker-run       # Dockerコンテナ起動
```

### デプロイコマンド

```bash
make setup-gcloud           # Google Cloud初期設定
make create-artifact-registry  # Artifact Registry作成
make deploy                 # Cloud Runへデプロイ
make migrate-db             # データベースマイグレーション実行
make deploy-full            # フルデプロイ (ビルド + デプロイ + マイグレーション)
make logs                   # Cloud Runログ確認
```

## デプロイ手順（Google Cloud Run）

### 初回デプロイ

1. **Google Cloud CLIのセットアップ**

```bash
make setup-gcloud
```

2. **Artifact Registryの作成**

```bash
make create-artifact-registry
```

3. **Dockerの認証設定**

```bash
make auth-docker
```

4. **環境変数の設定**

Cloud Runで使用する環境変数をSecretとして登録:

```bash
echo -n "your-database-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-nextauth-url" | gcloud secrets create NEXTAUTH_URL --data-file=-
echo -n "your-nextauth-secret" | gcloud secrets create NEXTAUTH_SECRET --data-file=-
```

5. **デプロイ実行**

```bash
# 環境変数をエクスポート
export DATABASE_URL="postgresql://..."
export NEXTAUTH_URL="https://your-app.run.app"
export NEXTAUTH_SECRET="..."

# フルデプロイ
make deploy-full
```

### GitHub Actionsによる自動デプロイ

mainブランチにプッシュすると、自動的にCloud Runへデプロイされます。

事前にGitHub Secretsに以下を設定してください:

- `WIF_PROVIDER`: Workload Identity Providerのリソース名
- `WIF_SERVICE_ACCOUNT`: サービスアカウントのメールアドレス
- `DATABASE_URL`: データベース接続文字列
- `NEXTAUTH_URL`: アプリケーションURL
- `NEXTAUTH_SECRET`: NextAuthシークレット

## ディレクトリ構成

```
daily-report/
├── app/              # Next.js App Router
├── components/       # UIコンポーネント
├── lib/              # ユーティリティ・ヘルパー
├── hooks/            # カスタムフック
├── types/            # TypeScript型定義
├── prisma/           # Prismaスキーマ・マイグレーション
├── tests/            # テストファイル
├── public/           # 静的ファイル
└── .github/          # GitHub Actions
```

## テスト

```bash
# 全テスト実行
make test

# Watch モード
make test-watch

# カバレッジ付き
make test-coverage
```

## ドキュメント

- [CLAUDE.md](./CLAUDE.md) - プロジェクト全体ドキュメント
- [画面定義書](./screen-specification.md)
- [API仕様書](./api-specification.md)
- [テスト仕様書](./test-specification.md)

## トラブルシューティング

### データベース接続エラー

PostgreSQLが起動しているか確認:

```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Prismaエラー

Prisma Clientを再生成:

```bash
make prisma-generate
```

### ビルドエラー

依存関係を再インストール:

```bash
rm -rf node_modules .next
make install
make build
```

## ライセンス

TBD

## お問い合わせ

Issue または プロジェクトオーナーまでお問い合わせください。
