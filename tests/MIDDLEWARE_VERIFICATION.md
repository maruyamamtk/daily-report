# Middleware テスト・検証ガイド

このドキュメントでは、Next.js Middleware の認証機能をテスト・検証する方法を説明します。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. テストの実行

```bash
# 全てのテストを実行
npm test

# Watchモードでテストを実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

## NextAuth v4 互換性確認

### 現在の構成

- **NextAuth バージョン**: v4.24.0 (`package.json`で確認)
- **Next.js バージョン**: v14.2.0
- **セッション戦略**: JWT (`lib/auth.ts`で設定)

### 互換性チェックリスト

- [x] NextAuth v4.24.0を使用
- [x] `withAuth` middleware wrapperを使用 (`next-auth/middleware`からインポート)
- [x] JWT session strategyを設定
- [x] カスタムJWTコールバックでロール情報を追加
- [x] Middleware内で `req.nextauth.token` からトークンにアクセス

### 既知の制限事項

NextAuth v4は Next.js 14 (App Router) で動作しますが、以下の点に注意が必要です：

1. **NextAuth v5 (Auth.js) への移行推奨**:
   - NextAuth v5はNext.js 14+に最適化されています
   - v4も動作しますが、将来的にはv5への移行を検討してください

2. **Middleware でのセッションアクセス**:
   - v4では `req.nextauth.token` でJWTトークンにアクセス
   - セッションデータの取得には制限があります（APIルートやServer Componentsでは完全なセッション取得が可能）

## 手動テスト手順

### 1. ルートパス (/) のリダイレクト

**未認証ユーザー:**
```bash
# ブラウザでアクセス
http://localhost:3000/

# 期待される動作: /login へリダイレクト
```

**認証済みユーザー:**
```bash
# ログイン後、ブラウザでアクセス
http://localhost:3000/

# 期待される動作: /dashboard へリダイレクト
```

### 2. ログインページのリダイレクト

**認証済みユーザー:**
```bash
http://localhost:3000/login

# 期待される動作: /dashboard へリダイレクト
```

### 3. 保護されたルートへのアクセス

**未認証ユーザー:**
```bash
http://localhost:3000/dashboard
http://localhost:3000/daily-reports
http://localhost:3000/customers

# 期待される動作: /login へリダイレクト
```

**認証済みユーザー:**
```bash
# 期待される動作: 通常通りアクセス可能
```

### 4. RBAC - /employees ルート

**営業・上長ロールのユーザー:**
```bash
http://localhost:3000/employees

# 期待される動作: /dashboard へリダイレクト
```

**管理者ロールのユーザー:**
```bash
http://localhost:3000/employees

# 期待される動作: 通常通りアクセス可能
```

## テストアカウント

開発環境では以下のテストアカウントを使用できます（`prisma db seed`実行後）:

| 役割 | メールアドレス | パスワード | アクセス権限 |
|------|---------------|-----------|-------------|
| 営業 | sales@test.com | Test1234! | 自分の日報のみ |
| 上長 | manager@test.com | Test1234! | 自分と部下の日報 |
| 管理者 | admin@test.com | Admin1234! | 全データ + マスタ管理 |

## 自動テストの実装内容

`tests/middleware.test.ts` には以下のテストが含まれています:

### テストスイート

1. **Root Path (/) Handling**
   - 認証済みユーザーの /dashboard へのリダイレクト
   - 未認証ユーザーの /login へのリダイレクト

2. **Login Page Redirect**
   - 認証済みユーザーが /login にアクセスした場合のリダイレクト
   - 未認証ユーザーの /login アクセス許可

3. **Protected Routes**
   - 保護されたルート (dashboard, daily-reports, customers, employees) のアクセス制御

4. **Role-Based Access Control (RBAC)**
   - 管理者の /employees アクセス許可
   - 営業・上長の /employees アクセス拒否

5. **Public Routes**
   - 公開ルート (/api/auth/*, /_next/*, static files) の除外

6. **NextAuth v4 Compatibility**
   - NextAuth v4.24.0の使用確認
   - JWT session strategyの確認
   - ロールフィールドの存在確認

7. **Middleware Configuration**
   - Matcher patternの検証
   - SignInページ設定の確認

## トラブルシューティング

### テストが失敗する場合

1. **依存関係の再インストール**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript型エラー**
   ```bash
   npm run type-check
   ```

3. **Prisma Clientの再生成**
   ```bash
   npm run prisma:generate
   ```

### Middleware が動作しない場合

1. **環境変数の確認**
   ```bash
   # .env.local に以下が設定されているか確認
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   DATABASE_URL=postgresql://...
   ```

2. **Next.js サーバーの再起動**
   ```bash
   npm run dev
   ```

3. **ブラウザのキャッシュとCookieをクリア**
   - 認証トークンが古い場合、動作が不安定になることがあります

## CI/CD での実行

GitHub Actions などのCI環境でテストを実行する場合:

```yaml
- name: Install dependencies
  run: npm ci

- name: Run tests
  run: npm test

- name: Type check
  run: npm run type-check
```

## 次のステップ

- [ ] E2Eテスト (Playwright) で実際のブラウザ動作を検証
- [ ] NextAuth v5 (Auth.js) への移行を検討
- [ ] Matcher patternの最適化（明示的なパス指定）
- [ ] Rate limiting の実装（ブルートフォース攻撃対策）
