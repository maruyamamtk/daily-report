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
