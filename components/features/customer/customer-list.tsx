"use client";

/**
 * Customer List Component
 *
 * Displays a list of customers with search filters and pagination.
 *
 * @see screen-specification.md - S-06 顧客一覧画面
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit,
  Trash2,
  Search,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface CustomerListItem {
  customer_id: number;
  customer_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  assigned_employee_id: number;
  assigned_employee_name: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerListMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

export interface Employee {
  id: number;
  name: string;
}

interface CustomerListProps {
  initialCustomers: CustomerListItem[];
  initialMeta: CustomerListMeta;
  employees?: Employee[];
}

export function CustomerList({
  initialCustomers,
  initialMeta,
  employees = [],
}: CustomerListProps) {
  const router = useRouter();

  // State for search filters
  const [customerName, setCustomerName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // State for data
  const [customers, setCustomers] = useState<CustomerListItem[]>(initialCustomers);
  const [meta, setMeta] = useState<CustomerListMeta>(initialMeta);

  // Handle search
  const handleSearch = async (page: number = 1) => {
    setIsSearching(true);

    const params = new URLSearchParams();
    if (customerName) params.set("customer_name", customerName);
    if (employeeId) params.set("employee_id", employeeId);
    params.set("page", page.toString());
    params.set("limit", meta.limit.toString());

    try {
      const response = await fetch(`/api/customers?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const result = await response.json();
      setCustomers(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle clear filters
  const handleClear = () => {
    setCustomerName("");
    setEmployeeId("");
    setCustomers(initialCustomers);
    setMeta(initialMeta);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    handleSearch(page);
  };

  // Handle edit customer
  const handleEdit = (customerId: number) => {
    router.push(`/customers/${customerId}/edit`);
  };

  // Handle delete customer
  const handleDelete = async (customerId: number) => {
    if (!confirm("この顧客を削除してもよろしいですか?")) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.code === "CUSTOMER_IN_USE") {
          alert("この顧客は訪問記録で使用されているため削除できません");
        } else {
          throw new Error("Failed to delete customer");
        }
        return;
      }

      // Refresh the list
      handleSearch(meta.current_page);
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("顧客の削除に失敗しました");
    }
  };

  // Handle create new customer
  const handleCreate = () => {
    router.push("/customers/new");
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customer-name">顧客名</Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="顧客名で検索"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {/* Employee Filter */}
            {employees.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="employee">担当営業</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="全て" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全て</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Search Buttons */}
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => handleSearch(1)}
              disabled={isSearching}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              検索
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isSearching}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              クリア
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="pt-6">
          {customers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              顧客が見つかりませんでした
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>顧客ID</TableHead>
                      <TableHead>顧客名</TableHead>
                      <TableHead>電話番号</TableHead>
                      <TableHead>メールアドレス</TableHead>
                      <TableHead>担当営業</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.customer_id}>
                        <TableCell className="font-medium">
                          {customer.customer_id}
                        </TableCell>
                        <TableCell>{customer.customer_name}</TableCell>
                        <TableCell>{customer.phone || "-"}</TableCell>
                        <TableCell>{customer.email || "-"}</TableCell>
                        <TableCell>{customer.assigned_employee_name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer.customer_id)}
                              className="gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              編集
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer.customer_id)}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              削除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta.total_pages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {meta.total_count}件中{" "}
                    {(meta.current_page - 1) * meta.limit + 1}-
                    {Math.min(meta.current_page * meta.limit, meta.total_count)}
                    件を表示
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(meta.current_page - 1)}
                      disabled={meta.current_page === 1 || isSearching}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      前へ
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm">
                        {meta.current_page} / {meta.total_pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(meta.current_page + 1)}
                      disabled={
                        meta.current_page === meta.total_pages || isSearching
                      }
                    >
                      次へ
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
