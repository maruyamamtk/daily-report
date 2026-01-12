"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: string | ((row: T) => string);
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = "検索...",
  emptyMessage = "データがありません",
  className,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // フィルタリング処理
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((row) => {
      return columns.some((column) => {
        const value =
          typeof column.accessor === "function"
            ? column.accessor(row)
            : row[column.accessor];

        if (value === null || value === undefined) return false;

        return String(value)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, columns]);

  // ソート処理
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    const column = columns.find((col) => col.id === sortColumn);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue =
        typeof column.accessor === "function"
          ? column.accessor(a)
          : a[column.accessor];
      const bValue =
        typeof column.accessor === "function"
          ? column.accessor(b)
          : b[column.accessor];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // ページネーション処理
  const paginatedData = React.useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination]);

  const pageCount = Math.ceil(sortedData.length / pagination.pageSize);

  // ソート切り替え
  const handleSort = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column?.sortable) return;

    if (sortColumn === columnId) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  // ソートアイコン取得
  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === "asc") {
      return <ChevronUp className="ml-2 h-4 w-4" />;
    }
    return <ChevronDown className="ml-2 h-4 w-4" />;
  };

  // セル値の取得
  const getCellValue = (row: T, column: ColumnDef<T>) => {
    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  // 行のクラス名取得
  const getRowClassName = (row: T) => {
    if (typeof rowClassName === "function") {
      return rowClassName(row);
    }
    return rowClassName;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 検索バー */}
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* テーブル */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.headerClassName,
                    column.sortable && "cursor-pointer select-none"
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && getSortIcon(column.id)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    getRowClassName(row)
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={column.className}
                    >
                      {getCellValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {pageCount > 1 && (
        <Pagination
          pageIndex={pagination.pageIndex}
          pageCount={pageCount}
          pageSize={pagination.pageSize}
          totalItems={sortedData.length}
          onPageChange={(pageIndex) =>
            setPagination((prev) => ({ ...prev, pageIndex }))
          }
          onPageSizeChange={(pageSize) =>
            setPagination({ pageIndex: 0, pageSize })
          }
        />
      )}
    </div>
  );
}

// ページネーションコンポーネント
interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({
  pageIndex,
  pageCount,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const startItem = pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems);

  // ページ番号のリストを生成
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (pageCount <= maxVisible) {
      // 全ページを表示
      for (let i = 0; i < pageCount; i++) {
        pages.push(i);
      }
    } else {
      // 省略表示
      if (pageIndex < 3) {
        // 先頭付近
        for (let i = 0; i < 3; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(pageCount - 1);
      } else if (pageIndex > pageCount - 4) {
        // 末尾付近
        pages.push(0);
        pages.push("...");
        for (let i = pageCount - 3; i < pageCount; i++) {
          pages.push(i);
        }
      } else {
        // 中間
        pages.push(0);
        pages.push("...");
        pages.push(pageIndex - 1);
        pages.push(pageIndex);
        pages.push(pageIndex + 1);
        pages.push("...");
        pages.push(pageCount - 1);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {totalItems}件中 {startItem}-{endItem}件を表示
        </p>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm"
        >
          {[10, 20, 30, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}件
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0}
        >
          前へ
        </Button>

        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {typeof page === "number" ? (
              <Button
                variant={pageIndex === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="min-w-[2.5rem]"
              >
                {page + 1}
              </Button>
            ) : (
              <span className="px-2 text-muted-foreground">{page}</span>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
        >
          次へ
        </Button>
      </div>
    </div>
  );
}
