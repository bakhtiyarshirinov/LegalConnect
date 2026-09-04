/**
 * Backend error body shape (ASP.NET validation + custom exceptions):
 *   { status, message, errors?: { [field: string]: string[] } }
 *
 * Turns it into a single human-readable string for a toast. When a field-level
 * `errors` object is present its concrete messages win over the generic
 * `message` ("Validation failed"); otherwise `message` is the fallback.
 *
 * Used by the axios response interceptor, so every form in the portal benefits.
 */
export interface ApiErrorBody {
  status?: number
  message?: string
  title?: string
  errors?: Record<string, string[] | string> | null
}

export function extractApiErrorMessage(
  data: ApiErrorBody | undefined | null,
  fallback = 'Something went wrong',
): string {
  const fieldMessages = flattenErrors(data?.errors)
  if (fieldMessages.length > 0) {
    return fieldMessages.join('; ')
  }
  return data?.message || data?.title || fallback
}

function flattenErrors(errors: ApiErrorBody['errors']): string[] {
  if (!errors || typeof errors !== 'object') return []
  const out: string[] = []
  for (const value of Object.values(errors)) {
    if (Array.isArray(value)) {
      for (const m of value) if (typeof m === 'string' && m.trim()) out.push(m.trim())
    } else if (typeof value === 'string' && value.trim()) {
      out.push(value.trim())
    }
  }
  // de-dupe while keeping order
  return [...new Set(out)]
}
