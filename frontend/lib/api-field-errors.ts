import type { AxiosError } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import type { ApiError } from '@/lib/api';

export type ApiFieldError = { field: string; issue: string };

/** Extract validation field errors from a failed API response. */
export function getApiValidationDetails(error: unknown): ApiFieldError[] {
  if (!error || typeof error !== 'object') return [];
  const ax = error as AxiosError<{ error?: ApiError }>;
  const details = ax.response?.data?.error?.details;
  if (!Array.isArray(details)) return [];
  return details.filter(
    (item): item is ApiFieldError =>
      Boolean(item && typeof item === 'object' && 'field' in item && 'issue' in item),
  );
}

/** Strip FastAPI `body.` prefix from validation field paths. */
export function normalizeApiFieldName(field: string): string {
  return field.replace(/^body\./, '');
}

/**
 * Map server validation errors onto react-hook-form fields.
 * Returns true when at least one field error was applied.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap?: Partial<Record<string, Path<T>>>,
): boolean {
  const details = getApiValidationDetails(error);
  let applied = false;

  for (const { field, issue } of details) {
    const normalized = normalizeApiFieldName(field);
    const formField = (fieldMap?.[normalized] ?? normalized) as Path<T>;
    setError(formField, { type: 'server', message: issue });
    applied = true;
  }

  return applied;
}
