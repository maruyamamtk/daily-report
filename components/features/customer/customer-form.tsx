"use client";

/**
 * Customer Form Component
 *
 * Form for creating and editing customer information.
 * Uses React Hook Form + Zod for validation consistency.
 *
 * @see screen-specification.md - S-07 顧客登録・編集画面
 */

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "@/lib/validators";

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

  // Use React Hook Form with Zod validation
  const schema = mode === "create" ? createCustomerSchema : updateCustomerSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerInput | UpdateCustomerInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: initialData?.customer_name || "",
      address: initialData?.address || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      assigned_employee_id: initialData?.assigned_employee_id || 0,
    },
  });

  const assignedEmployeeId = watch("assigned_employee_id");

  // Handle form submission
  const onSubmit = async (data: CreateCustomerInput | UpdateCustomerInput) => {
    try {
      // Trim email and phone before sending
      const sanitizedData = {
        ...data,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        address: data.address?.trim() || undefined,
      };

      const url = mode === "create" ? "/api/customers" : `/api/customers/${customerId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
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
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/customers");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
              {...register("customer_name")}
              placeholder="株式会社サンプル"
              maxLength={100}
              className={errors.customer_name ? "border-red-500" : ""}
              aria-invalid={errors.customer_name ? "true" : "false"}
              aria-describedby={errors.customer_name ? "customer_name-error" : undefined}
            />
            {errors.customer_name && (
              <p id="customer_name-error" className="text-sm text-red-500" role="alert">
                {errors.customer_name.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="東京都渋谷区..."
              maxLength={255}
              className={errors.address ? "border-red-500" : ""}
              aria-invalid={errors.address ? "true" : "false"}
              aria-describedby={errors.address ? "address-error" : undefined}
            />
            {errors.address && (
              <p id="address-error" className="text-sm text-red-500" role="alert">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="03-1234-5678"
              maxLength={20}
              className={errors.phone ? "border-red-500" : ""}
              aria-invalid={errors.phone ? "true" : "false"}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="text-sm text-red-500" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="contact@example.com"
              maxLength={255}
              className={errors.email ? "border-red-500" : ""}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-500" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Assigned Employee */}
          <div className="space-y-2">
            <Label htmlFor="assigned_employee_id">
              担当営業 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={assignedEmployeeId ? assignedEmployeeId.toString() : ""}
              onValueChange={(value) => setValue("assigned_employee_id", parseInt(value))}
            >
              <SelectTrigger
                id="assigned_employee_id"
                className={errors.assigned_employee_id ? "border-red-500" : ""}
                aria-invalid={errors.assigned_employee_id ? "true" : "false"}
                aria-describedby={errors.assigned_employee_id ? "assigned_employee_id-error" : undefined}
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
              <p id="assigned_employee_id-error" className="text-sm text-red-500" role="alert">
                {errors.assigned_employee_id.message}
              </p>
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
