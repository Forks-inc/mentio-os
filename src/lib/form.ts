/** Reading typed values out of a submitted form. */

export const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

/** A text field where empty means "clear it" (the API's null). */
export const strOrNull = (form: FormData, key: string) => str(form, key) || null;

export const bool = (form: FormData, key: string) => {
  const value = form.get(key);
  return value === 'true' || value === 'on';
};

export function int(form: FormData, key: string): number | null {
  const raw = str(form, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Every value of a repeated field (checkboxes), or a comma/newline list typed in one field. */
export function list(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .flatMap((v) => String(v).split(/[\n,]/))
    .map((v) => v.trim())
    .filter(Boolean);
}

/** One entry per line, commas kept: for names ("Doe, John") and free text lists. */
export function lines(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .flatMap((v) => String(v).split('\n'))
    .map((v) => v.trim())
    .filter(Boolean);
}

export const isOneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (options as readonly string[]).includes(value);
