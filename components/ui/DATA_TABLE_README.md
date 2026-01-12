# DataTableコンポーネント

一覧表示用の汎用的なテーブルコンポーネントです。ソート、検索、ページネーション機能を備えています。

## 機能

### ✅ 実装済み機能

- **ページネーション**
  - 前へ/次へボタン
  - ページ番号選択
  - 表示件数変更（10, 20, 30, 50, 100件）
  - 表示中のアイテム範囲表示

- **ソート機能**
  - クリックで昇順/降順/未ソートを切り替え
  - カラムごとにソート可能/不可を設定可能
  - ソート状態をアイコンで表示

- **検索フィルター**
  - 全カラムを横断的に検索
  - リアルタイム検索
  - 検索時は自動的に最初のページに戻る

- **アクションボタン**
  - カラム定義で自由にボタンを配置可能
  - 編集、削除、詳細表示など任意のアクションを実装可能
  - イベントバブリングの制御

- **レスポンシブデザイン**
  - モバイルでは横スクロール可能
  - Tailwind CSSによる柔軟なスタイリング

- **その他**
  - 空データ時のメッセージ表示
  - 行クリックイベント
  - カスタムクラス名の適用

## 基本的な使い方

### 1. 型定義

```typescript
interface DailyReport {
  id: number;
  reportDate: string;
  employeeName: string;
  visitCount: number;
  commentCount: number;
}
```

### 2. カラム定義

```typescript
import { ColumnDef } from "@/components/ui/data-table";

const columns: ColumnDef<DailyReport>[] = [
  {
    id: "reportDate",
    header: "報告日",
    accessor: "reportDate",
    sortable: true,
    className: "font-medium",
  },
  {
    id: "employeeName",
    header: "営業担当者",
    accessor: "employeeName",
    sortable: true,
  },
  {
    id: "visitCount",
    header: "訪問件数",
    accessor: "visitCount",
    sortable: true,
    className: "text-center",
  },
];
```

### 3. テーブルの表示

```typescript
import { DataTable } from "@/components/ui/data-table";

export function DailyReportList() {
  const reports: DailyReport[] = [
    // データを取得
  ];

  return (
    <DataTable
      columns={columns}
      data={reports}
      searchable={true}
      searchPlaceholder="日報を検索..."
      emptyMessage="日報が見つかりませんでした"
    />
  );
}
```

## アクションボタンの実装

カラム定義でReactコンポーネントを返すことで、アクションボタンを実装できます。

```typescript
const columns: ColumnDef<DailyReport>[] = [
  // ... 他のカラム
  {
    id: "actions",
    header: "操作",
    accessor: (row) => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // 行クリックイベントを抑制
            handleEdit(row.id);
          }}
        >
          <Edit className="h-4 w-4 mr-1" />
          編集
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
    sortable: false,
  },
];
```

## プロパティ

### DataTableProps

| プロパティ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `columns` | `ColumnDef<T>[]` | ○ | - | カラム定義の配列 |
| `data` | `T[]` | ○ | - | 表示するデータの配列 |
| `searchable` | `boolean` | - | `false` | 検索機能を有効にするか |
| `searchPlaceholder` | `string` | - | `"検索..."` | 検索ボックスのプレースホルダー |
| `emptyMessage` | `string` | - | `"データがありません"` | データが空の時のメッセージ |
| `className` | `string` | - | - | コンテナのクラス名 |
| `onRowClick` | `(row: T) => void` | - | - | 行クリック時のコールバック |
| `rowClassName` | `string \| ((row: T) => string)` | - | - | 行のクラス名 |

### ColumnDef

| プロパティ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `id` | `string` | ○ | - | カラムの一意なID |
| `header` | `string` | ○ | - | ヘッダーに表示するテキスト |
| `accessor` | `keyof T \| ((row: T) => React.ReactNode)` | ○ | - | データのアクセサーまたはレンダー関数 |
| `sortable` | `boolean` | - | `false` | ソート可能にするか |
| `sortValue` | `(row: T) => string \| number \| Date` | - | - | ソート時に使用する値を取得する関数。accessorが関数でReactNodeを返す場合に必須 |
| `searchValue` | `(row: T) => string` | - | - | 検索時に使用する値を取得する関数。accessorが関数でReactNodeを返す場合に推奨 |
| `className` | `string` | - | - | セルのクラス名 |
| `headerClassName` | `string` | - | - | ヘッダーセルのクラス名 |

