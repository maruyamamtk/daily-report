# ダイアログとトースト通知の実装ガイド

このドキュメントでは、営業日報システムで実装されたダイアログとトースト通知の使用方法を説明します。

## 概要

Issue #13 で実装された機能:
- ✅ 削除確認ダイアログコンポーネント
- ✅ 汎用ダイアログコンポーネント（フォーム用）
- ✅ トースト通知の設定
- ✅ 成功/エラー/警告/情報通知の実装

## トースト通知

### 基本的な使い方

トースト通知は `lib/toast.ts` で定義されたヘルパー関数を使用します。

```typescript
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from "@/lib/toast";

// 成功通知（緑）
showSuccessToast("保存しました", "データが正常に保存されました");

// エラー通知（赤）
showErrorToast("エラーが発生しました", "データの保存に失敗しました");

// 警告通知（黄）
showWarningToast("警告", "この操作は慎重に行ってください");

// 情報通知（青）
showInfoToast("お知らせ", "新しい通知があります");
```

### 統合インポート

簡単のため、`lib/notifications.ts` から一括でインポートできます:

```typescript
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from "@/lib/notifications";
```

### トーストの特徴

- **自動消去**: トーストは自動的に消えます
- **スタイル**: 各タイプに応じた色とアイコン
- **位置**: 画面右下（モバイルでは上部）に表示
- **アニメーション**: スムーズなフェードイン/アウト

## ダイアログ

### 1. 削除確認ダイアログ（AlertDialog）

削除操作など、重要なアクションの確認に使用します。

#### 基本的な使い方

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  useConfirmationDialog,
  showSuccessToast,
  showErrorToast,
} from "@/lib/notifications";

export function DeleteButton({ reportId }: { reportId: number }) {
  const deleteDialog = useConfirmationDialog();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/daily-reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("削除に失敗しました");

      showSuccessToast("日報を削除しました");
      // 画面遷移や再読み込みなど
    } catch (error) {
      showErrorToast("削除に失敗しました", "もう一度お試しください");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={deleteDialog.open}>
        削除
      </Button>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => (open ? deleteDialog.open() : deleteDialog.close())}
        title="削除確認"
        description="本当に削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
        variant="destructive"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}
```

#### AlertDialog プロパティ

| プロパティ | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| `open` | `boolean` | ✅ | - | ダイアログの表示状態 |
| `onOpenChange` | `(open: boolean) => void` | ✅ | - | 表示状態の変更ハンドラ |
| `title` | `string` | ✅ | - | ダイアログのタイトル |
| `description` | `string` | ✅ | - | 説明文 |
| `confirmText` | `string` | ❌ | "確認" | 確認ボタンのテキスト |
| `cancelText` | `string` | ❌ | "キャンセル" | キャンセルボタンのテキスト |
| `variant` | `"default" \| "destructive"` | ❌ | "default" | ボタンのスタイル |
| `onConfirm` | `() => void \| Promise<void>` | ✅ | - | 確認時の処理 |
| `loading` | `boolean` | ❌ | false | ローディング状態 |

### 2. フォームダイアログ（FormDialog）

モーダルでフォームを表示する際に使用します。

#### 基本的な使い方

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog, showSuccessToast } from "@/lib/notifications";

export function CreateCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: name }),
      });

      if (!response.ok) throw new Error("登録に失敗しました");

      showSuccessToast("顧客を登録しました", `${name}を登録しました`);
      setOpen(false);
      setName("");
    } catch (error) {
      showErrorToast("登録に失敗しました");
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>新規顧客登録</Button>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="顧客登録"
        description="新しい顧客を登録します"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              顧客名 <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="株式会社サンプル"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit">登録</Button>
          </div>
        </form>
      </FormDialog>
    </>
  );
}
```

#### FormDialog プロパティ

| プロパティ | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| `open` | `boolean` | ✅ | - | ダイアログの表示状態 |
| `onOpenChange` | `(open: boolean) => void` | ✅ | - | 表示状態の変更ハンドラ |
| `title` | `string` | ✅ | - | ダイアログのタイトル |
| `description` | `string` | ❌ | - | 説明文（オプション） |
| `children` | `React.ReactNode` | ✅ | - | フォームの内容 |
| `maxWidth` | `"sm" \| "md" \| "lg" \| "xl" \| "2xl"` | ❌ | "lg" | ダイアログの最大幅 |

