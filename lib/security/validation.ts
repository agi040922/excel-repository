/**
 * Zod validation schemas for API requests
 *
 * Centralized validation schemas to ensure type safety and input validation
 */

import { z } from 'zod';

/**
 * Base64 image validation
 * Validates that the string is a valid base64 data URI
 */
const base64ImageSchema = z
  .string()
  .min(1, 'Image data is required')
  .regex(
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/,
    'Invalid base64 image format. Expected data:image/[type];base64,...'
  );

/**
 * Excel column schema
 */
export const excelColumnSchema = z.object({
  header: z.string().min(1, 'Column header is required'),
  key: z.string().min(1, 'Column key is required'),
});

/**
 * AI provider validation
 */
export const aiProviderSchema = z.enum(['gemini', 'openai', 'anthropic']);

/**
 * Detect header request schema
 */
export const detectHeaderRequestSchema = z.object({
  imageBase64: base64ImageSchema,
});

/**
 * Identify columns request schema
 */
export const identifyColumnsRequestSchema = z.object({
  imageBase64: base64ImageSchema,
  provider: aiProviderSchema.optional().default('gemini'),
});

/**
 * Extract data request schema
 */
export const extractDataRequestSchema = z.object({
  imageBase64: base64ImageSchema,
  columns: z
    .array(excelColumnSchema)
    .min(1, 'At least one column is required')
    .max(50, 'Maximum 50 columns allowed'),
  provider: aiProviderSchema.optional().default('gemini'),
});

/**
 * File upload request schema (for presigned URLs)
 */
export const uploadRequestSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Filename can only contain letters, numbers, dots, hyphens, and underscores'
    ),
  contentType: z
    .string()
    .min(1, 'Content type is required')
    .regex(
      /^[a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+$/,
      'Invalid content type format'
    ),
  folder: z
    .string()
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Folder name can only contain letters, numbers, hyphens, and underscores'
    )
    .optional()
    .default('uploads'),
});

/**
 * Billing checkout request schema
 */
export const checkoutRequestSchema = z.object({
  variantId: z
    .string()
    .min(1, 'Variant ID is required')
    .regex(/^\d+$/, 'Variant ID must be a numeric string'),
});

/**
 * Generic pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Validate request body with a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data
 * @throws ZodError if validation fails
 */
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Validate request body and return safe error
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success flag and either data or error
 */
export function safeValidateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Extract first error message for user-friendly response
  const firstIssue = result.error.issues[0];
  const errorMessage = firstIssue
    ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
    : 'Validation failed';

  return { success: false, error: errorMessage };
}

// Export types for TypeScript inference
export type DetectHeaderRequest = z.infer<typeof detectHeaderRequestSchema>;
export type IdentifyColumnsRequest = z.infer<typeof identifyColumnsRequestSchema>;
export type ExtractDataRequest = z.infer<typeof extractDataRequestSchema>;
export type UploadRequest = z.infer<typeof uploadRequestSchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
