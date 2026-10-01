/** Reading a page's URL search params, where filters live so every view is a link. */
export type SearchParams = Record<string, string | string[] | undefined>;

export const one = (params: SearchParams, key: string) => {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) || undefined;
};

/** A repeated or comma-separated param as a list. */
export const many = (params: SearchParams, key: string) => {
  const value = params[key];
  return (Array.isArray(value) ? value : value ? [value] : []).flatMap((v) => v.split(',')).filter(Boolean);
};

/** The same URL with some params changed (undefined removes one). */
export function withParams(path: string, params: SearchParams, changes: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || key in changes) continue;
    for (const v of Array.isArray(value) ? value : [value]) query.append(key, v);
  }
  for (const [key, value] of Object.entries(changes)) if (value) query.set(key, value);
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}