## 高度な使い方

### 1. カスタムセルレンダリング

```typescript
{
  id: "status",
  header: "ステータス",
  accessor: (row) => (
    <Badge variant={row.status === "active" ? "default" : "secondary"}>
      {row.status === "active" ? "有効" : "無効"}
    </Badge>
  ),
  sortable: false,
}
```

### 2. 条件付きスタイリング

```typescript
<DataTable
  columns={columns}
  data={reports}
  rowClassName={(row) =>
    row.hasUnread ? "bg-blue-50 hover:bg-blue-100" : ""
  }
/>
```

### 3. 複雑な条件表示

```typescript
{
  id: "commentCount",
  header: "コメント数",
  accessor: (row) => (
    <div className="flex items-center gap-2">
      <span>{row.commentCount}</span>
      {row.hasUnread && (
        <Badge variant="destructive" className="h-5 px-1.5 text-xs">
          未読
        </Badge>
      )}
    </div>
  ),
  sortable: false,
}
```

## 各画面での使用例

### S-03: 日報一覧画面

- ソート: 報告日、営業担当者、訪問件数
- 検索: 全項目横断検索
- アクション: 詳細、編集、削除ボタン
- 未読バッジの表示

詳細な実装例は `data-table-example.tsx` の `DailyReportTableExample` を参照してください。

### S-06: 顧客一覧画面

- ソート: 顧客名、担当営業
- 検索: 顧客名、住所、電話番号
- アクション: 編集、削除ボタン

詳細な実装例は `data-table-example.tsx` の `CustomerTableExample` を参照してください。

### S-08: 営業マスタ一覧画面

顧客一覧と同様の実装パターンが利用できます。

## レスポンシブ対応

テーブルは自動的に横スクロール可能になります。モバイル表示での最適化が必要な場合は、以下のアプローチを検討してください：

1. **カードレイアウトへの切り替え**（ブレークポイントで表示を切り替え）
2. **重要なカラムのみ表示**（`hidden md:table-cell` などのクラスを使用）
3. **折りたたみ可能な詳細行**（必要に応じて実装）

## 注意事項とベストプラクティス

### 関数型accessorを使用する場合

`accessor`に関数を使用してReactNodeを返す場合、ソートと検索には以下の対応が必要です：

#### ソートを有効にする場合

`sortValue`関数を必ず定義してください。定義しない場合、ソートが無効化され、警告が表示されます。

```typescript
{
  id: "status",
  header: "ステータス",
  accessor: (row) => (
    <Badge variant={row.status === "active" ? "default" : "secondary"}>
      {row.status === "active" ? "有効" : "無効"}
    </Badge>
  ),
  sortable: true,
  sortValue: (row) => row.status, // ソート用の値を返す
}
```

#### 検索を有効にする場合

`searchValue`関数を定義してください。定義しない場合、そのカラムは検索対象外になります。

```typescript
{
  id: "commentCount",
  header: "コメント数",
  accessor: (row) => (
    <div className="flex items-center gap-2">
      <span>{row.commentCount}</span>
      {row.hasUnread && <Badge variant="destructive">未読</Badge>}
    </div>
  ),
  searchValue: (row) => String(row.commentCount), // 検索用の値を返す
}
```

### その他の注意事項

- アクションボタン内のクリックイベントでは `e.stopPropagation()` を呼び出して行クリックを防ぐ必要があります
- ソート変更時は自動的に最初のページに戻ります
- 大量データ（1000件以上）の場合はサーバーサイドページネーションの実装を推奨します

## 今後の拡張案

以下の機能は必要に応じて実装を検討してください：

- [ ] カラムの表示/非表示切り替え
- [ ] カラム幅のリサイズ
- [ ] 行の複数選択（チェックボックス）
- [ ] CSVエクスポート
- [ ] サーバーサイドページネーション対応
- [ ] カラムの並び替え（ドラッグ&ドロップ）
- [ ] フィルター機能の強化（日付範囲、セレクトボックスなど）

## ファイル一覧

- `data-table.tsx` - メインコンポーネント
- `data-table-example.tsx` - 使用例（3パターン）
- `DATA_TABLE_README.md` - このドキュメント

## 参考

- shadcn/ui Table: https://ui.shadcn.com/docs/components/table
- shadcn/ui Data Table: https://ui.shadcn.com/docs/components/data-table
