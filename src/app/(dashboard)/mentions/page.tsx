import Link from 'next/link';
import { MentionTable } from '@/components/mention-table';
import { Download, Radio } from 'lucide-react';
import { EmptyState, Field, Input, LinkButton, PageHeader, buttonClass } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { mentio, unwrap } from '@/lib/mentio';
import type { SearchParams } from '@/lib/params';
import { one } from '@/lib/params';
import { saveFeedAsView } from './actions';
import { describeFilter, fromViewFilter, getterFromParams, parseFilters, toParams, toSearchQuery } from './filters';
import { MentionFilters } from './mention-filters';
import { loadFilterOptions } from './options';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Menciones' };

const PAGE_SIZE = 25;

/**
 * The feed. Filters live in the URL, so every state of this page is a link.
 * A view (viewId) is the base; the filters on the page narrow it.
 */
export default async function MentionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const values = parseFilters(getterFromParams(params));
  const requestedViewId = one(params, 'viewId');
  const cursor = one(params, 'cursor');

  const api = mentio();
  const [options, views] = await Promise.all([loadFilterOptions(), api.listViews().then(unwrap)]);
  // A link to a view deleted since falls back to the plain feed instead of an error.
  const view = requestedViewId ? views.data.find((v) => v.id === requestedViewId) : undefined;
  const viewId = view?.id;
  const page = unwrap(await api.searchMentions({ query: toSearchQuery(values, { viewId, cursor, limit: PAGE_SIZE }) }));

  const filterParams = toParams(values);
  const baseQuery = new URLSearchParams([...filterParams, ...(viewId ? [['viewId', viewId] as [string, string]] : [])]);
  const olderHref = page.nextCursor ? `/mentions?${new URLSearchParams([...baseQuery, ['cursor', page.nextCursor]])}` : null;
  const firstHref = `/mentions${baseQuery.size ? `?${baseQuery}` : ''}`;
  const exportHref = `/mentions/export${baseQuery.size ? `?${baseQuery}` : ''}`;
  const viewConditions = view ? describeFilter(fromViewFilter(view.filter), options.names) : [];

  return (
    <div>
      <PageHeader
        title={view ? view.name : 'Menciones'}
        description={view ? view.description || 'Vista guardada. Los filtros siguientes acotan los resultados.' : 'Conversación pública que coincide con los términos monitoreados, de la más reciente a la más antigua.'}
        actions={
          <>
            {view ? <LinkButton href={`/views/${encodeURIComponent(view.id)}`}>Editar vista</LinkButton> : null}
            <a href={exportHref} className={buttonClass('secondary')} download>
              <Download /> Exportar CSV
            </a>
          </>
        }
      />

      <MentionFilters
        keywords={options.keywords.map(([value, label]) => ({ value, label }))}
        groups={options.groups.map(([value, label]) => ({ value, label }))}
        views={views.data.map((v) => ({ id: v.id, name: v.name }))}
        viewId={viewId}
        saveView={
          <ActionForm action={saveFeedAsView} className="grid gap-4">
            {filterParams.map(([key, value], i) => (
              <input key={`${key}-${i}`} type="hidden" name={key} value={value} />
            ))}
            {viewId ? <input type="hidden" name="viewId" value={viewId} /> : null}
            <Field label="Nombre">
              <Input name="name" required maxLength={80} placeholder="Ej. críticas a la propuesta de seguridad" />
            </Field>
            <Field label="Descripción">
              <Input name="description" maxLength={500} placeholder="Qué conversación de campaña quieres seguir" />
            </Field>
            <div data-slot="form-actions" className="flex justify-end">
              <SubmitButton>Guardar vista</SubmitButton>
            </div>
          </ActionForm>
        }
      />

      {requestedViewId && !view ? <p className="text-sm text-amber-700">Esta vista ya no existe; se muestran todas las menciones.</p> : null}

      {view ? (
        <p className="-mt-2 mb-4 text-xs text-muted-foreground">
          Vista <span className="font-medium text-foreground">{view.name}</span>: {viewConditions.length ? viewConditions.join(' · ') : 'todas las menciones'}
        </p>
      ) : null}

      {page.data.length === 0 ? (
        <EmptyState icon={Radio} title={cursor ? 'No hay menciones anteriores.' : 'Ninguna mención coincide con estos filtros.'}>
          {cursor ? <Link href={firstHref} className="text-primary hover:underline">Volver a las más recientes</Link> : 'Prueba con menos filtros o amplía el periodo.'}
        </EmptyState>
      ) : (
        <MentionTable mentions={page.data} />
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {cursor ? <LinkButton href={firstHref} size="sm">‹ Más recientes</LinkButton> : <span />}
        {olderHref ? <LinkButton href={olderHref}>Menciones anteriores ›</LinkButton> : null}
      </div>

    </div>
  );
}
