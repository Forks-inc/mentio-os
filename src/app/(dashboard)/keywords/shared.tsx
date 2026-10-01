/** Small pieces the keyword pages share: vocabulary, status badges, labels. */
import type { Keyword, ReviewSource } from '@mentio-dev/sdk';
import { PlatformIcon } from '@/components/platform-icon';
import { Badge } from '@/components/ui';
import { platformName } from '@/lib/format';

export const KINDS = ['brand', 'competitor', 'topic'] as const;
export const KIND_LABELS: Record<(typeof KINDS)[number], string> = { brand: 'Brand', competitor: 'Competitor', topic: 'Topic' };

export const STATUSES = [
  ['active', 'Active'],
  ['muted', 'Paused by you'],
  ['paused', 'Paused: no balance'],
  ['noisy', 'Paused: too noisy'],
  ['capped', 'At its cap'],
] as const;

export const SORTS = [
  ['newest', 'Newest'],
  ['oldest', 'Oldest'],
  ['term', 'A to Z'],
  ['mentions', 'Most mentions'],
  ['relevant', 'Most relevant'],
  ['recent', 'Most in last 7 days'],
  ['lastMention', 'Latest mention'],
] as const;

type ReviewPlatform = ReviewSource['platform'];

/** App stores read one storefront per country; Trustpilot and Google Maps have one page. */
export const takesCountries = (platform: ReviewPlatform) => platform === 'appstore' || platform === 'googleplay';
/** Google Play answers one review language at a time. */
export const takesLanguage = (platform: ReviewPlatform) => platform === 'googleplay';

/** A stable form-field prefix for one connected review page. */
export const sourceKey = (src: Pick<ReviewSource, 'platform' | 'id'>) => `rs:${src.platform}:${src.id}`;

export function platformsLabel(keyword: Pick<Keyword, 'platforms' | 'reviewSources'>) {
  const search = keyword.platforms === null ? 'All platforms' : keyword.platforms.length === 0 ? 'Reviews only' : keyword.platforms.map(platformName).join(', ');
  const n = keyword.reviewSources.length;
  return n ? `${search} + ${n} review ${n === 1 ? 'page' : 'pages'}` : search;
}

/** Every state a keyword can be in, as badges. */
export function KeywordBadges({ keyword }: { keyword: Keyword }) {
  const badges = [];
  if (keyword.pausedForBalance) badges.push(<Badge key="balance" tone="warn">Paused: no balance</Badge>);
  if (keyword.pausedForNoise) badges.push(<Badge key="noise" tone="warn">Paused: too noisy</Badge>);
  if (keyword.muted && !keyword.pausedForBalance && !keyword.pausedForNoise) badges.push(<Badge key="muted">Paused</Badge>);
  if (keyword.pausedForCap) badges.push(<Badge key="cap" tone="warn">At its cap</Badge>);
  if (badges.length === 0) badges.push(<Badge key="active" tone="good">Active</Badge>);
  if (keyword.stats.noise.noisy) badges.push(<Badge key="noisy" tone="bad">Noisy</Badge>);
  return <span className="inline-flex flex-wrap gap-1">{badges}</span>;
}

/** The platforms a keyword listens on, as logos: every platform, review pages only, or the ones it names. */
export function PlatformIcons({ keyword }: { keyword: Pick<Keyword, 'platforms' | 'reviewSources'> }) {
  const reviews = keyword.reviewSources ?? [];
  const reviewPlatforms = [...new Set(reviews.map((r) => r.platform))];
  if (keyword.platforms === null) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        All platforms
        {reviewPlatforms.map((p, pIndex) => <PlatformIcon key={`${p}-${pIndex}`} platform={p} />)}
      </span>
    );
  }
  const shown = [...keyword.platforms, ...reviewPlatforms];
  if (shown.length === 0) return <span className="text-xs text-muted-foreground">None</span>;
  return (
    <span className="flex flex-wrap items-center gap-1" title={platformsLabel(keyword)}>
      {shown.map((p, pIndex) => <PlatformIcon key={`${p}-${pIndex}`} platform={p} />)}
    </span>
  );
}
