/** Server-safe helpers for FormFilters (a 'use client' module cannot hand functions to the server). */

/** A filter object (a segment's, a view's) as the string values FormFilters starts from. */
export function filterDefaults(filter: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filter).flatMap(([key, value]) =>
      value === undefined || value === null || (Array.isArray(value) && value.length === 0) ? [] : [[key, Array.isArray(value) ? value.join(',') : String(value)]],
    ),
  );
}
