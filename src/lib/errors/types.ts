/**
 * Simplified Error Handling Types
 * ===============================
 * Minimal, focused system for type-safe error handling
 */

/**
 * Essential error codes for the application
 */
export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND', 
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * Field-level validation error (matches Phase 1 format)
 */
export interface FieldValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * API error response structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: FieldValidationError[];
  statusCode: number;
  timestamp: string;
}

/**
 * Type-safe service result discriminated union
 */
export type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

/**
 * Create a successful result
 */
export const createSuccessResult = <T>(data: T): ServiceResult<T> => ({
  success: true,
  data,
});

/**
 * Create an error result
 */
export const createErrorResult = <T>(error: ApiError): ServiceResult<T> => ({
  success: false,
  error,
});