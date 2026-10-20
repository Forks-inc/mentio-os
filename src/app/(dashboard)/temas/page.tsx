import Link from 'next/link';
import { ChartNoAxesCombined, CircleHelp } from 'lucide-react';
import { ThemeBubbleChart, type ThemeBubble } from '@/components/contest/theme-bubble-chart';
import { Card, EmptyState, LinkButton, PageHeader } from '@/components/ui';
import { compact } from '@/lib/format';
import { groupCandidates, sentimentScore } from '@/lib/insights';
import { mentio, unwrap } from '@/lib/mentio';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mapa de temas' };

const RANGE = '30d';
const MAX_TOPICS = 30;

function toneLabel(score: number | null) {
  if (score === null) return 'Sin datos aún';
  if (score >= 0.15) return 'Se habla mejor de este tema';
  if (score <= -0.15) return 'Se habla peor de este tema';
  return 'El tono está parejo';
}

function TopicList({ title, topics, tone }: {
  title: string;
  topics: ThemeBubble[];
  tone: 'good' | 'bad';
}) {
  return (
    <Card title={title} description={tone === 'good'
      ? 'Temas con más menciones positivas que negativas.'
      : 'Temas con más menciones negativas que positivas.'}
    >
      {topics.length ? (
        <ul className="divide-y">
          {topics.slice(0, 5).map((topic) => (
            <li key={topic.id}>
              <Link
                href={topic.href}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0 hover:text-primary"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{topic.name}</span>
                  <span className="text-xs text-muted-foreground">{toneLabel(topic.sentimentScore)}</span>
                </span>
                <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                  {compact(topic.matched)} menciones
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay temas con este tono en el periodo.
        </p>
      )}
    </Card>
  );
}

export default async function TemasPage() {
  const api = mentio();
  const keywords = unwrap(await api.listKeywords({
    query: { kind: ['topic'], sort: 'mentions' },
  })).data;
  const topics = groupCandidates(keywords).filter((candidate) => candidate.kind === 'topic');

  if (!topics.length) {
    return (
      <div>
        <PageHeader
          title="Mapa de temas"
          description="Mira qué temas ayudan a tu candidato y en cuáles necesita responder."
        />
        <EmptyState
          icon={CircleHelp}
          title="Aún no registras temas de agenda."
          action={<LinkButton href="/arranque" variant="primary">Agregar temas</LinkButton>}
        >
          Agrega temas como seguridad, empleo o salud para ver cómo se habla de ellos.
        </EmptyState>
      </div>
    );
  }

  const topicIds = topics.flatMap((topic) => topic.keywordIds);
  const voice = unwrap(await api.getShareOfVoice({ query: { range: RANGE, keywordIds: topicIds } }));
  const mentionCounts = new Map(voice.data.map((row) => [row.keyword.id, row.matched] as const));
  const rankedTopics = topics
    .map((topic) => ({
      ...topic,
      matched: topic.keywordIds.reduce((total, id) => total + (mentionCounts.get(id) ?? 0), 0),
    }))
    .sort((a, b) => b.matched - a.matched || a.name.localeCompare(b.name, 'es'));
  const visibleTopics = rankedTopics
    .slice(0, MAX_TOPICS);
  const summaries = await Promise.all(visibleTopics.map((topic) =>
    api.getAnalyticsSummary({ query: { range: RANGE, keywordIds: topic.keywordIds } }).then(unwrap),
  ));
  const bubbles: ThemeBubble[] = visibleTopics.map((topic, index) => {
    const summary = summaries[index];
    const classified = summary.sentiment.positive + summary.sentiment.neutral + summary.sentiment.negative;
    const score = classified ? sentimentScore(summary.sentiment) : null;
    const params = new URLSearchParams({ keywordIds: topic.keywordIds.join(',') });
    return {
      id: topic.mainId,
      name: topic.name,
      matched: topic.matched,
      sentimentScore: score,
      href: `/mentions?${params}`,
    };
  });
  const helped = bubbles
    .filter((topic) => topic.sentimentScore !== null && topic.sentimentScore >= 0.15)
    .sort((a, b) => (b.sentimentScore ?? 0) - (a.sentimentScore ?? 0));
  const hurt = bubbles
    .filter((topic) => topic.sentimentScore !== null && topic.sentimentScore <= -0.15)
    .sort((a, b) => (a.sentimentScore ?? 0) - (b.sentimentScore ?? 0));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mapa de temas"
        description="Cada burbuja es un tema de agenda. Más grande significa más menciones; el color muestra si el tono ayuda o preocupa."
      />

      <Card
        title="Conversación por tema"
        description="Últimos 30 días. El eje horizontal muestra menciones y el vertical, el tono de la conversación. Selecciona una burbuja para abrir esas menciones."
      >
        <ThemeBubbleChart topics={bubbles} />
        {topics.length > MAX_TOPICS ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Se muestran los {MAX_TOPICS} temas con más menciones de este periodo.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Colores de tono">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" /> Se habla mal</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-zinc-400" /> Tono parejo o sin datos</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Se habla bien</span>
        </div>
      </Card>

      <section className="grid gap-4 @4xl:grid-cols-2" aria-label="Temas que ayudan o preocupan">
        <TopicList title="Temas que te ayudan" topics={helped} tone="good" />
        <TopicList title="Temas que te hunden" topics={hurt} tone="bad" />
      </section>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ChartNoAxesCombined className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        El tono se calcula con las menciones positivas, neutrales y negativas del tema; los puntos grises todavía no tienen datos suficientes.
      </p>
    </div>
  );
}
