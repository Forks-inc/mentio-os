/** Small formatting helpers shared by the pages. */

export const PLATFORM_NAMES: Record<string, string> = {
  x: 'X',
  reddit: 'Reddit',
  hackernews: 'Hacker News',
  github: 'GitHub',
  bluesky: 'Bluesky',
  linkedin: 'LinkedIn',
  stackoverflow: 'Stack Overflow',
  devto: 'DEV',
  youtube: 'YouTube',
  news: 'News',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  appstore: 'App Store',
  googleplay: 'Google Play',
  trustpilot: 'Trustpilot',
  googlemaps: 'Google Maps',
};

export const platformName = (id: string) => PLATFORM_NAMES[id] ?? id;

/** Platforms a keyword is searched on (the review platforms are connected as apps instead). */
export const SEARCH_PLATFORMS = ['x', 'reddit', 'hackernews', 'github', 'bluesky', 'linkedin', 'stackoverflow', 'devto', 'youtube', 'news', 'tiktok', 'instagram'] as const;
export const REVIEW_PLATFORMS = ['appstore', 'googleplay', 'trustpilot', 'googlemaps'] as const;

export const INTENTS = ['buy_intent', 'question', 'complaint', 'praise', 'comparison', 'churn_intent', 'bug_report', 'pricing', 'hiring', 'event', 'promotional'] as const;
export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;

export function date(iso: string | null | undefined) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

/** "buy_intent" -> "Buy intent". */
export const tagName = (tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1).replace(/_/g, ' ');

export function compact(n: number | null | undefined) {
  if (n === null || n === undefined) return '0';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function money(cents: number) {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso || Number.isNaN(new Date(iso).getTime())) return '';
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const units: Array<[number, string]> = [
    [60 * 60 * 24 * 365, 'y'],
    [60 * 60 * 24 * 30, 'mo'],
    [60 * 60 * 24, 'd'],
    [60 * 60, 'h'],
    [60, 'm'],
  ];
  for (const [size, label] of units) if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  return 'just now';
}

/** A calendar day, "Sep 30, 2026"; a date-only or full ISO string. */
export function day(iso: string | null | undefined) {
  const d = iso ? new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(d);
}
