"use client";

/**
 * DataTableコンポーネントの使用例
 *
 * このファイルは、data-table.tsxコンポーネントの使い方を示すサンプルです。
 * 実際のプロジェクトでは、このコードを参考に各画面でテーブルを実装してください。
 */

import * as React from "react";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";

// サンプルデータの型定義
interface DailyReport {
  id: number;
  reportDate: string;
  employeeName: string;
  visitCount: number;
  commentCount: number;
  hasUnread: boolean;
}

// 使用例1: 日報一覧画面（S-03）の実装例
export function DailyReportTableExample() {
  // サンプルデータ
  const reports: DailyReport[] = [
    {
      id: 1,
      reportDate: "2026-01-10",
      employeeName: "山田太郎",
      visitCount: 3,
      commentCount: 2,
      hasUnread: true,
    },
    {
      id: 2,
      reportDate: "2026-01-09",
      employeeName: "田中花子",
      visitCount: 2,
      commentCount: 1,
      hasUnread: false,
    },
    // ... more data
  ];

  // カラム定義
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
    },
    {
      id: "actions",
      header: "操作",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleView(row.id);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            詳細
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
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

  // アクションハンドラー
  const handleView = (id: number) => {
    console.log("View report:", id);
    // 実装例: router.push(`/daily-reports/${id}`)
  };

  const handleEdit = (id: number) => {
    console.log("Edit report:", id);
    // 実装例: router.push(`/daily-reports/${id}/edit`)
  };

  const handleDelete = (id: number) => {
    console.log("Delete report:", id);
    // 実装例: 削除確認ダイアログを表示
  };

  const handleRowClick = (row: DailyReport) => {
    console.log("Row clicked:", row);
    // 行クリック時の処理（詳細画面への遷移など）
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">日報一覧</h1>
      <DataTable
        columns={columns}
        data={reports}
        searchable={true}
        searchPlaceholder="日報を検索..."
        emptyMessage="日報が見つかりませんでした"
        onRowClick={handleRowClick}
      />
    </div>
  );
}

// 使用例2: 顧客一覧画面（S-06）の実装例
interface Customer {
  id: number;
  customerName: string;
  address: string;
  phone: string;
  assignedEmployee: string;
}

export function CustomerTableExample() {
  const customers: Customer[] = [
    {
      id: 1,
      customerName: "株式会社サンプル",
      address: "東京都渋谷区...",
      phone: "03-1234-5678",
      assignedEmployee: "山田太郎",
    },
    // ... more data
  ];

  const columns: ColumnDef<Customer>[] = [
    {
      id: "customerName",
      header: "顧客名",
      accessor: "customerName",
      sortable: true,
      className: "font-medium",
    },
    {
      id: "address",
      header: "住所",
      accessor: "address",
      sortable: false,
    },
    {
      id: "phone",
      header: "電話番号",
      accessor: "phone",
      sortable: false,
    },
    {
      id: "assignedEmployee",
      header: "担当営業",
      accessor: "assignedEmployee",
      sortable: true,
    },
    {
      id: "actions",
      header: "操作",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Edit customer:", row.id);
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
              console.log("Delete customer:", row.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">顧客一覧</h1>
      <DataTable
        columns={columns}
        data={customers}
        searchable={true}
        searchPlaceholder="顧客を検索..."
        emptyMessage="顧客が見つかりませんでした"
      />
    </div>
  );
}

// 使用例3: シンプルなテーブル（アクションボタンなし）
interface SimpleData {
  id: number;
  name: string;
  value: number;
  status: "active" | "inactive";
}

export function SimpleTableExample() {
  const data: SimpleData[] = [
    { id: 1, name: "Item 1", value: 100, status: "active" },
    { id: 2, name: "Item 2", value: 200, status: "inactive" },
    // ... more data
  ];

  const columns: ColumnDef<SimpleData>[] = [
    {
      id: "name",
      header: "名前",
      accessor: "name",
      sortable: true,
    },
    {
      id: "value",
      header: "値",
      accessor: "value",
      sortable: true,
      className: "text-right",
    },
    {
      id: "status",
      header: "ステータス",
      accessor: (row) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status === "active" ? "有効" : "無効"}
        </Badge>
      ),
      sortable: false,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={false}
      emptyMessage="データがありません"
    />
  );
}
