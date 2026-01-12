/**
 * Validation Schemas using Zod
 *
 * This module contains all validation schemas for forms and API requests.
 * Using Zod ensures type safety and runtime validation.
 */

import { z } from "zod";

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレス形式で入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

/**
 * Type inference from login schema
 */
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Visit record validation schema (for nested use in daily report)
 */
export const visitRecordSchema = z.object({
  visit_id: z.number().optional(), // Optional for updates
  customer_id: z.number().int().positive("顧客IDは必須です"),
  visit_time: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "訪問時刻はHH:MM形式で入力してください"),
  visit_content: z
    .string()
    .min(1, "訪問内容を入力してください")
    .max(500, "訪問内容は500文字以内で入力してください"),
});

/**
 * Daily report creation validation schema
 */
export const createDailyReportSchema = z.object({
  report_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "報告日はYYYY-MM-DD形式で入力してください"),
  problem: z
    .string()
    .max(1000, "課題・相談は1000文字以内で入力してください")
    .optional(),
  plan: z
    .string()
    .max(1000, "明日の予定は1000文字以内で入力してください")
    .optional(),
  visits: z
    .array(visitRecordSchema)
    .min(1, "訪問記録は最低1件必要です"),
});

/**
 * Daily report update validation schema
 */
export const updateDailyReportSchema = z.object({
  report_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "報告日はYYYY-MM-DD形式で入力してください"),
  problem: z
    .string()
    .max(1000, "課題・相談は1000文字以内で入力してください")
    .optional(),
  plan: z
    .string()
    .max(1000, "明日の予定は1000文字以内で入力してください")
    .optional(),
  visits: z
    .array(visitRecordSchema)
    .min(1, "訪問記録は最低1件必要です"),
});

/**
 * Type inference from daily report schemas
 */
export type VisitRecordInput = z.infer<typeof visitRecordSchema>;
export type CreateDailyReportInput = z.infer<typeof createDailyReportSchema>;
export type UpdateDailyReportInput = z.infer<typeof updateDailyReportSchema>;
