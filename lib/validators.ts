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

/**
 * Customer creation validation schema
 */
export const createCustomerSchema = z.object({
  customer_name: z
    .string()
    .min(1, "顧客名を入力してください")
    .max(100, "顧客名は100文字以内で入力してください"),
  address: z
    .string()
    .max(255, "住所は255文字以内で入力してください")
    .transform(val => val || undefined)
    .optional(),
  phone: z
    .string()
    .max(20, "電話番号は20文字以内で入力してください")
    .regex(/^[0-9\-]*$/, "電話番号は数字とハイフンのみで入力してください")
    .transform(val => val || undefined)
    .optional(),
  email: z
    .string()
    .email("正しいメールアドレス形式で入力してください")
    .max(255, "メールアドレスは255文字以内で入力してください")
    .transform(val => val || undefined)
    .optional(),
  assigned_employee_id: z
    .number()
    .int()
    .positive("担当営業IDは必須です"),
});

/**
 * Customer update validation schema
 */
export const updateCustomerSchema = z.object({
  customer_name: z
    .string()
    .min(1, "顧客名を入力してください")
    .max(100, "顧客名は100文字以内で入力してください"),
  address: z
    .string()
    .max(255, "住所は255文字以内で入力してください")
    .transform(val => val || undefined)
    .optional(),
  phone: z
    .string()
    .max(20, "電話番号は20文字以内で入力してください")
    .regex(/^[0-9\-]*$/, "電話番号は数字とハイフンのみで入力してください")
    .transform(val => val || undefined)
    .optional(),
  email: z
    .string()
    .email("正しいメールアドレス形式で入力してください")
    .max(255, "メールアドレスは255文字以内で入力してください")
    .transform(val => val || undefined)
    .optional(),
  assigned_employee_id: z
    .number()
    .int()
    .positive("担当営業IDは必須です"),
});

/**
 * Type inference from customer schemas
 */
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

/**
 * Employee creation validation schema
 */
export const createEmployeeSchema = z.object({
  name: z
    .string()
    .min(1, "社員名を入力してください")
    .max(50, "社員名は50文字以内で入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレス形式で入力してください")
    .max(255, "メールアドレスは255文字以内で入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "パスワードは英数字を含む必要があります"),
  department: z
    .string()
    .min(1, "部署を入力してください")
    .max(100, "部署は100文字以内で入力してください"),
  position: z
    .string()
    .min(1, "役職を入力してください")
    .max(100, "役職は100文字以内で入力してください"),
  manager_id: z
    .number()
    .int()
    .positive()
    .optional(),
});

/**
 * Employee update validation schema
 */
export const updateEmployeeSchema = z.object({
  name: z
    .string()
    .min(1, "社員名を入力してください")
    .max(50, "社員名は50文字以内で入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレス形式で入力してください")
    .max(255, "メールアドレスは255文字以内で入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "パスワードは英数字を含む必要があります")
    .optional(),
  department: z
    .string()
    .min(1, "部署を入力してください")
    .max(100, "部署は100文字以内で入力してください"),
  position: z
    .string()
    .min(1, "役職を入力してください")
    .max(100, "役職は100文字以内で入力してください"),
  manager_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

/**
 * Type inference from employee schemas
 */
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
