/**
 * The view editor's conditions: the feed's filter chips, kept in the form,
 * plus the text search and the hidden authors, which read better as fields.
 * They submit under GET /v1/mentions's parameter names (getterFromForm).
 */
import { Field, Input, Textarea } from '@/components/ui';
import { FormFilters } from '@/components/url-filters';
import { mentionFilterDefs } from './filter-defs';
import { toParams, type FilterValues } from './filters';
import type { FilterOptions } from './options';

/** Every condition a view can hold. */
export function ViewFilterFields({ values, options }: { values: FilterValues; options: FilterOptions }) {
  const defaults: Record<string, string> = {};
  for (const [key, value] of toParams(values)) {
    if (key === 'q' || key === 'excludeAuthors') continue;
    defaults[key] = defaults[key] ? `${defaults[key]},${value}` : value;
  }
  const opts = (list: FilterOptions['keywords']) => list.map(([value, label]) => ({ value, label }));
  return (
    <div className="space-y-5">
      <Field label="El texto contiene" hint="Busca en la publicación o en el nombre del autor.">
        <Input name="q" defaultValue={values.q ?? ''} maxLength={200} />
      </Field>
      <Field group label="Condiciones" hint="Deben cumplirse todas las condiciones.">
        <FormFilters filters={mentionFilterDefs(opts(options.keywords), opts(options.groups))} defaults={defaults} empty="Sin condiciones: todas las menciones." />
      </Field>
      <Field label="Ocultar estos autores" hint="Uno por línea: nombres, usuarios o enlaces a perfiles.">
        <Textarea name="excludeAuthors" rows={3} defaultValue={values.excludeAuthors.join('\n')} />
      </Field>
    </div>
  );
}
