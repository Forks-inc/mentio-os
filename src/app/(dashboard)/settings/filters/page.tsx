import { Card, Field, PageHeader, Textarea } from '@/components/ui';
import { ActionForm, SubmitButton } from '@/components/ui/client';
import { date } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { updateFiltersAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Filtros de ruido' };

/** Organization-wide noise rules in addition to each candidate or topic's rules. */
export default async function Filters() {
  const filters = unwrap(await mentio().getFilters());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Filtros de ruido"
        description="Reglas para todos los candidatos y temas del espacio de trabajo, además de sus reglas individuales. Las publicaciones descartadas no se guardan ni generan cargos."
      />

      <ActionForm action={updateFiltersAction} className="space-y-6">
        <Card title="Todas las plataformas" description="Escribe un elemento por línea o sepáralos con comas.">
          <div className="grid gap-4 @lg:grid-cols-2">
            <Field label="Términos excluidos" hint="Se descarta cualquier publicación que incluya uno de estos términos, sin importar qué término monitoreado coincidió. Usa * al inicio o al final como comodín. Hasta 200.">
              <Textarea name="excludedTerms" rows={6} defaultValue={filters.excludedTerms.join('\n')} placeholder={'empleo\nvacante\ntrabajo'} />
            </Field>
            <Field label="Autores excluidos" hint="Cuentas propias, integrantes del equipo o cuentas falsas conocidas: enlaces a perfiles o publicaciones, @usuarios, nombres de cuenta, DID de Bluesky o nombres visibles. Hasta 200.">
              <Textarea name="excludedAuthors" rows={6} defaultValue={filters.excludedAuthors.join('\n')} placeholder={'@cuenta_campana\n@cuenta_falsa'} />
            </Field>
          </div>
        </Card>

        <Card title="GitHub">
          <Field label="Repositorios excluidos" hint="Se descartan las incidencias, solicitudes de cambios y comentarios de estos repositorios. Usa propietario/nombre o un enlace de github.com.">
            <Textarea name="excludedRepos" rows={4} defaultValue={filters.excludedRepos.join('\n')} placeholder="campana/sitio-web" />
          </Field>
        </Card>

        <Card title="Reddit">
          <div className="grid gap-4 @lg:grid-cols-2">
            <Field label="Solo estos foros de Reddit" hint="Si agregas alguno, solo se aceptan publicaciones de estos y se ignora la lista de exclusión. Usa r/nombre o nombre.">
              <Textarea name="subredditsOnly" rows={4} defaultValue={filters.subreddits.only.join('\n')} placeholder="r/mexico" />
            </Field>
            <Field label="Foros de Reddit excluidos" hint="Se descartan las publicaciones de estos foros. Usa r/nombre o nombre.">
              <Textarea name="subredditsExcluded" rows={4} defaultValue={filters.subreddits.excluded.join('\n')} placeholder="r/politica" />
            </Field>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <SubmitButton>Guardar filtros</SubmitButton>
          {filters.updatedAt ? <span className="text-xs text-muted-foreground">Último cambio: {date(filters.updatedAt)}</span> : null}
        </div>
      </ActionForm>
    </div>
  );
}