## ベストプラクティス

### 1. 削除操作

screen-specification.md の共通仕様に従い、削除操作時は必ず確認ダイアログを表示します:

```typescript
// ❌ 悪い例: 確認なしで削除
<Button onClick={handleDelete}>削除</Button>

// ✅ 良い例: 確認ダイアログを表示
<Button onClick={deleteDialog.open}>削除</Button>
<AlertDialog
  title="削除確認"
  description="本当に削除しますか？この操作は取り消せません。"
  variant="destructive"
  onConfirm={handleDelete}
  {...props}
/>
```

### 2. エラーハンドリング

システムエラーはトースト通知で表示します:

```typescript
try {
  const response = await fetch("/api/daily-reports", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("保存に失敗しました");
  }

  showSuccessToast("日報を保存しました");
} catch (error) {
  // システムエラーはトースト通知
  showErrorToast(
    "保存に失敗しました",
    error instanceof Error ? error.message : "もう一度お試しください"
  );
}
```

### 3. ローディング状態

非同期処理中はボタンを無効化し、ローディング状態を表示します:

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await fetch(/* ... */);
  } finally {
    setLoading(false);
  }
};

<AlertDialog
  loading={loading}
  onConfirm={handleSubmit}
  {...props}
/>
```

### 4. ダイアログ外クリックで閉じる

デフォルトで、ダイアログの外側をクリックすると閉じます。この動作は Radix UI Dialog の標準機能です。

無効化する場合:

```typescript
// Dialog コンポーネントを直接使用する場合
<Dialog modal={false}>
  {/* ... */}
</Dialog>
```

## 実装例

実際の使用例は以下のファイルを参照してください:

- `components/examples/dialog-toast-examples.tsx` - 各種使用例
- `lib/toast.ts` - トースト通知のヘルパー関数
- `components/ui/alert-dialog.tsx` - 確認ダイアログコンポーネント
- `components/ui/form-dialog.tsx` - フォームダイアログコンポーネント
- `hooks/use-confirmation-dialog.ts` - 確認ダイアログのフック

## 技術的な詳細

### 使用ライブラリ

- **Radix UI Dialog**: `@radix-ui/react-dialog` - アクセシブルなダイアログコンポーネント
- **Radix UI Toast**: `@radix-ui/react-toast` - トースト通知システム
- **shadcn/ui**: UIコンポーネントライブラリ
- **Tailwind CSS**: スタイリング

### トーストの設定

- **最大表示数**: 1件（`TOAST_LIMIT = 1`）
- **自動消去時間**: 非常に長い（`TOAST_REMOVE_DELAY = 1000000ms`）
- **位置**: 右下（モバイル: 上部）

### カスタマイズ

トーストのスタイルをカスタマイズする場合は `lib/toast.ts` を編集:

```typescript
export function showSuccessToast(message: string, description?: string) {
  return toast({
    title: message,
    description,
    variant: "default",
    // カスタムクラスを追加
    className: "border-green-500 bg-green-50 text-green-900",
  });
}
```

## トラブルシューティング

### トーストが表示されない

1. `app/layout.tsx` に `<Toaster />` が追加されているか確認
2. コンポーネントで `"use client"` ディレクティブが必要な場合があります

### ダイアログが開かない

1. `open` 状態が正しく管理されているか確認
2. `onOpenChange` ハンドラが正しく実装されているか確認

### スタイルが適用されない

1. Tailwind CSS の設定が正しいか確認
2. `className` のオーバーライドが意図したものか確認

## まとめ

- **削除操作**: 必ず `AlertDialog` で確認
- **エラー**: `showErrorToast` で通知
- **成功**: `showSuccessToast` で通知
- **フォーム**: `FormDialog` でモーダル表示
- **ローディング**: `loading` プロパティで状態管理

これらのコンポーネントを使用することで、一貫性のあるUXを提供できます。
