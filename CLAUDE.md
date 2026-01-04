# 営業日報システム - プロジェクトドキュメント

このファイルは、営業日報システムの全体設計と開発ガイドラインをまとめたドキュメントです。Claude Codeがこのプロジェクトで作業する際の参照情報として使用されます。

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [システム要件定義](#システム要件定義)
3. [データモデル（ER図）](#データモデルer図)
4. [アーキテクチャ概要](#アーキテクチャ概要)
5. [仕様書一覧](#仕様書一覧)
6. [開発ガイドライン](#開発ガイドライン)
7. [ディレクトリ構成](#ディレクトリ構成)
8. [技術スタック](#技術スタック)

---

## プロジェクト概要

### システム名
**営業日報システム (Daily Report System)**

### 目的
営業担当者が日々の営業活動を報告し、上長が確認・フィードバックできる日報管理システムを構築する。営業活動の可視化と、上長と部下のコミュニケーション促進を目的とする。

### 主要ユーザー
- **営業担当者**: 日報の作成・編集、顧客訪問記録の管理
- **上長**: 部下の日報確認、コメント投稿、進捗管理
- **管理者**: ユーザー管理、マスタデータ管理

---

## システム要件定義

### 1. 主要機能

#### 1.1 日報作成・管理機能
- 営業担当者が日次で日報を作成
- 1日1件の日報に対して、複数の顧客訪問記録を登録可能
- **課題・相談（Problem）** の記載
- **翌日の予定（Plan）** の記載
- 作成後の編集・修正が可能

#### 1.2 訪問記録機能
- 訪問した顧客を顧客マスタから選択
- 訪問内容（商談内容、提案内容等）の記述
- 訪問時刻の記録
- 1日報に対して複数の訪問記録を追加可能

#### 1.3 コメント機能
- 上長が部下の日報に対してコメント可能
- コメントは複数投稿可能
- フィードバックや指示の記録

#### 1.4 マスタ管理機能
- **営業マスタ**: 社員情報、所属部署、上長関係の管理
- **顧客マスタ**: 顧客情報、担当営業の管理

### 2. ビジネスルール

#### 2.1 日報作成ルール
- 1人の営業につき1日1件の日報のみ作成可能（`employee_id`と`report_date`の複合ユニーク制約）
- 訪問記録は最低1件必須
- Problem（課題）とPlan（予定）は任意だが、推奨

#### 2.2 権限制御
- **営業**: 自分の日報のみ作成・編集・削除・閲覧可能
- **上長**: 自分と部下の日報を閲覧可能、コメント投稿可能
- **管理者**: 全日報を閲覧可能、営業マスタ・顧客マスタの管理

#### 2.3 データ整合性
- 顧客が訪問記録で使用されている場合、削除不可
- 社員が日報や顧客の担当営業として使用されている場合、削除不可
- 日報の最後の訪問記録は削除不可（最低1件必須）

### 3. 制約事項

#### 3.1 文字数制限
- 訪問内容: 最大500文字
- Problem（課題・相談）: 最大1000文字
- Plan（明日の予定）: 最大1000文字
- コメント: 最大500文字
- 顧客名: 最大100文字
- 社員名: 最大50文字

#### 3.2 バリデーション
- メールアドレス: メール形式チェック、重複不可
- パスワード: 最低8文字、英数字を含む
- 電話番号: 数字とハイフンのみ
- 日付: YYYY-MM-DD形式
- 時刻: HH:MM形式

---

## データモデル（ER図）

### ER図（Mermaid）

```mermaid
erDiagram
    Employee ||--o{ DailyReport : "作成する"
    Employee ||--o{ Customer : "担当する"
    Employee ||--o{ Comment : "投稿する"
    Employee ||--o| Employee : "上長-部下"

    DailyReport ||--o{ VisitRecord : "含む"
    DailyReport ||--o{ Comment : "受ける"

    Customer ||--o{ VisitRecord : "訪問される"

    Employee {
        int employee_id PK
        string name
        string email
        string department
        string position
        int manager_id FK "上長ID"
        datetime created_at
        datetime updated_at
    }

    Customer {
        int customer_id PK
        string customer_name
        string address
        string phone
        string email
        int assigned_employee_id FK "担当営業ID"
        datetime created_at
        datetime updated_at
    }

    DailyReport {
        int report_id PK
        int employee_id FK
        date report_date
        text problem "課題・相談"
        text plan "明日の予定"
        datetime created_at
        datetime updated_at
    }

    VisitRecord {
        int visit_id PK
        int report_id FK
        int customer_id FK
        text visit_content "訪問内容"
        time visit_time "訪問時刻"
        datetime created_at
    }

    Comment {
        int comment_id PK
        int report_id FK
        int commenter_id FK "コメント者ID（上長）"
        text comment_content
        datetime created_at
    }
```

### エンティティ説明

#### Employee（営業マスタ）
営業担当者および上長の情報を管理。`manager_id`で上長との関係を表現（自己参照）。

**主要フィールド:**
- `employee_id`: 社員ID（主キー）
- `name`: 社員名
- `email`: メールアドレス（ログインIDとして使用、ユニーク制約）
- `manager_id`: 上長ID（自己参照外部キー）

#### Customer（顧客マスタ）
顧客の基本情報を管理。`assigned_employee_id`で担当営業を紐付け。

**主要フィールド:**
- `customer_id`: 顧客ID（主キー）
- `customer_name`: 顧客名
- `assigned_employee_id`: 担当営業ID（外部キー）

#### DailyReport（日報）
1日1件の日報を管理。`problem`（課題）と`plan`（予定）を記録。

**主要フィールド:**
- `report_id`: 日報ID（主キー）
- `employee_id`: 営業ID（外部キー）
- `report_date`: 報告日（`employee_id`との複合ユニーク制約推奨）
- `problem`: 今日の課題や相談事項
- `plan`: 明日の予定・やること

#### VisitRecord（訪問記録）
日報に紐づく個別の顧客訪問記録。1つの日報に複数の訪問記録が登録可能。

**主要フィールド:**
- `visit_id`: 訪問記録ID（主キー）
- `report_id`: 日報ID（外部キー）
- `customer_id`: 顧客ID（外部キー）
- `visit_content`: 訪問内容
- `visit_time`: 訪問時刻

#### Comment（コメント）
上長が日報に対して投稿するコメント。1つの日報に複数のコメントが可能。

**主要フィールド:**
- `comment_id`: コメントID（主キー）
- `report_id`: 日報ID（外部キー）
- `commenter_id`: コメント者ID（外部キー、上長のemployee_id）
- `comment_content`: コメント内容

---

## アーキテクチャ概要

### システム構成

Next.js App Routerによるフルスタック構成を採用。

```
┌─────────────────────────────────┐
│      Next.js App Router         │
│  ┌─────────────┐  ┌───────────┐ │
│  │ フロント     │  │ API Routes│ │
│  │ (RSC/Client)│  │ (/api/*)  │ │
│  └─────────────┘  └─────┬─────┘ │
│                         │        │
│                  ┌──────▼──────┐ │
│                  │   Prisma    │ │
│                  │   Client    │ │
│                  └──────┬──────┘ │
└─────────────────────────┼────────┘
                          │
                 ┌────────▼────────┐
                 │  PostgreSQL     │
                 │  (Cloud SQL)    │
                 └─────────────────┘
```

### 主要技術スタック

- **言語**: TypeScript
- **フレームワーク**: Next.js 14+ (App Router)
- **UIコンポーネント**: shadcn/ui + Tailwind CSS
- **APIスキーマ定義**: OpenAPI (Zodによる検証)
- **DBスキーマ定義**: Prisma.js
- **テスト**: Vitest
- **デプロイ**: Google Cloud Run

### 認証・認可

- **認証方式**: NextAuth.js (Auth.js) を使用
- **セッション管理**: JWT (JSON Web Token)
- **トークン保存**: HTTPOnly Cookie（セキュアフラグ有効）
- **権限制御**: ロールベースアクセス制御（RBAC）
  - Role: `営業`, `上長`, `管理者`
- **ミドルウェア**: Next.js Middlewareで認証状態とロールをチェック

### セキュリティ対策

- **SQLインジェクション対策**: Prismaによるプリペアドステートメント
- **XSS対策**: React/Next.jsの自動エスケープ処理
- **CSRF対策**: NextAuth.jsによるCSRFトークン自動管理
- **パスワード**: bcryptでハッシュ化
- **環境変数**: `.env.local`で管理（Gitにコミットしない）
- **HTTPS**: Cloud Run上では自動的にHTTPS化
- **セキュリティヘッダー**: next.config.jsで設定（CSP、X-Frame-Optionsなど）

---

## 仕様書一覧

このプロジェクトには以下の仕様書が存在します。詳細は各ファイルを参照してください。

### 1. 画面定義書
**ファイル**: @doc/screen-specification.md

全9画面の詳細仕様を記載。

**主要画面:**
- S-01: ログイン画面
- S-02: ダッシュボード
- S-03: 日報一覧画面
- S-04: 日報作成・編集画面
- S-05: 日報詳細画面
- S-06: 顧客一覧画面
- S-07: 顧客登録・編集画面
- S-08: 営業マスタ一覧画面（管理者のみ）
- S-09: 営業マスタ登録・編集画面（管理者のみ）

**記載内容:**
- 画面項目（フィールド定義、型、必須/任意）
- バリデーションルール
- 画面遷移
- アクセス権限
- 操作ボタン

### 2. API仕様書
**ファイル**: @doc/api-specification.md

全25エンドポイントのAPI仕様を記載。

**主要APIカテゴリ:**
- 認証API (3エンドポイント)
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`

- 日報API (5エンドポイント)
  - `GET /api/daily-reports`
  - `GET /api/daily-reports/:id`
  - `POST /api/daily-reports`
  - `PUT /api/daily-reports/:id`
  - `DELETE /api/daily-reports/:id`

- 訪問記録API (3エンドポイント)
- コメントAPI (3エンドポイント)
- 顧客マスタAPI (5エンドポイント)
- 営業マスタAPI (6エンドポイント)

**記載内容:**
- リクエスト/レスポンス形式（JSON）
- HTTPステータスコード
- エラーレスポンス形式
- 認証・権限要件
- ページネーション仕様

### 3. テスト仕様書
**ファイル**: @doc/test-specification.md

全95項目のテストケースを記載。

**テストカテゴリ:**
- 認証機能テスト (8項目)
- 日報機能テスト (19項目)
- 訪問記録機能テスト (4項目)
- コメント機能テスト (7項目)
- 顧客マスタテスト (9項目)
- 営業マスタテスト (8項目)
- 非機能テスト
  - パフォーマンステスト
  - セキュリティテスト（SQLインジェクション、XSS、CSRF）
  - ユーザビリティテスト（レスポンシブデザイン、ブラウザ互換性）

**記載内容:**
- テスト手順
- 期待結果
- 優先度（P0〜P3）
- テスト環境・アカウント情報
- 不具合管理テンプレート

---

## 開発ガイドライン

### コーディング規約

#### TypeScript（全般）

**共通ルール:**
- 関数名: キャメルケース（`getUserById`, `createDailyReport`）
- 変数名: キャメルケース（`userId`, `reportDate`）
- 定数: スネークケース大文字（`MAX_VISITS_PER_DAY`）
- クラス名: パスカルケース（`DailyReportService`, `UserController`）
- 型名: パスカルケース（`DailyReport`, `User`）

**TypeScript設定:**
- `strict: true`を有効化
- `noUncheckedIndexedAccess: true`を推奨
- 明示的な型注釈を優先（型推論に頼りすぎない）

#### Next.js App Router

**ディレクトリ・ファイル命名:**
- ページ: `app/`配下に配置、`page.tsx`
- レイアウト: `layout.tsx`
- API Routes: `app/api/`配下、`route.ts`
- Serverコンポーネント: デフォルト、`'use client'`不要
- Clientコンポーネント: ファイル先頭に`'use client'`

**APIエンドポイント命名:**
- RESTful設計に従う
- 複数形を使用（`/api/daily-reports`, `/api/customers`）
- ハイフン区切り（`/api/daily-reports/[id]/visits`）
- Dynamic Routesは`[id]`形式

**エラーハンドリング:**
- API Routesでは`NextResponse.json()`を使用
- 全てのエラーは適切なHTTPステータスコードで返す
- エラーレスポンスは統一フォーマット（@doc/api-specification.md参照）
- Server Actionsのエラーは`error.tsx`でハンドリング

#### UI/コンポーネント

**shadcn/ui + Tailwind CSS:**
- コンポーネント名: パスカルケース（`DailyReportList`, `LoginForm`）
- ファイル名: kebab-case（`daily-report-list.tsx`, `login-form.tsx`）
- Tailwind CSSのユーティリティクラスを優先
- カスタムスタイルは`@apply`ディレクティブを使用
- shadcn/uiコンポーネントは`components/ui/`に配置

**Server Components vs Client Components:**
- デフォルトはServer Components
- インタラクティブな要素（onClick、useState等）が必要な場合のみClient Components
- データフェッチはServer Componentsで実行
- Client ComponentsからServer Componentsを子として渡すことが可能

**状態管理:**
- グローバル状態: React Context + useReducer、またはZustand
- サーバー状態: Next.jsのキャッシュ機能を活用
- フォーム: React Hook Form + Zod
- 認証状態: NextAuth.js

### Git運用ルール

**ブランチ戦略:**
- `main`: 本番環境デプロイ用
- `develop`: 開発環境統合用
- `feature/*`: 機能開発用（例: `feature/daily-report-create`）
- `bugfix/*`: バグ修正用（例: `bugfix/login-validation`）

**コミットメッセージ:**
```
<type>: <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードフォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルドプロセス、ツール変更

**例:**
```
feat: 日報作成機能を実装

- 日報作成フォームコンポーネントを追加
- 訪問記録の動的追加機能を実装
- バリデーション処理を追加

Closes #123
```

### データベースマイグレーション（Prisma）

**ルール:**
- `schema.prisma`でスキーマを定義
- マイグレーションファイルは全てGitで管理
- 本番環境適用前に必ず開発環境でテスト
- マイグレーション名は説明的に（例: `add_daily_report_table`）

**基本コマンド:**
```bash
# スキーマ変更後、マイグレーション作成
npx prisma migrate dev --name add_daily_report_table

# マイグレーション適用（本番環境）
npx prisma migrate deploy

# Prisma Clientの再生成
npx prisma generate

# データベースの初期化（開発環境のみ）
npx prisma migrate reset

# Prisma Studio起動（DB GUI）
npx prisma studio
```

**Prisma Schema例:**
```prisma
model Employee {
  id         Int      @id @default(autoincrement())
  name       String
  email      String   @unique
  department String
  position   String
  managerId  Int?
  manager    Employee? @relation("EmployeeHierarchy", fields: [managerId], references: [id])
  subordinates Employee[] @relation("EmployeeHierarchy")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### テスト戦略

**カバレッジ目標:**
- 単体テスト: 80%以上
- 重要なビジネスロジック: 100%
- API Routes: 90%以上

**テストツール:**
- **単体テスト**: Vitest + React Testing Library
- **API Routes テスト**: Vitest + MSW (Mock Service Worker)
- **E2Eテスト**: Playwright
- **コンポーネントテスト**: Vitest + Testing Library

**テストファイル配置:**
- コンポーネント: `__tests__/`ディレクトリまたは同階層に`*.test.tsx`
- API Routes: `app/api/**/*.test.ts`
- ユーティリティ: `lib/**/*.test.ts`

**テスト実施タイミング:**
- PR作成時: 自動テスト実行（GitHub Actions）
- developマージ前: 全テスト実行
- 本番デプロイ前: 全テスト + E2Eテスト実行

**Vitest設定例:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
})
```

---

## ディレクトリ構成

### Next.js App Router構成

```
daily-report/
├── app/                        # App Router（ページ・レイアウト・API）
│   ├── (auth)/                 # 認証グループ
│   │   └── login/
│   │       └── page.tsx        # ログイン画面
│   ├── (dashboard)/            # ダッシュボードグループ（認証必須）
│   │   ├── layout.tsx          # ダッシュボード共通レイアウト
│   │   ├── page.tsx            # ダッシュボード
│   │   ├── daily-reports/
│   │   │   ├── page.tsx        # 日報一覧
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # 日報作成
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # 日報詳細
│   │   │       └── edit/
│   │   │           └── page.tsx # 日報編集
│   │   ├── customers/
│   │   │   ├── page.tsx        # 顧客一覧
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # 顧客作成
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # 顧客詳細
│   │   │       └── edit/
│   │   │           └── page.tsx # 顧客編集
│   │   └── employees/          # 営業マスタ（管理者のみ）
│   │       ├── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   ├── api/                    # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts    # NextAuth設定
│   │   ├── daily-reports/
│   │   │   ├── route.ts        # GET/POST /api/daily-reports
│   │   │   └── [id]/
│   │   │       ├── route.ts    # GET/PUT/DELETE /api/daily-reports/[id]
│   │   │       ├── visits/
│   │   │       │   └── route.ts
│   │   │       └── comments/
│   │   │           └── route.ts
│   │   ├── customers/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── employees/
│   │       ├── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   ├── layout.tsx              # ルートレイアウト
│   ├── error.tsx               # エラーページ
│   └── not-found.tsx           # 404ページ
│
├── components/                 # UIコンポーネント
│   ├── ui/                     # shadcn/uiコンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/                 # レイアウトコンポーネント
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── features/               # 機能別コンポーネント
│       ├── auth/
│       │   └── login-form.tsx
│       ├── daily-report/
│       │   ├── daily-report-list.tsx
│       │   ├── daily-report-form.tsx
│       │   ├── visit-record-form.tsx
│       │   └── comment-section.tsx
│       ├── customer/
│       │   └── customer-form.tsx
│       └── employee/
│           └── employee-form.tsx
│
├── lib/                        # ユーティリティ・ヘルパー
│   ├── prisma.ts               # Prisma Client
│   ├── auth.ts                 # NextAuth設定
│   ├── utils.ts                # 共通ユーティリティ
│   ├── validators.ts           # Zodバリデーション
│   └── api-client.ts           # APIクライアント（フロント用）
│
├── hooks/                      # カスタムフック
│   ├── use-auth.ts
│   ├── use-daily-report.ts
│   └── use-customer.ts
│
├── types/                      # TypeScript型定義
│   ├── api.ts                  # API型定義
│   ├── models.ts               # データモデル型
│   └── next-auth.d.ts          # NextAuth型拡張
│
├── prisma/                     # Prismaスキーマ・マイグレーション
│   ├── schema.prisma           # DBスキーマ定義
│   ├── migrations/             # マイグレーションファイル
│   └── seed.ts                 # シードデータ
│
├── public/                     # 静的ファイル
│   ├── images/
│   └── fonts/
│
├── tests/                      # テストファイル
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local                  # 環境変数（Gitignore）
├── .env.example                # 環境変数サンプル
├── next.config.js              # Next.js設定
├── tailwind.config.ts          # Tailwind CSS設定
├── components.json             # shadcn/ui設定
├── tsconfig.json               # TypeScript設定
├── vitest.config.ts            # Vitest設定
├── package.json
└── README.md
```

### 主要ファイル説明

#### `app/layout.tsx`
ルートレイアウト。全ページで共通のHTML構造を定義。

#### `app/(dashboard)/layout.tsx`
認証済みユーザー向けのレイアウト。ヘッダー、サイドバーを含む。

#### `lib/prisma.ts`
Prisma Clientのシングルトンインスタンス。

#### `lib/auth.ts`
NextAuth.jsの設定。認証プロバイダー、コールバック等を定義。

#### `prisma/schema.prisma`
データベーススキーマ。全テーブル定義を記述。

---

## 技術スタック

### コア技術

| カテゴリ | 技術 | バージョン | 備考 |
|---------|------|-----------|------|
| **言語** | TypeScript | 5.x | 型安全性を確保 |
| **フレームワーク** | Next.js (App Router) | 14.x+ | フルスタックReactフレームワーク |
| **ランタイム** | Node.js | 20.x | LTS版を使用 |

### フロントエンド

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| **UIライブラリ** | React | 18.x+ |
| **UIコンポーネント** | shadcn/ui | コンポーネントライブラリ |
| **スタイリング** | Tailwind CSS | ユーティリティファーストCSS |
| **フォーム** | React Hook Form | パフォーマンス重視 |
| **バリデーション** | Zod | TypeScript-firstスキーマ検証 |
| **状態管理** | Zustand / React Context | 軽量状態管理 |
| **アイコン** | Lucide React | shadcn/ui推奨アイコン |

### バックエンド（API Routes）

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| **API** | Next.js API Routes | App Router標準 |
| **認証** | NextAuth.js (Auth.js) | Next.js公式推奨 |
| **ORM** | Prisma | TypeScript-first ORM |
| **バリデーション** | Zod | リクエストボディ検証 |
| **APIスキーマ** | OpenAPI | Zodから自動生成可能 |

### データベース

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| **RDBMS** | PostgreSQL | 15.x以上（Cloud SQL） |
| **マイグレーション** | Prisma Migrate | スキーマ管理 |
| **シード** | Prisma Seed | 開発用データ投入 |

### テスト

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| **テストランナー** | Vitest | Vite互換の高速テスト |
| **コンポーネントテスト** | React Testing Library | ユーザー視点のテスト |
| **E2Eテスト** | Playwright | ブラウザ自動化 |
| **モック** | MSW | APIモック |

### 開発ツール

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| **Linter** | ESLint | Next.js標準設定 |
| **Formatter** | Prettier | コード整形 |
| **型チェック** | TypeScript | tsc --noEmit |
| **Git Hooks** | Husky | コミット前チェック |
| **パッケージマネージャ** | npm / pnpm / yarn | いずれか選択 |

### インフラ・デプロイ

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| **ホスティング** | Google Cloud Run | コンテナベースホスティング |
| **データベース** | Cloud SQL for PostgreSQL | マネージドDB |
| **CI/CD** | GitHub Actions | 自動デプロイ |
| **コンテナ** | Docker | Cloud Run用イメージ作成 |
| **環境変数管理** | Cloud Secret Manager | 本番環境の秘匿情報 |
| **ドメイン/SSL** | Cloud Load Balancing | HTTPS自動設定 |

### パッケージ一覧（package.json想定）

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^4.24.0",
    "zod": "^3.22.0",
    "react-hook-form": "@hookform/resolvers": "^3.3.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "prisma": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "playwright": "^1.40.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## セットアップ手順

### 前提条件

- Node.js 20.x以上
- PostgreSQL 15.x（ローカル開発用）
- Git

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd daily-report
```

### 2. 依存関係のインストール

```bash
npm install
# または
pnpm install
# または
yarn install
```

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local`を編集して以下の環境変数を設定：

```bash
# データベース接続文字列
DATABASE_URL="postgresql://user:password@localhost:5432/daily_report_dev"

# NextAuth設定
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # openssl rand -base64 32で生成

# 本番環境のみ（Google Cloud Run）
# NEXTAUTH_URL="https://your-app.run.app"
```

### 4. データベースのセットアップ

```bash
# Prismaマイグレーション実行
npx prisma migrate dev

# Prisma Client生成
npx prisma generate

# シードデータ投入（開発環境のみ）
npx prisma db seed
```

### 5. shadcn/uiのセットアップ（初回のみ）

```bash
# shadcn/ui初期化
npx shadcn-ui@latest init

# 必要なコンポーネントをインストール
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
# 必要に応じて追加
```

### 6. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

### 7. その他の便利なコマンド

```bash
# Prisma Studioを起動（DB GUI）
npx prisma studio

# 型チェック
npm run type-check

# Lintチェック
npm run lint

# テスト実行
npm run test

# ビルド（本番用）
npm run build

# 本番モードで起動
npm run start
```

### テストアカウント（開発環境）

シードデータで以下のアカウントが作成されます：

| 役割 | メールアドレス | パスワード |
|------|---------------|-----------|
| 営業 | sales@test.com | Test1234! |
| 上長 | manager@test.com | Test1234! |
| 管理者 | admin@test.com | Admin1234! |

---

## 開発フロー

### 新機能開発

1. Issueを作成（GitHub/GitLab）
2. featureブランチを作成
   ```bash
   git checkout -b feature/issue-123-daily-report-export
   ```
3. 開発・テスト実装
4. コミット
   ```bash
   git add .
   git commit -m "feat: 日報エクスポート機能を追加"
   ```
5. プッシュ・PR作成
   ```bash
   git push origin feature/issue-123-daily-report-export
   ```
6. コードレビュー
7. developブランチへマージ
8. 動作確認後、mainブランチへマージ

### バグ修正

1. bugfixブランチを作成
   ```bash
   git checkout -b bugfix/issue-456-login-error
   ```
2. 修正・テスト
3. PR作成・レビュー
4. マージ

---

## トラブルシューティング

### データベース接続エラー

**問題**: `Error: P1001: Can't reach database server`

**解決策**:
1. PostgreSQLが起動しているか確認
   ```bash
   # macOS (Homebrew)
   brew services list
   brew services start postgresql@15

   # Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```
2. `.env.local`のDATABASE_URLを確認
3. データベースが作成されているか確認
   ```bash
   psql -U postgres -l
   createdb daily_report_dev
   ```

### Prismaマイグレーションエラー

**問題**: `Migration failed to apply`

**解決策**:
1. 既存のマイグレーションをリセット（開発環境のみ）
   ```bash
   npx prisma migrate reset
   ```
2. Prisma Clientを再生成
   ```bash
   npx prisma generate
   ```
3. スキーマを確認して再マイグレーション
   ```bash
   npx prisma migrate dev --name fix_schema
   ```

### NextAuth認証エラー

**問題**: `[next-auth][error][SIGNIN_EMAIL_ERROR]`

**解決策**:
1. `.env.local`のNEXTAUTH_SECRETが設定されているか確認
   ```bash
   # 新しいシークレットを生成
   openssl rand -base64 32
   ```
2. NEXTAUTH_URLが正しいか確認（開発: `http://localhost:3000`）
3. データベースにセッションテーブルが存在するか確認
   ```bash
   npx prisma studio
   ```

### ビルドエラー

**問題**: `Type error: Cannot find module`

**解決策**:
1. 型定義ファイルを確認
   ```bash
   npm run type-check
   ```
2. `node_modules`を再インストール
   ```bash
   rm -rf node_modules .next
   npm install
   npm run build
   ```

### Cloud Runデプロイエラー

**問題**: `Container failed to start`

**解決策**:
1. Dockerfileの`CMD`を確認（`npm run start`）
2. 環境変数が正しく設定されているか確認（Cloud Secret Manager）
3. データベース接続文字列を確認（Cloud SQL接続）
4. ビルドログを確認
   ```bash
   gcloud run logs read SERVICE_NAME --limit=50
   ```

---

## 今後の拡張性

### Phase 2 機能（将来的に追加予定）

1. **統計・分析機能**
   - 訪問件数の集計
   - 顧客別訪問履歴
   - 営業担当者別パフォーマンス

2. **通知機能**
   - 新しいコメントの通知
   - 日報未提出のリマインダー
   - メール通知

3. **エクスポート機能**
   - PDF出力
   - Excel出力
   - 期間指定での一括出力

4. **モバイルアプリ**
   - React Native / Flutter
   - オフライン対応

5. **承認ワークフロー**
   - 日報の承認フロー
   - 承認履歴の管理

---

## 参考資料

### 内部ドキュメント
- [画面定義書](./screen-specification.md)
- [API仕様書](./api-specification.md)
- [テスト仕様書](./test-specification.md)

### 公式ドキュメント

**コアフレームワーク:**
- Next.js公式ドキュメント: https://nextjs.org/docs
- React公式ドキュメント: https://react.dev/
- TypeScript公式ドキュメント: https://www.typescriptlang.org/docs/

**UI/スタイリング:**
- shadcn/ui: https://ui.shadcn.com/
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/

**データベース/ORM:**
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs/

**認証:**
- NextAuth.js: https://next-auth.js.org/

**バリデーション/フォーム:**
- Zod: https://zod.dev/
- React Hook Form: https://react-hook-form.com/

**テスト:**
- Vitest: https://vitest.dev/
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev/

**デプロイ:**
- Google Cloud Run: https://cloud.google.com/run/docs
- Cloud SQL: https://cloud.google.com/sql/docs

### 有用なリソース

- Next.js Examples: https://github.com/vercel/next.js/tree/canary/examples
- shadcn/ui Examples: https://ui.shadcn.com/examples
- Prisma Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference

---

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|------|--------|--------|----------|
| 1.0 | 2026-01-04 | - | 初版作成 |
| 1.1 | 2026-01-04 | - | 技術スタックをNext.js + Prisma + shadcn/ui構成に変更 |

---

## ライセンス

TBD

## お問い合わせ

プロジェクトに関する質問や提案は、Issueまたはプロジェクトオーナーまでお問い合わせください。
