/**
 * Tests for EmployeeList Component
 *
 * 営業マスタ一覧コンポーネントの包括的なテスト
 *
 * @see ../employee-list.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmployeeList } from "../employee-list";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

const mockEmployees = [
  {
    employee_id: 1,
    name: "山田太郎",
    email: "yamada@example.com",
    department: "営業部",
    position: "課長",
    manager_id: null,
    manager_name: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    employee_id: 2,
    name: "佐藤花子",
    email: "sato@example.com",
    department: "営業部",
    position: "主任",
    manager_id: 1,
    manager_name: "山田太郎",
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
];

const mockMeta = {
  current_page: 1,
  total_pages: 1,
  total_count: 2,
  limit: 20,
};

const mockDepartments = ["営業部", "開発部"];

describe("EmployeeList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基本的なレンダリング", () => {
    it("should render employee list with initial data", () => {
      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      expect(screen.getByText("山田太郎")).toBeInTheDocument();
      expect(screen.getByText("佐藤花子")).toBeInTheDocument();
      expect(screen.getByText("yamada@example.com")).toBeInTheDocument();
      expect(screen.getByText("sato@example.com")).toBeInTheDocument();
    });

    it("should render empty state when no employees", () => {
      render(
        <EmployeeList
          initialEmployees={[]}
          initialMeta={{ ...mockMeta, total_count: 0 }}
          departments={mockDepartments}
        />
      );

      expect(screen.getByText("社員が見つかりませんでした")).toBeInTheDocument();
    });

    it("should render search filters", () => {
      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      expect(screen.getByLabelText("社員名")).toBeInTheDocument();
      expect(screen.getByLabelText("部署")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /検索/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /クリア/ })).toBeInTheDocument();
    });

    it("should render action buttons for each employee", () => {
      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const editButtons = screen.getAllByText("編集");
      const deleteButtons = screen.getAllByText("削除");

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it("should render create button", () => {
      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      expect(screen.getByRole("button", { name: /新規登録/ })).toBeInTheDocument();
    });
  });

  describe("検索機能", () => {
    it("should successfully search employees", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [mockEmployees[0]],
          meta: { ...mockMeta, total_count: 1 },
        }),
      });

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const nameInput = screen.getByLabelText("社員名");
      const searchButton = screen.getByRole("button", { name: /検索/ });

      await user.type(nameInput, "山田");
      await user.click(searchButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/employees?name=%E5%B1%B1%E7%94%B0")
        );
      });
    });

    it("should trim search input before sending", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockEmployees,
          meta: mockMeta,
        }),
      });

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const nameInput = screen.getByLabelText("社員名");
      const searchButton = screen.getByRole("button", { name: /検索/ });

      await user.type(nameInput, "  山田  ");
      await user.click(searchButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/employees?name=%E5%B1%B1%E7%94%B0")
        );
      });
    });

    it("should show error message when search fails", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const searchButton = screen.getByRole("button", { name: /検索/ });
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "エラー",
          description: "社員情報の取得に失敗しました。もう一度お試しください。",
        });
      });

      expect(
        screen.getByText("社員情報の取得に失敗しました。もう一度お試しください。")
      ).toBeInTheDocument();
    });

    it("should disable buttons during search", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: mockEmployees, meta: mockMeta }),
                }),
              100
            )
          )
      );

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const searchButton = screen.getByRole("button", { name: /検索/ });
      const clearButton = screen.getByRole("button", { name: /クリア/ });

      await user.click(searchButton);

      expect(searchButton).toBeDisabled();
      expect(clearButton).toBeDisabled();

      await waitFor(() => {
        expect(searchButton).not.toBeDisabled();
      });
    });
  });

  describe("クリア機能", () => {
    it("should clear search filters", async () => {
      const user = userEvent.setup();

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const nameInput = screen.getByLabelText("社員名") as HTMLInputElement;
      const clearButton = screen.getByRole("button", { name: /クリア/ });

      await user.type(nameInput, "山田");
      await user.click(clearButton);

      expect(nameInput.value).toBe("");
    });
  });

  describe("編集機能", () => {
    it("should navigate to edit page when edit button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const editButtons = screen.getAllByText("編集");
      await user.click(editButtons[0]);

      expect(mockPush).toHaveBeenCalledWith("/employees/1/edit");
    });
  });

  describe("削除機能", () => {
    it("should open confirmation dialog when delete button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const deleteButtons = screen.getAllByText("削除");
      await user.click(deleteButtons[0]);

      expect(screen.getByText("社員を削除しますか?")).toBeInTheDocument();
      expect(screen.getByText(/山田太郎を削除しようとしています/)).toBeInTheDocument();
    });

    it("should successfully delete employee", async () => {
      const user = userEvent.setup();
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [mockEmployees[1]],
            meta: { ...mockMeta, total_count: 1 },
          }),
        });

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const deleteButtons = screen.getAllByText("削除");
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole("button", { name: "削除" });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/employees/1",
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除しました",
          description: "山田太郎を削除しました",
        });
      });
    });

    it("should show error when employee is in use", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            code: "EMPLOYEE_IN_USE",
            message: "Employee is in use",
          },
        }),
      });

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const deleteButtons = screen.getAllByText("削除");
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole("button", { name: "削除" });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "削除できません",
          description: "この社員は日報や顧客で使用されているため削除できません",
        });
      });
    });

    it("should show error message when delete fails", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const deleteButtons = screen.getAllByText("削除");
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole("button", { name: "削除" });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "エラー",
          description: "社員の削除に失敗しました。もう一度お試しください。",
        });
      });
    });

    it("should disable buttons during delete", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({}),
                }),
              100
            )
          )
      );

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const deleteButtons = screen.getAllByText("削除");
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole("button", { name: "削除" });
      const cancelButton = screen.getByRole("button", { name: /キャンセル/ });

      await user.click(confirmButton);

      // Check that buttons are disabled during deletion
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "削除中..." })).toBeInTheDocument();
      });

      expect(cancelButton).toBeDisabled();
    });

    it("should close dialog when cancel is clicked", async () => {
      const user = userEvent.setup();

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const deleteButtons = screen.getAllByText("削除");
      await user.click(deleteButtons[0]);

      expect(screen.getByText("社員を削除しますか?")).toBeInTheDocument();

      const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("社員を削除しますか?")).not.toBeInTheDocument();
      });
    });
  });

  describe("新規作成機能", () => {
    it("should navigate to create page when create button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      const createButton = screen.getByRole("button", { name: /新規登録/ });
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith("/employees/new");
    });
  });

  describe("ページネーション", () => {
    it("should render pagination when multiple pages", () => {
      const multiPageMeta = {
        current_page: 1,
        total_pages: 3,
        total_count: 60,
        limit: 20,
      };

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={multiPageMeta}
          departments={mockDepartments}
        />
      );

      expect(screen.getByText("1 / 3")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /前へ/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /次へ/ })).toBeInTheDocument();
    });

    it("should not render pagination when single page", () => {
      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      expect(screen.queryByText("1 / 1")).not.toBeInTheDocument();
    });

    it("should disable previous button on first page", () => {
      const multiPageMeta = {
        current_page: 1,
        total_pages: 3,
        total_count: 60,
        limit: 20,
      };

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={multiPageMeta}
          departments={mockDepartments}
        />
      );

      const prevButton = screen.getByRole("button", { name: /前へ/ });
      expect(prevButton).toBeDisabled();
    });

    it("should disable next button on last page", () => {
      const lastPageMeta = {
        current_page: 3,
        total_pages: 3,
        total_count: 60,
        limit: 20,
      };

      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={lastPageMeta}
          departments={mockDepartments}
        />
      );

      const nextButton = screen.getByRole("button", { name: /次へ/ });
      expect(nextButton).toBeDisabled();
    });
  });

  describe("アクセシビリティ", () => {
    it("should have aria-labels for action buttons", () => {
      render(
        <EmployeeList
          initialEmployees={mockEmployees}
          initialMeta={mockMeta}
          departments={mockDepartments}
        />
      );

      expect(screen.getByLabelText("山田太郎を編集")).toBeInTheDocument();
      expect(screen.getByLabelText("山田太郎を削除")).toBeInTheDocument();
      expect(screen.getByLabelText("佐藤花子を編集")).toBeInTheDocument();
      expect(screen.getByLabelText("佐藤花子を削除")).toBeInTheDocument();
    });
  });
});
