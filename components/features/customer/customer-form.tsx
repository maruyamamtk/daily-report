"use client";

/**
 * Customer Form Component
 *
 * Form for creating and editing customer information.
 *
 * @see screen-specification.md - S-07 顧客登録・編集画面
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
import { Save, X as XIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/lib/validators";

interface Employee {
  id: number;
  name: string;
}

interface CustomerFormProps {
  mode: "create" | "edit";
  customerId?: number;
  initialData?: {
    customer_name: string;
    address?: string;
    phone?: string;
    email?: string;
    assigned_employee_id: number;
  };
  employees: Employee[];
}

export function CustomerForm({
  mode,
  customerId,
  initialData,
  employees,
}: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [customerName, setCustomerName] = useState(initialData?.customer_name || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<number>(
    initialData?.assigned_employee_id || 0
  );

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Customer name validation
    if (!customerName.trim()) {
      newErrors.customer_name = "顧客名を入力してください";
    } else if (customerName.length > 100) {
      newErrors.customer_name = "顧客名は100文字以内で入力してください";
    }

    // Address validation
    if (address && address.length > 200) {
      newErrors.address = "住所は200文字以内で入力してください";
    }

    // Phone validation
    if (phone && !/^[0-9\-]*$/.test(phone)) {
      newErrors.phone = "電話番号は数字とハイフンのみで入力してください";
    }
    if (phone && phone.length > 20) {
      newErrors.phone = "電話番号は20文字以内で入力してください";
    }

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "正しいメールアドレス形式で入力してください";
    }
    if (email && email.length > 255) {
      newErrors.email = "メールアドレスは255文字以内で入力してください";
    }

    // Assigned employee validation
    if (!assignedEmployeeId || assignedEmployeeId === 0) {
      newErrors.assigned_employee_id = "担当営業を選択してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "入力エラー",
        description: "入力内容を確認してください",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateCustomerInput | UpdateCustomerInput = {
        customer_name: customerName,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        assigned_employee_id: assignedEmployeeId,
      };

      const url = mode === "create" ? "/api/customers" : `/api/customers/${customerId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.details) {
          const newErrors: Record<string, string> = {};
          errorData.error.details.forEach((detail: { field: string; message: string }) => {
            newErrors[detail.field] = detail.message;
          });
          setErrors(newErrors);
        }
        throw new Error(errorData.error?.message || "Failed to save customer");
      }

      toast({
        title: "保存成功",
        description: mode === "create" ? "顧客を登録しました" : "顧客情報を更新しました",
      });

      router.push("/customers");
      router.refresh();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "顧客情報の保存に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/customers");
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "顧客登録" : "顧客編集"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customer_name">
              顧客名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customer_name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="株式会社サンプル"
              maxLength={100}
              className={errors.customer_name ? "border-red-500" : ""}
            />
            {errors.customer_name && (
              <p className="text-sm text-red-500">{errors.customer_name}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="東京都渋谷区..."
              maxLength={200}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03-1234-5678"
              maxLength={20}
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@example.com"
              maxLength={255}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Assigned Employee */}
          <div className="space-y-2">
            <Label htmlFor="assigned_employee_id">
              担当営業 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={assignedEmployeeId ? assignedEmployeeId.toString() : ""}
              onValueChange={(value) => setAssignedEmployeeId(parseInt(value))}
            >
              <SelectTrigger
                id="assigned_employee_id"
                className={errors.assigned_employee_id ? "border-red-500" : ""}
              >
                <SelectValue placeholder="担当営業を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigned_employee_id && (
              <p className="text-sm text-red-500">{errors.assigned_employee_id}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <XIcon className="mr-2 h-4 w-4" />
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
