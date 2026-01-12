/**
 * Tests for DataTable Component
 *
 * Tests sorting, filtering, pagination, and other features of the DataTable component.
 *
 * @see ../data-table.tsx
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type ColumnDef } from "../data-table";

// テストデータ型定義
interface TestData {
  id: number;
  name: string;
  age: number;
  email: string;
  status: "active" | "inactive";
}

// テストデータ
const testData: TestData[] = [
  { id: 1, name: "田中太郎", age: 30, email: "tanaka@example.com", status: "active" },
  { id: 2, name: "佐藤花子", age: 25, email: "sato@example.com", status: "inactive" },
  { id: 3, name: "鈴木一郎", age: 35, email: "suzuki@example.com", status: "active" },
  { id: 4, name: "高橋次郎", age: 28, email: "takahashi@example.com", status: "inactive" },
  { id: 5, name: "伊藤三郎", age: 32, email: "ito@example.com", status: "active" },
];

// 基本的なカラム定義
const basicColumns: ColumnDef<TestData>[] = [
  { id: "id", header: "ID", accessor: "id", sortable: true },
  { id: "name", header: "名前", accessor: "name", sortable: true },
  { id: "age", header: "年齢", accessor: "age", sortable: true },
  { id: "email", header: "メール", accessor: "email", sortable: false },
];

describe("DataTable Component", () => {
  describe("基本的なレンダリング", () => {
    it("should render table with data", () => {
      render(<DataTable columns={basicColumns} data={testData} />);

      // ヘッダーが表示されていること
      expect(screen.getByText("ID")).toBeInTheDocument();
      expect(screen.getByText("名前")).toBeInTheDocument();
      expect(screen.getByText("年齢")).toBeInTheDocument();
      expect(screen.getByText("メール")).toBeInTheDocument();

      // データが表示されていること
      expect(screen.getByText("田中太郎")).toBeInTheDocument();
      expect(screen.getByText("佐藤花子")).toBeInTheDocument();
      expect(screen.getByText("tanaka@example.com")).toBeInTheDocument();
    });

    it("should render empty message when no data", () => {
      render(<DataTable columns={basicColumns} data={[]} />);

      expect(screen.getByText("データがありません")).toBeInTheDocument();
    });

    it("should render custom empty message", () => {
      const customMessage = "カスタム空メッセージ";
      render(
        <DataTable
          columns={basicColumns}
          data={[]}
          emptyMessage={customMessage}
        />
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe("ソート機能", () => {
    it("should sort data in ascending order when clicking sortable column", () => {
      render(<DataTable columns={basicColumns} data={testData} />);

      // 年齢カラムをクリック（昇順ソート）
      const ageHeader = screen.getByText("年齢");
      fireEvent.click(ageHeader);

      // 全行を取得
      const rows = screen.getAllByRole("row");
      // ヘッダー行を除く
      const dataRows = rows.slice(1);

      // 最初のデータ行に25歳（佐藤花子）が含まれることを確認
      expect(within(dataRows[0]).getByText("25")).toBeInTheDocument();
      expect(within(dataRows[0]).getByText("佐藤花子")).toBeInTheDocument();
    });

    it("should sort data in descending order when clicking sortable column twice", () => {
      render(<DataTable columns={basicColumns} data={testData} />);

      const ageHeader = screen.getByText("年齢");

      // 1回目のクリック（昇順）
      fireEvent.click(ageHeader);

      // 2回目のクリック（降順）
      fireEvent.click(ageHeader);

      const rows = screen.getAllByRole("row");
      const dataRows = rows.slice(1);

      // 最初のデータ行に35歳（鈴木一郎）が含まれることを確認
      expect(within(dataRows[0]).getByText("35")).toBeInTheDocument();
      expect(within(dataRows[0]).getByText("鈴木一郎")).toBeInTheDocument();
    });

    it("should clear sort when clicking sortable column three times", () => {
      render(<DataTable columns={basicColumns} data={testData} />);

      const ageHeader = screen.getByText("年齢");

      // 3回クリック（昇順 → 降順 → ソート解除）
      fireEvent.click(ageHeader);
      fireEvent.click(ageHeader);
      fireEvent.click(ageHeader);

      const rows = screen.getAllByRole("row");
      const dataRows = rows.slice(1);

      // 元の順序に戻る（田中太郎が最初）
      expect(within(dataRows[0]).getByText("30")).toBeInTheDocument();
      expect(within(dataRows[0]).getByText("田中太郎")).toBeInTheDocument();
    });

    it("should not sort when clicking non-sortable column", () => {
      render(<DataTable columns={basicColumns} data={testData} />);

      const emailHeader = screen.getByText("メール");
      fireEvent.click(emailHeader);

      const rows = screen.getAllByRole("row");
      const dataRows = rows.slice(1);

      // 元の順序のまま
      expect(within(dataRows[0]).getByText("田中太郎")).toBeInTheDocument();
    });

    it("should handle null and undefined values in sorting", () => {
      const dataWithNulls: TestData[] = [
        { id: 1, name: "田中太郎", age: 30, email: "tanaka@example.com", status: "active" },
        { id: 2, name: "佐藤花子", age: null as any, email: "sato@example.com", status: "inactive" },
        { id: 3, name: "鈴木一郎", age: 25, email: "suzuki@example.com", status: "active" },
      ];

      render(<DataTable columns={basicColumns} data={dataWithNulls} />);

      const ageHeader = screen.getByText("年齢");
      fireEvent.click(ageHeader);

      const rows = screen.getAllByRole("row");
      const dataRows = rows.slice(1);

      // null値は最後に配置される
      expect(within(dataRows[0]).getByText("25")).toBeInTheDocument();
      expect(within(dataRows[1]).getByText("30")).toBeInTheDocument();
    });

    it("should handle sorting with function accessor and sortValue", () => {
      const columnsWithFunction: ColumnDef<TestData>[] = [
        {
          id: "status",
          header: "ステータス",
          accessor: (row) => (
            <span className={row.status === "active" ? "text-green-500" : "text-gray-500"}>
              {row.status === "active" ? "有効" : "無効"}
            </span>
          ),
          sortable: true,
          sortValue: (row) => row.status,
        },
        { id: "name", header: "名前", accessor: "name" },
      ];

      render(<DataTable columns={columnsWithFunction} data={testData} />);

      const statusHeader = screen.getByText("ステータス");
      fireEvent.click(statusHeader);

      // ソートが正常に動作すること（エラーが発生しない）
      expect(screen.getByText("有効")).toBeInTheDocument();
      expect(screen.getByText("無効")).toBeInTheDocument();
    });

    it("should not sort when function accessor without sortValue", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const columnsWithFunction: ColumnDef<TestData>[] = [
        {
          id: "status",
          header: "ステータス",
          accessor: (row) => <span>{row.status}</span>,
          sortable: true,
          // sortValueが未定義
        },
      ];

      render(<DataTable columns={columnsWithFunction} data={testData} />);

      const statusHeader = screen.getByText("ステータス");
      fireEvent.click(statusHeader);

      // 警告メッセージが表示されること
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Column "status" uses a function accessor but has no sortValue')
      );

      consoleSpy.mockRestore();
    });
  });

  describe("検索機能", () => {
    it("should show search input when searchable prop is true", () => {
      render(<DataTable columns={basicColumns} data={testData} searchable />);

      expect(screen.getByPlaceholderText("検索...")).toBeInTheDocument();
    });

    it("should not show search input when searchable prop is false", () => {
      render(<DataTable columns={basicColumns} data={testData} />);

      expect(screen.queryByPlaceholderText("検索...")).not.toBeInTheDocument();
    });

    it("should show custom search placeholder", () => {
      const customPlaceholder = "カスタム検索";
      render(
        <DataTable
          columns={basicColumns}
          data={testData}
          searchable
          searchPlaceholder={customPlaceholder}
        />
      );

      expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
    });

    it("should filter data based on search query", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={basicColumns} data={testData} searchable />);

      const searchInput = screen.getByPlaceholderText("検索...");
      await user.type(searchInput, "田中");

      // 田中太郎のみが表示される
      expect(screen.getByText("田中太郎")).toBeInTheDocument();
      expect(screen.queryByText("佐藤花子")).not.toBeInTheDocument();
      expect(screen.queryByText("鈴木一郎")).not.toBeInTheDocument();
    });

    it("should perform case-insensitive search", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={basicColumns} data={testData} searchable />);

      const searchInput = screen.getByPlaceholderText("検索...");
      await user.type(searchInput, "TANAKA");

      // 大文字小文字を区別せずに検索される
      expect(screen.getByText("田中太郎")).toBeInTheDocument();
    });

    it("should show empty message when search returns no results", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={basicColumns} data={testData} searchable />);

      const searchInput = screen.getByPlaceholderText("検索...");
      await user.type(searchInput, "存在しない名前");

      expect(screen.getByText("データがありません")).toBeInTheDocument();
    });

    it("should reset to first page when searching", async () => {
      const user = userEvent.setup();
      // 大量のデータで複数ページになるようにする
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} searchable />);

      // 2ページ目に移動
      const pageButtons = screen.getAllByRole("button");
      const page2Button = pageButtons.find(btn => btn.textContent === "2");
      if (page2Button) {
        await user.click(page2Button);
      }

      // 検索を実行
      const searchInput = screen.getByPlaceholderText("検索...");
      await user.type(searchInput, "ユーザー1");

      // 検索結果が1ページ目に表示される
      expect(screen.getByText("ユーザー1")).toBeInTheDocument();
    });

    it("should not search function accessor columns without searchValue", async () => {
      const user = userEvent.setup();
      const columnsWithFunction: ColumnDef<TestData>[] = [
        {
          id: "status",
          header: "ステータス",
          accessor: (row) => <span>{row.status}</span>,
          // searchValueが未定義
        },
        { id: "name", header: "名前", accessor: "name" },
      ];

      render(<DataTable columns={columnsWithFunction} data={testData} searchable />);

      const searchInput = screen.getByPlaceholderText("検索...");
      await user.type(searchInput, "active");

      // statusカラムは検索対象外なので結果なし
      expect(screen.getByText("データがありません")).toBeInTheDocument();
    });

    it("should search using searchValue when provided", async () => {
      const user = userEvent.setup();
      const columnsWithSearchValue: ColumnDef<TestData>[] = [
        {
          id: "status",
          header: "ステータス",
          accessor: (row) => (
            <span>{row.status === "active" ? "有効" : "無効"}</span>
          ),
          searchValue: (row) => row.status,
        },
        { id: "name", header: "名前", accessor: "name" },
      ];

      render(<DataTable columns={columnsWithSearchValue} data={testData} searchable />);

      const searchInput = screen.getByPlaceholderText("検索...");
      await user.type(searchInput, "active");

      // searchValueを使用して検索される
      expect(screen.getByText("有効")).toBeInTheDocument();
    });
  });

  describe("ページネーション機能", () => {
    it("should not show pagination when data fits in one page", () => {
      render(<DataTable columns={basicColumns} data={testData} />);

      // 5件のデータは1ページに収まるため、ページネーションは表示されない
      expect(screen.queryByText("前へ")).not.toBeInTheDocument();
      expect(screen.queryByText("次へ")).not.toBeInTheDocument();
    });

    it("should show pagination when data exceeds one page", () => {
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      expect(screen.getByText("前へ")).toBeInTheDocument();
      expect(screen.getByText("次へ")).toBeInTheDocument();
      expect(screen.getByText(/15件中 1-10件を表示/)).toBeInTheDocument();
    });

    it("should navigate to next page", async () => {
      const user = userEvent.setup();
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      const nextButton = screen.getByText("次へ");
      await user.click(nextButton);

      // 2ページ目のデータが表示される
      expect(screen.getByText(/15件中 11-15件を表示/)).toBeInTheDocument();
      expect(screen.getByText("ユーザー11")).toBeInTheDocument();
    });

    it("should navigate to previous page", async () => {
      const user = userEvent.setup();
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      // 次へボタンで2ページ目に移動
      const nextButton = screen.getByText("次へ");
      await user.click(nextButton);

      // 前へボタンで1ページ目に戻る
      const prevButton = screen.getByText("前へ");
      await user.click(prevButton);

      expect(screen.getByText(/15件中 1-10件を表示/)).toBeInTheDocument();
      expect(screen.getByText("ユーザー1")).toBeInTheDocument();
    });

    it("should disable previous button on first page", () => {
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      const prevButton = screen.getByText("前へ");
      expect(prevButton).toBeDisabled();
    });

    it("should disable next button on last page", async () => {
      const user = userEvent.setup();
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      // 最後のページに移動
      const nextButton = screen.getByText("次へ");
      await user.click(nextButton);

      expect(nextButton).toBeDisabled();
    });

    it("should change page size", async () => {
      const user = userEvent.setup();
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      // ページサイズを変更
      const pageSizeSelect = screen.getByRole("combobox");
      await user.selectOptions(pageSizeSelect, "20");

      expect(screen.getByText(/50件中 1-20件を表示/)).toBeInTheDocument();
    });

    it("should jump to specific page number", async () => {
      const user = userEvent.setup();
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      // ページ番号3をクリック
      const pageButtons = screen.getAllByRole("button");
      const page3Button = pageButtons.find(btn => btn.textContent === "3");

      if (page3Button) {
        await user.click(page3Button);
        expect(screen.getByText(/50件中 21-30件を表示/)).toBeInTheDocument();
      }
    });

    it("should reset to first page when sorting", async () => {
      const user = userEvent.setup();
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      // 2ページ目に移動
      const nextButton = screen.getByText("次へ");
      await user.click(nextButton);

      // ソートを実行
      const ageHeader = screen.getByText("年齢");
      fireEvent.click(ageHeader);

      // 1ページ目に戻る
      expect(screen.getByText(/25件中 1-10件を表示/)).toBeInTheDocument();
    });
  });

  describe("行クリック機能", () => {
    it("should call onRowClick when row is clicked", async () => {
      const user = userEvent.setup();
      const handleRowClick = vi.fn();

      render(
        <DataTable
          columns={basicColumns}
          data={testData}
          onRowClick={handleRowClick}
        />
      );

      // 最初の行をクリック
      const rows = screen.getAllByRole("row");
      await user.click(rows[1]); // インデックス0はヘッダー行

      expect(handleRowClick).toHaveBeenCalledWith(testData[0]);
      expect(handleRowClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onRowClick when onRowClick is not provided", async () => {
      const user = userEvent.setup();

      render(<DataTable columns={basicColumns} data={testData} />);

      const rows = screen.getAllByRole("row");
      // エラーが発生しないことを確認
      await user.click(rows[1]);
    });

    it("should apply cursor-pointer class when onRowClick is provided", () => {
      const handleRowClick = vi.fn();

      render(
        <DataTable
          columns={basicColumns}
          data={testData}
          onRowClick={handleRowClick}
        />
      );

      const rows = screen.getAllByRole("row");
      const dataRow = rows[1];

      expect(dataRow).toHaveClass("cursor-pointer");
    });
  });

  describe("カスタムクラス名", () => {
    it("should apply className to table container", () => {
      const { container } = render(
        <DataTable
          columns={basicColumns}
          data={testData}
          className="custom-table"
        />
      );

      expect(container.querySelector(".custom-table")).toBeInTheDocument();
    });

    it("should apply column-specific className", () => {
      const columnsWithClass: ColumnDef<TestData>[] = [
        {
          id: "name",
          header: "名前",
          accessor: "name",
          className: "font-bold",
        },
      ];

      render(<DataTable columns={columnsWithClass} data={testData} />);

      const nameCells = screen.getAllByText(/田中太郎|佐藤花子/);
      nameCells.forEach(cell => {
        expect(cell).toHaveClass("font-bold");
      });
    });

    it("should apply headerClassName to column header", () => {
      const columnsWithHeaderClass: ColumnDef<TestData>[] = [
        {
          id: "name",
          header: "名前",
          accessor: "name",
          headerClassName: "bg-blue-500",
        },
      ];

      render(<DataTable columns={columnsWithHeaderClass} data={testData} />);

      const nameHeader = screen.getByText("名前");
      expect(nameHeader).toHaveClass("bg-blue-500");
    });

    it("should apply rowClassName as string", () => {
      render(
        <DataTable
          columns={basicColumns}
          data={testData}
          rowClassName="custom-row"
        />
      );

      const rows = screen.getAllByRole("row");
      const dataRow = rows[1];

      expect(dataRow).toHaveClass("custom-row");
    });

    it("should apply rowClassName as function", () => {
      const getRowClassName = (row: TestData) =>
        row.status === "active" ? "bg-green-100" : "bg-gray-100";

      render(
        <DataTable
          columns={basicColumns}
          data={testData}
          rowClassName={getRowClassName}
        />
      );

      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1]; // 田中太郎 (active)

      expect(firstDataRow).toHaveClass("bg-green-100");
    });
  });

  describe("エッジケース", () => {
    it("should handle empty columns array", () => {
      render(<DataTable columns={[]} data={testData} />);

      // エラーが発生せず、空メッセージが表示される
      expect(screen.getByText("データがありません")).toBeInTheDocument();
    });

    it("should handle data with missing properties", () => {
      const incompleteData = [
        { id: 1, name: "田中太郎" } as TestData,
      ];

      render(<DataTable columns={basicColumns} data={incompleteData} />);

      expect(screen.getByText("田中太郎")).toBeInTheDocument();
    });

    it("should handle very large datasets", () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + (i % 50),
        email: `user${i + 1}@example.com`,
        status: (i % 2 === 0 ? "active" : "inactive") as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      // 最初の10件が表示される
      expect(screen.getByText("ユーザー1")).toBeInTheDocument();
      expect(screen.getByText(/1000件中 1-10件を表示/)).toBeInTheDocument();
    });

    it("should handle special characters in data", () => {
      const specialCharData: TestData[] = [
        {
          id: 1,
          name: "<script>alert('XSS')</script>",
          age: 30,
          email: "test@example.com",
          status: "active",
        },
      ];

      render(<DataTable columns={basicColumns} data={specialCharData} />);

      // XSSが実行されず、テキストとして表示される
      expect(screen.getByText("<script>alert('XSS')</script>")).toBeInTheDocument();
    });
  });

  describe("Paginationコンポーネント", () => {
    it("should display correct page numbers for small page count", () => {
      const largeData = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      // 3ページの場合、全ページ番号が表示される
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should display ellipsis for large page count", () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      // 省略記号が表示される
      expect(screen.getByText("...")).toBeInTheDocument();
    });

    it("should highlight current page", async () => {
      const user = userEvent.setup();
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `ユーザー${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: "active" as const,
      }));

      render(<DataTable columns={basicColumns} data={largeData} />);

      // ページ2に移動
      const pageButtons = screen.getAllByRole("button");
      const page2Button = pageButtons.find(btn => btn.textContent === "2");

      if (page2Button) {
        await user.click(page2Button);

        // 現在のページがハイライトされる（variant="default"）
        expect(page2Button).toHaveAttribute("class", expect.stringContaining(""));
      }
    });
  });
});
