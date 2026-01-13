"use client";

/**
 * Visit Record Form Component
 *
 * Component for managing dynamic visit records with add/delete functionality.
 * Uses React Hook Form's useFieldArray for form state management.
 *
 * @see CLAUDE.md - components/features/daily-report/visit-record-form.tsx
 * @see screen-specification.md - S-04 日報作成・編集画面
 */

import { Control, Controller, useFieldArray, FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { CreateDailyReportInput } from "@/lib/validators";

interface Customer {
  customer_id: number;
  customer_name: string;
}

interface VisitRecordFormProps {
  control: Control<CreateDailyReportInput>;
  customers: Customer[];
  isLoadingCustomers: boolean;
  isSubmitting: boolean;
  errors?: FieldErrors<CreateDailyReportInput>;
}

/**
 * Visit Record Form Component
 *
 * Features:
 * - Dynamic add/remove visit records using useFieldArray
 * - Minimum 1 visit record required (cannot delete last record)
 * - Customer selection from dropdown
 * - Visit time input (HH:MM format)
 * - Visit content textarea (max 500 characters)
 * - Real-time character count
 * - Form validation with error messages
 */
export function VisitRecordForm({
  control,
  customers,
  isLoadingCustomers,
  isSubmitting,
  errors = {},
}: VisitRecordFormProps) {
  const { toast } = useToast();

  // useFieldArray for dynamic visit records
  const { fields, append, remove } = useFieldArray({
    control,
    name: "visits",
  });

  // Add new visit record
  const handleAddVisit = () => {
    append({
      customer_id: 0,
      visit_time: "",
      visit_content: "",
    });
  };

  // Remove visit record with minimum validation
  const handleRemoveVisit = (index: number) => {
    if (fields.length === 1) {
      toast({
        title: "警告",
        description: "訪問記録は最低1件必要です",
        variant: "destructive",
      });
      return;
    }
    remove(index);
  };

  return (
    <div className="space-y-6">
      {/* Add Visit Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddVisit}
          disabled={isSubmitting || isLoadingCustomers}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          訪問記録を追加
        </Button>
      </div>

      {/* Visit Records */}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="space-y-4 rounded-lg border p-4 relative"
        >
          {/* Delete Button (only show if more than 1 record) */}
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveVisit(index)}
              disabled={isSubmitting}
              className="absolute top-2 right-2 gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              削除
            </Button>
          )}

          <h4 className="font-semibold">訪問記録 {index + 1}</h4>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor={`visits.${index}.customer_id`}>
              顧客名 <span className="text-destructive">*</span>
            </Label>
            <Controller
              name={`visits.${index}.customer_id`}
              control={control}
              render={({ field: controllerField }) => (
                <Select
                  disabled={isSubmitting || isLoadingCustomers}
                  value={controllerField.value?.toString() || ""}
                  onValueChange={(value) =>
                    controllerField.onChange(parseInt(value))
                  }
                >
                  <SelectTrigger
                    id={`visits.${index}.customer_id`}
                    className={
                      errors?.visits?.[index]?.customer_id
                        ? "border-destructive"
                        : ""
                    }
                  >
                    <SelectValue placeholder="顧客を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.customer_id}
                        value={customer.customer_id.toString()}
                      >
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors?.visits?.[index]?.customer_id && (
              <p className="text-sm text-destructive">
                {errors.visits[index].customer_id?.message}
              </p>
            )}
          </div>

          {/* Visit Time */}
          <div className="space-y-2">
            <Label htmlFor={`visits.${index}.visit_time`}>
              訪問時刻 <span className="text-destructive">*</span>
            </Label>
            <Controller
              name={`visits.${index}.visit_time`}
              control={control}
              render={({ field: controllerField }) => (
                <Input
                  {...controllerField}
                  id={`visits.${index}.visit_time`}
                  type="time"
                  disabled={isSubmitting}
                  className={
                    errors?.visits?.[index]?.visit_time
                      ? "border-destructive"
                      : ""
                  }
                />
              )}
            />
            {errors?.visits?.[index]?.visit_time && (
              <p className="text-sm text-destructive">
                {errors.visits[index].visit_time?.message}
              </p>
            )}
          </div>

          {/* Visit Content */}
          <div className="space-y-2">
            <Label htmlFor={`visits.${index}.visit_content`}>
              訪問内容 <span className="text-destructive">*</span>
            </Label>
            <Controller
              name={`visits.${index}.visit_content`}
              control={control}
              render={({ field: controllerField }) => (
                <Textarea
                  {...controllerField}
                  id={`visits.${index}.visit_content`}
                  disabled={isSubmitting}
                  placeholder="訪問内容を入力してください（500文字以内）"
                  rows={4}
                  maxLength={500}
                  className={
                    errors?.visits?.[index]?.visit_content
                      ? "border-destructive"
                      : ""
                  }
                />
              )}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {errors?.visits?.[index]?.visit_content && (
                  <span className="text-destructive">
                    {errors.visits[index].visit_content?.message}
                  </span>
                )}
              </span>
              <span>{field.visit_content?.length || 0} / 500</span>
            </div>
          </div>
        </div>
      ))}

      {/* Global visits error */}
      {errors?.visits && typeof errors.visits.message === "string" && (
        <p className="text-sm text-destructive">{errors.visits.message}</p>
      )}
    </div>
  );
}
