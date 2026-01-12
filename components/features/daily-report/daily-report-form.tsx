"use client";

/**
 * Daily Report Form Component
 *
 * Form for creating and editing daily reports with visit records.
 *
 * @see screen-specification.md - S-04 日報作成・編集画面
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2, Save, X as XIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { CreateDailyReportInput, VisitRecordInput } from "@/lib/validators";

interface Customer {
  customer_id: number;
  customer_name: string;
}

interface DailyReportFormProps {
  mode: "create" | "edit";
  reportId?: number;
  initialData?: {
    report_date: string;
    problem?: string;
    plan?: string;
    visits: VisitRecordInput[];
  };
}

export function DailyReportForm({
  mode,
  reportId,
  initialData,
}: DailyReportFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [reportDate, setReportDate] = useState(
    initialData?.report_date || new Date().toISOString().split("T")[0]
  );
  const [problem, setProblem] = useState(initialData?.problem || "");
  const [plan, setPlan] = useState(initialData?.plan || "");
  const [visits, setVisits] = useState<VisitRecordInput[]>(
    initialData?.visits || [
      {
        customer_id: 0,
        visit_time: "",
        visit_content: "",
      },
    ]
  );

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/customers?limit=500");
        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }
        const result = await response.json();
        setCustomers(result.data);
      } catch (error) {
        console.error("Error loading customers:", error);
        toast({
          title: "エラー",
          description: "顧客情報の読み込みに失敗しました",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [toast]);

  // Add new visit record
  const handleAddVisit = () => {
    setVisits([
      ...visits,
      {
        customer_id: 0,
        visit_time: "",
        visit_content: "",
      },
    ]);
  };

  // Remove visit record
  const handleRemoveVisit = (index: number) => {
    if (visits.length === 1) {
      toast({
        title: "警告",
        description: "訪問記録は最低1件必要です",
        variant: "destructive",
      });
      return;
    }
    setVisits(visits.filter((_, i) => i !== index));
  };

  // Update visit record field
  const handleVisitChange = (
    index: number,
    field: keyof VisitRecordInput,
    value: string | number
  ) => {
    const newVisits = [...visits];
    newVisits[index] = {
      ...newVisits[index],
      [field]: value,
    };
    setVisits(newVisits);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate report date
    if (!reportDate) {
      newErrors.report_date = "報告日は必須です";
    }

    // Validate problem length
    if (problem && problem.length > 1000) {
      newErrors.problem = "課題・相談は1000文字以内で入力してください";
    }

    // Validate plan length
    if (plan && plan.length > 1000) {
      newErrors.plan = "明日の予定は1000文字以内で入力してください";
    }

    // Validate visits
    if (visits.length === 0) {
      newErrors.visits = "訪問記録は最低1件必要です";
    }

    visits.forEach((visit, index) => {
      if (!visit.customer_id || visit.customer_id === 0) {
        newErrors[`visit_${index}_customer`] = "顧客を選択してください";
      }
      if (!visit.visit_time) {
        newErrors[`visit_${index}_time`] = "訪問時刻を入力してください";
      } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(visit.visit_time)) {
        newErrors[`visit_${index}_time`] = "訪問時刻はHH:MM形式で入力してください";
      }
      if (!visit.visit_content) {
        newErrors[`visit_${index}_content`] = "訪問内容を入力してください";
      } else if (visit.visit_content.length > 500) {
        newErrors[`visit_${index}_content`] = "訪問内容は500文字以内で入力してください";
      }
    });

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
      const data: CreateDailyReportInput = {
        report_date: reportDate,
        problem: problem || undefined,
        plan: plan || undefined,
        visits: visits,
      };

      const url =
        mode === "create"
          ? "/api/daily-reports"
          : `/api/daily-reports/${reportId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "日報の保存に失敗しました");
      }

      const result = await response.json();

      toast({
        title: "成功",
        description:
          mode === "create"
            ? "日報を作成しました"
            : "日報を更新しました",
      });

      // Navigate to detail page
      router.push(`/daily-reports/${result.report_id}`);
    } catch (error) {
      console.error("Error submitting daily report:", error);
      toast({
        title: "エラー",
        description:
          error instanceof Error
            ? error.message
            : "日報の保存中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/daily-reports");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Date */}
          <div className="space-y-2">
            <Label htmlFor="report-date">
              報告日 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="report-date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              disabled={isSubmitting}
              className={errors.report_date ? "border-destructive" : ""}
            />
            {errors.report_date && (
              <p className="text-sm text-destructive">{errors.report_date}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visit Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>訪問記録</CardTitle>
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
        </CardHeader>
        <CardContent className="space-y-6">
          {visits.map((visit, index) => (
            <div
              key={index}
              className="space-y-4 rounded-lg border p-4 relative"
            >
              {visits.length > 1 && (
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

              {/* Customer */}
              <div className="space-y-2">
                <Label htmlFor={`customer-${index}`}>
                  顧客名 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={visit.customer_id.toString()}
                  onValueChange={(value) =>
                    handleVisitChange(index, "customer_id", parseInt(value))
                  }
                  disabled={isSubmitting || isLoadingCustomers}
                >
                  <SelectTrigger
                    id={`customer-${index}`}
                    className={
                      errors[`visit_${index}_customer`]
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
                {errors[`visit_${index}_customer`] && (
                  <p className="text-sm text-destructive">
                    {errors[`visit_${index}_customer`]}
                  </p>
                )}
              </div>

              {/* Visit Time */}
              <div className="space-y-2">
                <Label htmlFor={`visit-time-${index}`}>
                  訪問時刻 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`visit-time-${index}`}
                  type="time"
                  value={visit.visit_time}
                  onChange={(e) =>
                    handleVisitChange(index, "visit_time", e.target.value)
                  }
                  disabled={isSubmitting}
                  className={
                    errors[`visit_${index}_time`] ? "border-destructive" : ""
                  }
                />
                {errors[`visit_${index}_time`] && (
                  <p className="text-sm text-destructive">
                    {errors[`visit_${index}_time`]}
                  </p>
                )}
              </div>

              {/* Visit Content */}
              <div className="space-y-2">
                <Label htmlFor={`visit-content-${index}`}>
                  訪問内容 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={`visit-content-${index}`}
                  value={visit.visit_content}
                  onChange={(e) =>
                    handleVisitChange(index, "visit_content", e.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="訪問内容を入力してください（500文字以内）"
                  rows={4}
                  maxLength={500}
                  className={
                    errors[`visit_${index}_content`]
                      ? "border-destructive"
                      : ""
                  }
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {errors[`visit_${index}_content`] && (
                      <span className="text-destructive">
                        {errors[`visit_${index}_content`]}
                      </span>
                    )}
                  </span>
                  <span>{visit.visit_content.length} / 500</span>
                </div>
              </div>
            </div>
          ))}
          {errors.visits && (
            <p className="text-sm text-destructive">{errors.visits}</p>
          )}
        </CardContent>
      </Card>

      {/* Problem and Plan */}
      <Card>
        <CardHeader>
          <CardTitle>課題と予定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Problem */}
          <div className="space-y-2">
            <Label htmlFor="problem">今日の課題・相談 (Problem)</Label>
            <Textarea
              id="problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              disabled={isSubmitting}
              placeholder="今日の課題や相談事項を入力してください（1000文字以内）"
              rows={4}
              maxLength={1000}
              className={errors.problem ? "border-destructive" : ""}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {errors.problem && (
                  <span className="text-destructive">{errors.problem}</span>
                )}
              </span>
              <span>{problem.length} / 1000</span>
            </div>
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <Label htmlFor="plan">明日の予定 (Plan)</Label>
            <Textarea
              id="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              disabled={isSubmitting}
              placeholder="明日の予定ややることを入力してください（1000文字以内）"
              rows={4}
              maxLength={1000}
              className={errors.plan ? "border-destructive" : ""}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {errors.plan && (
                  <span className="text-destructive">{errors.plan}</span>
                )}
              </span>
              <span>{plan.length} / 1000</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="gap-2"
        >
          <XIcon className="h-4 w-4" />
          キャンセル
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isLoadingCustomers}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSubmitting
            ? "保存中..."
            : mode === "create"
            ? "作成"
            : "更新"}
        </Button>
      </div>
    </form>
  );
}
