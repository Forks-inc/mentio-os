import type { AnalyticsBreakdown } from '@mentio-dev/sdk';
import type { ReactNode } from 'react';
import { BarList, Card, EmptyState, LinkButton } from '@/components/ui';
import { InfoTip } from '@/components/info-tip';
import { platformName, tagName } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { HourHeatmap } from './charts';
import { keywordName, mentionsHref, type WindowQuery } from './window';

type Row = AnalyticsBreakdown['data'][number];
type By = AnalyticsBreakdown['by'];

const LANGUAGES = new Intl.DisplayNames(['es-MX'], { type: 'language' });
const languageName = (code: string) => {
  if (code === 'unknown') return 'Desconocido';
  try {
    return LANGUAGES.of(code) ?? code;
  } catch {
    return code;
  }
};

/** Each dimension: how to name a row and which feed filter it opens. */
const DIMENSIONS: Array<{ by: Exclude<By, 'hour'>; title: ReactNode; description?: string; emptyTitle: string; example: string; label: (r: Row) => string; filter: (r: Row) => Record<string, string> | null }> = [
  { by: 'platform', title: <>Plataforma <InfoTip text="Canal donde se publicaron las menciones, como Instagram o Reddit." /></>, emptyTitle: 'Aún no hay plataformas con menciones', example: 'Una publicación sobre “María López” en Instagram aparecerá aquí como actividad de ese canal.', label: (r) => platformName(r.key), filter: (r) => ({ platforms: r.key }) },
  { by: 'keyword', title: <>Término monitoreado <InfoTip text="Candidato, adversario o tema que la campaña decidió seguir." /></>, emptyTitle: 'Aún no hay términos con menciones', example: 'Registra “María López” y “seguridad” para ver qué parte de la conversación corresponde a cada término.', label: (r) => (r.keyword ? keywordName(r.keyword) : r.label), filter: (r) => (r.keyword ? { keywordIds: r.keyword.id } : null) },
  { by: 'sentiment', title: <>Sentimiento <InfoTip term="sentimiento o tono" /></>, emptyTitle: 'Aún no hay menciones con tono clasificado', example: 'Una publicación que apoya la propuesta de seguridad puede aparecer como positiva.', label: (r) => ({ positive: 'Positivo', neutral: 'Neutral', negative: 'Negativo', unclassified: 'Sin clasificar' }[r.key] ?? tagName(r.key)), filter: (r) => (r.key === 'unclassified' ? null : { sentiments: r.key }) },
  { by: 'intent', title: <>Intención <InfoTip term="intención" /></>, description: 'Una mención puede tener varias intenciones; los porcentajes se superponen.', emptyTitle: 'Aún no hay intenciones identificadas', example: '“¿Dónde voto?” puede aparecer como pregunta y “apoyo la propuesta” como apoyo.', label: (r) => ({ buy_intent: 'Intención de apoyo', question: 'Pregunta', complaint: 'Queja', praise: 'Reconocimiento', comparison: 'Comparación', churn_intent: 'Intención de cambio', bug_report: 'Reporte de error', pricing: 'Costo', hiring: 'Contratación', event: 'Evento', promotional: 'Promoción' } as Record<string, string>)[r.key] ?? tagName(r.key), filter: (r) => ({ intents: r.key }) },
  { by: 'status', title: <>Estado <InfoTip text="Muestra si el equipo ya atendió o todavía tiene pendiente la mención." /></>, emptyTitle: 'Aún no hay menciones por atender', example: 'Una queja nueva sobre “seguridad” aparecerá como abierta hasta que el equipo la atienda.', label: (r) => ({ open: 'Abierto', done: 'Resuelto', ignored: 'Ignorado', snoozed: 'Pospuesto', new: 'Nuevo' }[r.key] ?? tagName(r.key)), filter: (r) => ({ status: r.key }) },
  { by: 'language', title: <>Idioma <InfoTip text="Idioma que se detectó en la publicación." /></>, emptyTitle: 'Aún no hay idiomas identificados', example: 'Una publicación en español sobre “María López” se contará bajo español.', label: (r) => languageName(r.key), filter: (r) => (r.key === 'unknown' ? null : { languages: r.key }) },
  { by: 'person', title: <>Autores con más menciones <InfoTip term="autor" /></>, description: 'Autores con más publicaciones; se omiten las publicaciones anónimas.', emptyTitle: 'Aún no hay autores identificados', example: 'Si una periodista publica varias veces sobre “movilidad”, sus menciones aparecerán agrupadas.', label: (r) => r.person?.name ?? r.label, filter: () => null },
];

/** Every dimension the breakdown report groups by, each linking into the feed. */
export async function Breakdowns({ query, window }: { query: WindowQuery; window: { from: string; to: string } }) {
  const api = mentio();
  const [hour, ...reports] = await Promise.all([
    api.getAnalyticsBreakdown({ query: { ...query, by: 'hour' } }).then(unwrap),
    ...DIMENSIONS.map((d) => api.getAnalyticsBreakdown({ query: { ...query, by: d.by } }).then(unwrap)),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 @4xl:grid-cols-2">
        {DIMENSIONS.map((d, i) => (
          <Card key={d.by} title={d.title} description={d.description}>
            {reports[i].data.length === 0 ? (
              <EmptyState compact title={d.emptyTitle} example={d.example} action={<LinkButton href="/keywords/new" variant="primary" size="sm">Agregar término</LinkButton>}>
                Cuando haya conversación sobre la campaña, podrás comparar aquí los resultados.
              </EmptyState>
            ) : <BarList
                items={reports[i].data.slice(0, 12).map((row) => {
                  const filter = d.filter(row);
                  const href = d.by === 'person' ? (row.person?.id ? `/people/${row.person.id}` : undefined) : filter ? mentionsHref(window, query, filter) : undefined;
                  return { label: d.label(row), value: row.matched, href };
                })}
                format="plain"
              />}
          </Card>
        ))}
      </div>
      <Card title={<span className="inline-flex items-center gap-1">Horario de publicación <InfoTip term="menciones" /></span>} description={`Menciones por día de la semana y hora, zona horaria ${hour.window.timezone}.`}>
        <HourHeatmap rows={hour.data} />
      </Card>
    </div>
  );
}
