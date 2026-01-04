# 営業日報システム API仕様書

## 目次
1. [API概要](#api概要)
2. [共通仕様](#共通仕様)
3. [認証API](#認証api)
4. [日報API](#日報api)
5. [訪問記録API](#訪問記録api)
6. [コメントAPI](#コメントapi)
7. [顧客マスタAPI](#顧客マスタapi)
8. [営業マスタAPI](#営業マスタapi)
9. [エラーコード一覧](#エラーコード一覧)

---

## API概要

### ベースURL
```
https://api.example.com/v1
```

### プロトコル
- HTTPS

### データフォーマット
- リクエスト: JSON
- レスポンス: JSON

### 文字コード
- UTF-8

---

## 共通仕様

### 認証方式
- JWT (JSON Web Token) を使用
- ログイン後、レスポンスで取得したトークンを以降のリクエストで使用
- トークンはHTTPヘッダー `Authorization` に設定

```
Authorization: Bearer {token}
```

### 共通リクエストヘッダー

| ヘッダー名 | 値 | 必須 | 備考 |
|-----------|-----|------|------|
| Content-Type | application/json | ○ | POST/PUTの場合 |
| Authorization | Bearer {token} | △ | 認証が必要なAPIの場合 |

### 共通レスポンスヘッダー

| ヘッダー名 | 値 |
|-----------|-----|
| Content-Type | application/json; charset=utf-8 |

### HTTPステータスコード

| コード | 意味 | 説明 |
|--------|------|------|
| 200 | OK | リクエスト成功 |
| 201 | Created | リソース作成成功 |
| 204 | No Content | リクエスト成功（レスポンスボディなし） |
| 400 | Bad Request | リクエストパラメータ不正 |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 権限エラー |
| 404 | Not Found | リソースが存在しない |
| 409 | Conflict | リソースの競合 |
| 422 | Unprocessable Entity | バリデーションエラー |
| 500 | Internal Server Error | サーバー内部エラー |

### エラーレスポンス形式

全てのエラーレスポンスは以下の形式で返却されます。

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": [
      {
        "field": "フィールド名",
        "message": "詳細メッセージ"
      }
    ]
  }
}
```

### ページネーション

一覧取得APIでは、以下のクエリパラメータでページネーションを制御できます。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| page | integer | 1 | ページ番号 |
| limit | integer | 20 | 1ページあたりの件数（最大100） |

レスポンスには以下のメタ情報が含まれます。

```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "total_pages": 10,
    "total_count": 200,
    "limit": 20
  }
}
```

---

## 認証API

### POST /api/auth/login
ログイン認証を行い、アクセストークンを取得します。

#### リクエスト

**認証:** 不要

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| email | string | ○ | メールアドレス |
| password | string | ○ | パスワード |

#### レスポンス

**成功時 (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "employee_id": 1,
    "name": "山田太郎",
    "email": "user@example.com",
    "department": "営業部",
    "position": "営業",
    "manager_id": 5
  }
}
```

**エラー時 (401 Unauthorized):**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

---

### POST /api/auth/logout
ログアウトします。

#### リクエスト

**認証:** 必要

**リクエストボディ:** なし

#### レスポンス

**成功時 (204 No Content):**

レスポンスボディなし

---

### GET /api/auth/me
ログイン中のユーザー情報を取得します。

#### リクエスト

**認証:** 必要

#### レスポンス

**成功時 (200 OK):**
```json
{
  "employee_id": 1,
  "name": "山田太郎",
  "email": "user@example.com",
  "department": "営業部",
  "position": "営業",
  "manager_id": 5,
  "manager_name": "鈴木一郎"
}
```

---

## 日報API

### GET /api/daily-reports
日報の一覧を取得します。

#### リクエスト

**認証:** 必要

**権限:**
- 営業: 自分の日報のみ取得
- 上長: 自分と部下の日報を取得
- 管理者: 全日報を取得

**クエリパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| date_from | string (date) | - | 報告日From (YYYY-MM-DD) |
| date_to | string (date) | - | 報告日To (YYYY-MM-DD) |
| employee_id | integer | - | 営業担当者ID（上長・管理者のみ） |
| page | integer | - | ページ番号（デフォルト: 1） |
| limit | integer | - | 1ページあたりの件数（デフォルト: 20） |

#### レスポンス

**成功時 (200 OK):**
```json
{
  "data": [
    {
      "report_id": 1,
      "employee_id": 1,
      "employee_name": "山田太郎",
      "report_date": "2026-01-04",
      "visit_count": 3,
      "comment_count": 2,
      "unread_comment_count": 1,
      "created_at": "2026-01-04T18:30:00Z",
      "updated_at": "2026-01-04T19:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 100,
    "limit": 20
  }
}
```

---

### GET /api/daily-reports/:id
日報の詳細を取得します。

#### リクエスト

**認証:** 必要

**権限:**
- 営業: 自分の日報のみ取得
- 上長: 自分と部下の日報を取得
- 管理者: 全日報を取得

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 日報ID |

#### レスポンス

**成功時 (200 OK):**
```json
{
  "report_id": 1,
  "employee_id": 1,
  "employee_name": "山田太郎",
  "report_date": "2026-01-04",
  "problem": "A社の予算確保が難航している。上層部への説得材料が必要。",
  "plan": "B社への提案資料を完成させる。C社とアポイントを取る。",
  "visits": [
    {
      "visit_id": 1,
      "customer_id": 10,
      "customer_name": "株式会社A",
      "visit_time": "10:00",
      "visit_content": "新製品の提案を実施。興味は示しているが、予算面で検討中。",
      "created_at": "2026-01-04T18:30:00Z"
    },
    {
      "visit_id": 2,
      "customer_id": 15,
      "customer_name": "株式会社B",
      "visit_time": "14:00",
      "visit_content": "見積もりを提出。来週中に回答をいただける予定。",
      "created_at": "2026-01-04T18:30:00Z"
    }
  ],
  "comments": [
    {
      "comment_id": 1,
      "commenter_id": 5,
      "commenter_name": "鈴木一郎",
      "comment_content": "A社については来週フォローアップをお願いします。",
      "created_at": "2026-01-04T20:00:00Z"
    }
  ],
  "created_at": "2026-01-04T18:30:00Z",
  "updated_at": "2026-01-04T19:00:00Z"
}
```

**エラー時 (404 Not Found):**
```json
{
  "error": {
    "code": "REPORT_NOT_FOUND",
    "message": "日報が見つかりません"
  }
}
```

---

### POST /api/daily-reports
日報を作成します。

#### リクエスト

**認証:** 必要

**権限:** 営業、上長

**リクエストボディ:**
```json
{
  "report_date": "2026-01-04",
  "problem": "A社の予算確保が難航している。",
  "plan": "B社への提案資料を完成させる。",
  "visits": [
    {
      "customer_id": 10,
      "visit_time": "10:00",
      "visit_content": "新製品の提案を実施。"
    },
    {
      "customer_id": 15,
      "visit_time": "14:00",
      "visit_content": "見積もりを提出。"
    }
  ]
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| report_date | string (date) | ○ | 報告日 (YYYY-MM-DD) |
| problem | string | - | 課題・相談（最大1000文字） |
| plan | string | - | 明日の予定（最大1000文字） |
| visits | array | ○ | 訪問記録（最低1件必須） |
| visits[].customer_id | integer | ○ | 顧客ID |
| visits[].visit_time | string (time) | ○ | 訪問時刻 (HH:MM) |
| visits[].visit_content | string | ○ | 訪問内容（最大500文字） |

#### レスポンス

**成功時 (201 Created):**
```json
{
  "report_id": 1,
  "employee_id": 1,
  "employee_name": "山田太郎",
  "report_date": "2026-01-04",
  "problem": "A社の予算確保が難航している。",
  "plan": "B社への提案資料を完成させる。",
  "visits": [
    {
      "visit_id": 1,
      "customer_id": 10,
      "customer_name": "株式会社A",
      "visit_time": "10:00",
      "visit_content": "新製品の提案を実施。",
      "created_at": "2026-01-04T18:30:00Z"
    }
  ],
  "comments": [],
  "created_at": "2026-01-04T18:30:00Z",
  "updated_at": "2026-01-04T18:30:00Z"
}
```

**エラー時 (422 Unprocessable Entity):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": [
      {
        "field": "report_date",
        "message": "報告日は必須です"
      },
      {
        "field": "visits",
        "message": "訪問記録は最低1件必要です"
      }
    ]
  }
}
```

**エラー時 (409 Conflict):**
```json
{
  "error": {
    "code": "REPORT_ALREADY_EXISTS",
    "message": "指定日の日報は既に作成されています"
  }
}
```

---

### PUT /api/daily-reports/:id
日報を更新します。

#### リクエスト

**認証:** 必要

**権限:** 自分の日報のみ更新可能

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 日報ID |

**リクエストボディ:**
```json
{
  "report_date": "2026-01-04",
  "problem": "A社の予算確保が難航している。上層部への説得材料が必要。",
  "plan": "B社への提案資料を完成させる。C社とアポイントを取る。",
  "visits": [
    {
      "visit_id": 1,
      "customer_id": 10,
      "visit_time": "10:00",
      "visit_content": "新製品の提案を実施。興味は示しているが、予算面で検討中。"
    },
    {
      "customer_id": 15,
      "visit_time": "14:00",
      "visit_content": "見積もりを提出。来週中に回答をいただける予定。"
    }
  ]
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| report_date | string (date) | ○ | 報告日 (YYYY-MM-DD) |
| problem | string | - | 課題・相談（最大1000文字） |
| plan | string | - | 明日の予定（最大1000文字） |
| visits | array | ○ | 訪問記録（最低1件必須） |
| visits[].visit_id | integer | - | 訪問記録ID（既存の場合） |
| visits[].customer_id | integer | ○ | 顧客ID |
| visits[].visit_time | string (time) | ○ | 訪問時刻 (HH:MM) |
| visits[].visit_content | string | ○ | 訪問内容（最大500文字） |

**備考:**
- `visit_id` がある場合は更新、ない場合は新規作成
- リクエストボディに含まれない既存の訪問記録は削除される

#### レスポンス

**成功時 (200 OK):**
```json
{
  "report_id": 1,
  "employee_id": 1,
  "employee_name": "山田太郎",
  "report_date": "2026-01-04",
  "problem": "A社の予算確保が難航している。上層部への説得材料が必要。",
  "plan": "B社への提案資料を完成させる。C社とアポイントを取る。",
  "visits": [...],
  "comments": [...],
  "created_at": "2026-01-04T18:30:00Z",
  "updated_at": "2026-01-04T19:30:00Z"
}
```

**エラー時 (403 Forbidden):**
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "この日報を編集する権限がありません"
  }
}
```

---

### DELETE /api/daily-reports/:id
日報を削除します。

#### リクエスト

**認証:** 必要

**権限:** 自分の日報のみ削除可能

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 日報ID |

#### レスポンス

**成功時 (204 No Content):**

レスポンスボディなし

**エラー時 (403 Forbidden):**
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "この日報を削除する権限がありません"
  }
}
```

---

## 訪問記録API

### POST /api/daily-reports/:reportId/visits
日報に訪問記録を追加します。

#### リクエスト

**認証:** 必要

**権限:** 自分の日報にのみ追加可能

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| reportId | integer | 日報ID |

**リクエストボディ:**
```json
{
  "customer_id": 20,
  "visit_time": "16:00",
  "visit_content": "追加訪問の内容"
}
```

#### レスポンス

**成功時 (201 Created):**
```json
{
  "visit_id": 3,
  "customer_id": 20,
  "customer_name": "株式会社C",
  "visit_time": "16:00",
  "visit_content": "追加訪問の内容",
  "created_at": "2026-01-04T20:00:00Z"
}
```

---

### PUT /api/visits/:id
訪問記録を更新します。

#### リクエスト

**認証:** 必要

**権限:** 自分の日報の訪問記録のみ更新可能

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 訪問記録ID |

**リクエストボディ:**
```json
{
  "customer_id": 20,
  "visit_time": "16:30",
  "visit_content": "更新された訪問内容"
}
```

#### レスポンス

**成功時 (200 OK):**
```json
{
  "visit_id": 3,
  "customer_id": 20,
  "customer_name": "株式会社C",
  "visit_time": "16:30",
  "visit_content": "更新された訪問内容",
  "created_at": "2026-01-04T20:00:00Z"
}
```

---

### DELETE /api/visits/:id
訪問記録を削除します。

#### リクエスト

**認証:** 必要

**権限:** 自分の日報の訪問記録のみ削除可能

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 訪問記録ID |

#### レスポンス

**成功時 (204 No Content):**

レスポンスボディなし

**エラー時 (400 Bad Request):**
```json
{
  "error": {
    "code": "LAST_VISIT_CANNOT_DELETE",
    "message": "日報には最低1件の訪問記録が必要です"
  }
}
```

---

## コメントAPI

### GET /api/daily-reports/:reportId/comments
日報に対するコメント一覧を取得します。

#### リクエスト

**認証:** 必要

**権限:** 閲覧権限のある日報のコメントのみ取得可能

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| reportId | integer | 日報ID |

#### レスポンス

**成功時 (200 OK):**
```json
{
  "data": [
    {
      "comment_id": 1,
      "commenter_id": 5,
      "commenter_name": "鈴木一郎",
      "comment_content": "A社については来週フォローアップをお願いします。",
      "created_at": "2026-01-04T20:00:00Z"
    },
    {
      "comment_id": 2,
      "commenter_id": 5,
      "commenter_name": "鈴木一郎",
      "comment_content": "良い進捗ですね。",
      "created_at": "2026-01-04T21:00:00Z"
    }
  ]
}
```

---

### POST /api/daily-reports/:reportId/comments
日報に対してコメントを投稿します。

#### リクエスト

**認証:** 必要

**権限:** 上長、管理者

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| reportId | integer | 日報ID |

**リクエストボディ:**
```json
{
  "comment_content": "A社については来週フォローアップをお願いします。"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| comment_content | string | ○ | コメント内容（最大500文字） |

#### レスポンス

**成功時 (201 Created):**
```json
{
  "comment_id": 1,
  "commenter_id": 5,
  "commenter_name": "鈴木一郎",
  "comment_content": "A社については来週フォローアップをお願いします。",
  "created_at": "2026-01-04T20:00:00Z"
}
```

**エラー時 (403 Forbidden):**
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "コメントを投稿する権限がありません"
  }
}
```

---

### DELETE /api/comments/:id
コメントを削除します。

#### リクエスト

**認証:** 必要

**権限:** 自分が投稿したコメントのみ削除可能

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | コメントID |

#### レスポンス

**成功時 (204 No Content):**

レスポンスボディなし

---

## 顧客マスタAPI

### GET /api/customers
顧客一覧を取得します。

#### リクエスト

**認証:** 必要

**権限:** 営業、上長、管理者

**クエリパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| customer_name | string | - | 顧客名（部分一致検索） |
| assigned_employee_id | integer | - | 担当営業ID |
| page | integer | - | ページ番号（デフォルト: 1） |
| limit | integer | - | 1ページあたりの件数（デフォルト: 20） |

#### レスポンス

**成功時 (200 OK):**
```json
{
  "data": [
    {
      "customer_id": 10,
      "customer_name": "株式会社A",
      "address": "東京都渋谷区...",
      "phone": "03-1234-5678",
      "email": "contact@company-a.co.jp",
      "assigned_employee_id": 1,
      "assigned_employee_name": "山田太郎",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-12-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 50,
    "limit": 20
  }
}
```

---

### GET /api/customers/:id
顧客の詳細情報を取得します。

#### リクエスト

**認証:** 必要

**権限:** 営業、上長、管理者

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 顧客ID |

#### レスポンス

**成功時 (200 OK):**
```json
{
  "customer_id": 10,
  "customer_name": "株式会社A",
  "address": "東京都渋谷区...",
  "phone": "03-1234-5678",
  "email": "contact@company-a.co.jp",
  "assigned_employee_id": 1,
  "assigned_employee_name": "山田太郎",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-12-01T00:00:00Z"
}
```

**エラー時 (404 Not Found):**
```json
{
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "顧客が見つかりません"
  }
}
```

---

### POST /api/customers
顧客を新規作成します。

#### リクエスト

**認証:** 必要

**権限:** 営業、上長、管理者

**リクエストボディ:**
```json
{
  "customer_name": "株式会社A",
  "address": "東京都渋谷区...",
  "phone": "03-1234-5678",
  "email": "contact@company-a.co.jp",
  "assigned_employee_id": 1
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| customer_name | string | ○ | 顧客名（最大100文字） |
| address | string | - | 住所（最大200文字） |
| phone | string | - | 電話番号 |
| email | string | - | メールアドレス |
| assigned_employee_id | integer | ○ | 担当営業ID |

#### レスポンス

**成功時 (201 Created):**
```json
{
  "customer_id": 10,
  "customer_name": "株式会社A",
  "address": "東京都渋谷区...",
  "phone": "03-1234-5678",
  "email": "contact@company-a.co.jp",
  "assigned_employee_id": 1,
  "assigned_employee_name": "山田太郎",
  "created_at": "2026-01-04T20:00:00Z",
  "updated_at": "2026-01-04T20:00:00Z"
}
```

**エラー時 (422 Unprocessable Entity):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": [
      {
        "field": "customer_name",
        "message": "顧客名は必須です"
      },
      {
        "field": "email",
        "message": "メールアドレスの形式が正しくありません"
      }
    ]
  }
}
```

---

### PUT /api/customers/:id
顧客情報を更新します。

#### リクエスト

**認証:** 必要

**権限:** 営業、上長、管理者

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 顧客ID |

**リクエストボディ:**
```json
{
  "customer_name": "株式会社A",
  "address": "東京都渋谷区...",
  "phone": "03-1234-5678",
  "email": "contact@company-a.co.jp",
  "assigned_employee_id": 1
}
```

#### レスポンス

**成功時 (200 OK):**
```json
{
  "customer_id": 10,
  "customer_name": "株式会社A",
  "address": "東京都渋谷区...",
  "phone": "03-1234-5678",
  "email": "contact@company-a.co.jp",
  "assigned_employee_id": 1,
  "assigned_employee_name": "山田太郎",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2026-01-04T20:00:00Z"
}
```

---

### DELETE /api/customers/:id
顧客を削除します。

#### リクエスト

**認証:** 必要

**権限:** 営業、上長、管理者

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 顧客ID |

#### レスポンス

**成功時 (204 No Content):**

レスポンスボディなし

**エラー時 (409 Conflict):**
```json
{
  "error": {
    "code": "CUSTOMER_IN_USE",
    "message": "この顧客は訪問記録で使用されているため削除できません"
  }
}
```

---

## 営業マスタAPI

### GET /api/employees
営業（社員）一覧を取得します。

#### リクエスト

**認証:** 必要

**権限:** 管理者（一覧取得は管理者のみ。ただしプルダウン用の簡易取得APIは別途提供）

**クエリパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | - | 社員名（部分一致検索） |
| department | string | - | 部署 |
| page | integer | - | ページ番号（デフォルト: 1） |
| limit | integer | - | 1ページあたりの件数（デフォルト: 20） |

#### レスポンス

**成功時 (200 OK):**
```json
{
  "data": [
    {
      "employee_id": 1,
      "name": "山田太郎",
      "email": "yamada@example.com",
      "department": "営業部",
      "position": "営業",
      "manager_id": 5,
      "manager_name": "鈴木一郎",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-12-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 2,
    "total_count": 30,
    "limit": 20
  }
}
```

---

### GET /api/employees/options
営業の選択肢を取得します（プルダウン用の簡易API）。

#### リクエスト

**認証:** 必要

**権限:** 営業、上長、管理者

#### レスポンス

**成功時 (200 OK):**
```json
{
  "data": [
    {
      "employee_id": 1,
      "name": "山田太郎"
    },
    {
      "employee_id": 2,
      "name": "佐藤花子"
    }
  ]
}
```

---

### GET /api/employees/:id
営業（社員）の詳細情報を取得します。

#### リクエスト

**認証:** 必要

**権限:** 管理者

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 社員ID |

#### レスポンス

**成功時 (200 OK):**
```json
{
  "employee_id": 1,
  "name": "山田太郎",
  "email": "yamada@example.com",
  "department": "営業部",
  "position": "営業",
  "manager_id": 5,
  "manager_name": "鈴木一郎",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-12-01T00:00:00Z"
}
```

---

### POST /api/employees
営業（社員）を新規作成します。

#### リクエスト

**認証:** 必要

**権限:** 管理者

**リクエストボディ:**
```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "password": "password123",
  "department": "営業部",
  "position": "営業",
  "manager_id": 5
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | ○ | 社員名（最大50文字） |
| email | string | ○ | メールアドレス（ユニーク） |
| password | string | ○ | パスワード（最低8文字、英数字含む） |
| department | string | ○ | 部署 |
| position | string | ○ | 役職 |
| manager_id | integer | - | 上長ID |

#### レスポンス

**成功時 (201 Created):**
```json
{
  "employee_id": 1,
  "name": "山田太郎",
  "email": "yamada@example.com",
  "department": "営業部",
  "position": "営業",
  "manager_id": 5,
  "manager_name": "鈴木一郎",
  "created_at": "2026-01-04T20:00:00Z",
  "updated_at": "2026-01-04T20:00:00Z"
}
```

**エラー時 (409 Conflict):**
```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "このメールアドレスは既に使用されています"
  }
}
```

---

### PUT /api/employees/:id
営業（社員）情報を更新します。

#### リクエスト

**認証:** 必要

**権限:** 管理者

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 社員ID |

**リクエストボディ:**
```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "password": "newpassword123",
  "department": "営業部",
  "position": "主任",
  "manager_id": 5
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | ○ | 社員名（最大50文字） |
| email | string | ○ | メールアドレス |
| password | string | - | パスワード（変更する場合のみ） |
| department | string | ○ | 部署 |
| position | string | ○ | 役職 |
| manager_id | integer | - | 上長ID |

#### レスポンス

**成功時 (200 OK):**
```json
{
  "employee_id": 1,
  "name": "山田太郎",
  "email": "yamada@example.com",
  "department": "営業部",
  "position": "主任",
  "manager_id": 5,
  "manager_name": "鈴木一郎",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2026-01-04T20:00:00Z"
}
```

---

### DELETE /api/employees/:id
営業（社員）を削除します。

#### リクエスト

**認証:** 必要

**権限:** 管理者

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 社員ID |

#### レスポンス

**成功時 (204 No Content):**

レスポンスボディなし

**エラー時 (409 Conflict):**
```json
{
  "error": {
    "code": "EMPLOYEE_IN_USE",
    "message": "この社員は日報や顧客で使用されているため削除できません"
  }
}
```

---

## エラーコード一覧

| エラーコード | HTTPステータス | 説明 |
|------------|---------------|------|
| INVALID_CREDENTIALS | 401 | 認証情報が正しくない |
| UNAUTHORIZED | 401 | 認証が必要 |
| PERMISSION_DENIED | 403 | 権限がない |
| REPORT_NOT_FOUND | 404 | 日報が見つからない |
| CUSTOMER_NOT_FOUND | 404 | 顧客が見つからない |
| EMPLOYEE_NOT_FOUND | 404 | 社員が見つからない |
| VALIDATION_ERROR | 422 | バリデーションエラー |
| REPORT_ALREADY_EXISTS | 409 | 日報が既に存在する |
| EMAIL_ALREADY_EXISTS | 409 | メールアドレスが既に使用されている |
| CUSTOMER_IN_USE | 409 | 顧客が使用中のため削除不可 |
| EMPLOYEE_IN_USE | 409 | 社員が使用中のため削除不可 |
| LAST_VISIT_CANNOT_DELETE | 400 | 最後の訪問記録は削除不可 |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー |

---

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|------|--------|--------|----------|
| 1.0 | 2026-01-04 | - | 初版作成 |
