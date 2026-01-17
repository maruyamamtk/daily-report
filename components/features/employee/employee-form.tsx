"use client";

/**
 * Employee Form Component
 *
 * Form for creating and editing employee information.
 * Uses React Hook Form + Zod for validation consistency.
 *
 * @see screen-specification.md - S-09 営業マスタ登録・編集画面
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
  createEmployeeSchema,
  updateEmployeeSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from "@/lib/validators";
import { z } from "zod";
import { useState } from "react";

interface Manager {
  id: number;
  name: string;
}

interface EmployeeFormProps {
  mode: "create" | "edit";
  employeeId?: number;
  initialData?: {
    name: string;
    email: string;
    department: string;
    position: string;
    manager_id?: number | null;
  };
  managers: Manager[];
  departments: string[];
  positions: string[];
}

// Extended schema for create mode with password confirmation
const createEmployeeFormSchema = createEmployeeSchema.extend({
  password_confirm: z.string().min(1, "パスワード(確認)を入力してください"),
}).refine((data) => data.password === data.password_confirm, {
  message: "パスワードが一致しません",
  path: ["password_confirm"],
});

type CreateEmployeeFormInput = z.infer<typeof createEmployeeFormSchema>;

export function EmployeeForm({
  mode,
  employeeId,
  initialData,
  managers,
  departments,
  positions,
}: EmployeeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Use different schemas for create and edit modes
  const schema = mode === "create" ? createEmployeeFormSchema : updateEmployeeSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeFormInput | UpdateEmployeeInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      password: "",
      password_confirm: mode === "create" ? "" : undefined,
      department: initialData?.department || "",
      position: initialData?.position || "",
      manager_id: initialData?.manager_id || undefined,
    },
  });

  const selectedManagerId = watch("manager_id");
  const selectedDepartment = watch("department");
  const selectedPosition = watch("position");

  // Handle form submission
  const onSubmit = async (data: CreateEmployeeFormInput | UpdateEmployeeInput) => {
    try {
      // Remove password_confirm from the data
      const { password_confirm, ...submitData } = data as CreateEmployeeFormInput;

      // If password is empty in edit mode, remove it
      if (mode === "edit" && !submitData.password) {
        delete submitData.password;
      }

      const url = mode === "create" ? "/api/employees" : `/api/employees/${employeeId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save employee");
      }

      toast({
        title: "保存成功",
        description: mode === "create" ? "社員を登録しました" : "社員情報を更新しました",
      });

      router.push("/employees");
      router.refresh();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "社員情報の保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/employees");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "営業登録" : "営業編集"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              社員名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="山田太郎"
              maxLength={50}
              className={errors.name ? "border-red-500" : ""}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-500" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              メールアドレス <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="yamada@example.com"
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

          {/* Password (required for create, optional for edit) */}
          {mode === "create" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">
                  パスワード <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="8文字以上、英数字を含む"
                    className={errors.password ? "border-red-500" : ""}
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "隠す" : "表示"}
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-500" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirm">
                  パスワード(確認) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password_confirm"
                    type={showPasswordConfirm ? "text" : "password"}
                    {...register("password_confirm")}
                    placeholder="パスワードを再入力"
                    className={errors.password_confirm ? "border-red-500" : ""}
                    aria-invalid={errors.password_confirm ? "true" : "false"}
                    aria-describedby={errors.password_confirm ? "password_confirm-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  >
                    {showPasswordConfirm ? "隠す" : "表示"}
                  </Button>
                </div>
                {errors.password_confirm && (
                  <p id="password_confirm-error" className="text-sm text-red-500" role="alert">
                    {errors.password_confirm.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Password (optional for edit) */}
          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="password">パスワード (変更する場合のみ)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="8文字以上、英数字を含む"
                  className={errors.password ? "border-red-500" : ""}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "隠す" : "表示"}
                </Button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-red-500" role="alert">
                  {errors.password.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                空欄の場合、パスワードは変更されません
              </p>
            </div>
          )}

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">
              部署 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedDepartment || ""}
              onValueChange={(value) => setValue("department", value)}
            >
              <SelectTrigger
                id="department"
                className={errors.department ? "border-red-500" : ""}
                aria-invalid={errors.department ? "true" : "false"}
                aria-describedby={errors.department ? "department-error" : undefined}
              >
                <SelectValue placeholder="部署を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p id="department-error" className="text-sm text-red-500" role="alert">
                {errors.department.message}
              </p>
            )}
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">
              役職 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedPosition || ""}
              onValueChange={(value) => setValue("position", value)}
            >
              <SelectTrigger
                id="position"
                className={errors.position ? "border-red-500" : ""}
                aria-invalid={errors.position ? "true" : "false"}
                aria-describedby={errors.position ? "position-error" : undefined}
              >
                <SelectValue placeholder="役職を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.position && (
              <p id="position-error" className="text-sm text-red-500" role="alert">
                {errors.position.message}
              </p>
            )}
          </div>

          {/* Manager */}
          <div className="space-y-2">
            <Label htmlFor="manager_id">上長</Label>
            <Select
              value={selectedManagerId ? selectedManagerId.toString() : "none"}
              onValueChange={(value) =>
                setValue("manager_id", value === "none" ? undefined : parseInt(value))
              }
            >
              <SelectTrigger
                id="manager_id"
                className={errors.manager_id ? "border-red-500" : ""}
                aria-invalid={errors.manager_id ? "true" : "false"}
                aria-describedby={errors.manager_id ? "manager_id-error" : undefined}
              >
                <SelectValue placeholder="上長を選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.manager_id && (
              <p id="manager_id-error" className="text-sm text-red-500" role="alert">
                {errors.manager_id.message}
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
