import type { AnalyticsSummary, Keyword } from '@mentio-dev/sdk';

export type InsightSummary = Pick<AnalyticsSummary, 'matched' | 'sentiment'>;
export type PreviousInsightSummary = Pick<InsightSummary, 'matched' | 'sentiment'> | null | undefined;
export type TrafficLightColor = 'green' | 'yellow' | 'red' | 'gray';

export type TrafficLightResult = {
  color: TrafficLightColor;
  label: string;
  isCrisis: boolean;
};

export type InsightTopic = string | null | undefined;

export type CandidateKeyword = Pick<Keyword, 'id' | 'term' | 'kind' | 'group' | 'context'>;
export type CandidateGroup = {
  name: string;
  kind: CandidateKeyword['kind'];
  keywordIds: string[];
  mainId: string;
};

const VARIANT_PREFIX = 'Variante de: ';

/** Collapse explicit aliases onto their principal term within the same kind and campaign. */
export function groupCandidates(keywords: readonly CandidateKeyword[]): CandidateGroup[] {
  const groups: CandidateGroup[] = [];
  const mainByKey = new Map<string, CandidateGroup>();
  const isVariant = (context: string | null) => context?.startsWith(VARIANT_PREFIX) ?? false;

  for (const keyword of keywords) {
    if (isVariant(keyword.context)) continue;

    const key = candidateKey(keyword.kind, keyword.group.id, keyword.term);
    const existing = mainByKey.get(key);
    if (existing) {
      if (!existing.keywordIds.includes(keyword.id)) existing.keywordIds.push(keyword.id);
      continue;
    }

    const candidate: CandidateGroup = {
      name: keyword.term,
      kind: keyword.kind,
      keywordIds: [keyword.id],
      mainId: keyword.id,
    };
    mainByKey.set(key, candidate);
    groups.push(candidate);
  }

  for (const keyword of keywords) {
    const context = keyword.context;
    if (!isVariant(context) || !context) continue;

    const principal = context.slice(VARIANT_PREFIX.length).trim();
    const key = principal ? candidateKey(keyword.kind, keyword.group.id, principal) : '';
    const candidate = key ? mainByKey.get(key) : undefined;
    if (candidate) {
      if (!candidate.keywordIds.includes(keyword.id)) candidate.keywordIds.push(keyword.id);
      continue;
    }

    groups.push({ name: keyword.term, kind: keyword.kind, keywordIds: [keyword.id], mainId: keyword.id });
  }

  return groups;
}

function candidateKey(kind: CandidateKeyword['kind'], groupId: string, term: string): string {
  return `${kind}\u0000${groupId}\u0000${term.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-MX')}`;
}

/** Net sentiment as a share of the mentions that have a classified tone. */
export function sentimentScore(sentiment: InsightSummary['sentiment']): number {
  const classified = sentiment.positive + sentiment.neutral + sentiment.negative;
  return (sentiment.positive - sentiment.negative) / Math.max(1, classified);
}

/** The campaign's single traffic-light rule, shared by every overview card. */
export function trafficLight(summary: InsightSummary | null | undefined, prevSummary?: PreviousInsightSummary): TrafficLightResult {
  const sentiment = summary?.sentiment;
  const classified = sentiment ? sentiment.positive + sentiment.neutral + sentiment.negative : 0;
  if (!summary || !sentiment || classified === 0) return { color: 'gray', label: 'Sin datos aún', isCrisis: false };

  const negative = sentiment.negative;
  const previousNegative = prevSummary?.sentiment.negative;
  const hasPrevious = previousNegative !== undefined && previousNegative !== null;
  const increase = hasPrevious && negative > previousNegative
    ? previousNegative === 0 ? Number.POSITIVE_INFINITY : (negative - previousNegative) / previousNegative
    : 0;
  const negativeRoseAtLeastHalf = increase >= 0.5;
  const negativeRoseMoreThanHalf = increase > 0.5;
  const isCrisis = negative >= 20 && negativeRoseAtLeastHalf;

  if (isCrisis) return { color: 'red', label: 'Posible crisis', isCrisis: true };

  const score = sentimentScore(sentiment);
  if (score <= -0.15) return { color: 'red', label: 'Tono negativo', isCrisis: false };
  if (score >= 0.15 && !negativeRoseMoreThanHalf) return { color: 'green', label: 'Buena señal', isCrisis: false };
  return { color: 'yellow', label: 'Atención', isCrisis: false };
}

/** A short, plain-language readout comparing volume, topic and tone. */
export function plainSentence(summary: InsightSummary, prevSummary?: PreviousInsightSummary, topic?: InsightTopic): string {
  const topicSentence = topic
    ? `El tema principal es «${topic}».`
    : 'Aún no registras temas de agenda para identificar un tema principal.';
  const tone = dominantTone(summary.sentiment);
  const classified = summary.sentiment.positive + summary.sentiment.neutral + summary.sentiment.negative;

  if (summary.matched === 0) return `Aún no hay menciones sobre ti para valorar la conversación. ${topicSentence}`;
  if (classified === 0) return `Hay ${number(summary.matched)} menciones, pero aún no hay suficientes datos de tono. ${topicSentence}`;

  let volumeSentence: string;
  if (!prevSummary || prevSummary.matched === 0) {
    volumeSentence = `Se registran ${number(summary.matched)} menciones sobre ti; aún no hay un periodo anterior para comparar.`;
  } else {
    const change = Math.round(((summary.matched - prevSummary.matched) / prevSummary.matched) * 100);
    volumeSentence = change === 0
      ? 'La conversación se mantiene al mismo nivel que en el periodo anterior.'
      : `Se habla ${number(Math.abs(change))}% ${change > 0 ? 'más' : 'menos'} de ti que en el periodo anterior.`;
  }

  return `${volumeSentence} ${topicSentence} El tono es ${tone}.`;
}

function dominantTone(sentiment: InsightSummary['sentiment']): string {
  const highest = Math.max(sentiment.positive, sentiment.neutral, sentiment.negative);
  const leaders = [
    sentiment.positive === highest ? 'positivo' : null,
    sentiment.neutral === highest ? 'neutral' : null,
    sentiment.negative === highest ? 'negativo' : null,
  ].filter(Boolean);

  if (leaders.length !== 1) return 'variado';
  return leaders[0] === 'positivo' ? 'mayormente positivo' : leaders[0] === 'negativo' ? 'mayormente negativo' : 'mayormente neutral';
}

function number(value: number): string {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(value);
}
