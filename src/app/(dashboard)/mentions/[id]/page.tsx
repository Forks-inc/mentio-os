import type { Mention } from '@mentio-dev/sdk';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, keywordLabel } from '@/components/mention-card';
import { ExternalLink } from 'lucide-react';
import { PlatformIcon } from '@/components/platform-icon';
import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge, Card, DateTimePicker, Field, Input, LinkButton, PageHeader, Select, Textarea, buttonClass, sentimentTone } from '@/components/ui';
import { ActionForm, CopyButton, SubmitButton } from '@/components/ui/client';
import { compact, platformName, tagName, timeAgo } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { muteAuthorInAlert, saveTriage, setMentionStatus, setVerdict, snoozeMention } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mención' };

/** A date, or nothing when the value is missing or not a date. */
function when(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(d) + ' UTC';
}

const ENGAGEMENT = [
  ['likes', 'Me gusta'],
  ['reposts', 'Republicaciones'],
  ['replies', 'Respuestas'],
  ['quotes', 'Citas'],
  ['views', 'Vistas'],
  ['bookmarks', 'Guardados'],
] as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-foreground">{children}</dd>
    </div>
  );
}

/** The entry an alert's mute list takes: the profile link when there is one, else the handle or name. */
const muteEntry = (author: Mention['author']) => author?.url || author?.handle || author?.name || '';

export default async function MentionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = mentio();
  const [result, members, alerts] = await Promise.all([
    api.getMention({ path: { id } }),
    // The two pickers are secondary: a failure empties them instead of failing the page.
    api.listMembers().then(unwrap).then((r) => r.data).catch(() => null),
    api.listAlerts().then(unwrap).then((r) => r.data).catch(() => null),
  ]);
  if (result.response?.status === 404) notFound();
  const mention = unwrap(result);
  const { post, author, review, classification: verdict, triage } = mention;
  const snoozedUntil = triage.snoozedUntil ? new Date(triage.snoozedUntil) : null;
  const snoozed = snoozedUntil !== null && !Number.isNaN(snoozedUntil.getTime()) && snoozedUntil.getTime() > Date.now();
  const engagement = post.engagement ? ENGAGEMENT.filter(([key]) => post.engagement?.[key] !== null && post.engagement?.[key] !== undefined) : [];
  const entry = muteEntry(author);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: '/mentions', label: 'Menciones' }}
        title={
          <span className="flex items-center gap-3">
            <UiAvatar className="size-9">
              {author?.avatarUrl ? <AvatarImage src={author.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-sm font-semibold">{(author?.name ?? author?.handle ?? '?').replace(/^@/, '').slice(0, 1).toUpperCase()}</AvatarFallback>
            </UiAvatar>
            <span className="min-w-0 truncate">{author?.name ?? author?.handle ?? 'Mención'}</span>
          </span>
        }
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <PlatformIcon platform={post.platform} />
            {platformName(post.platform)} · {when(post.publishedAt) ?? 'Hora desconocida'} ({timeAgo(post.publishedAt)})
          </span>
        }
        actions={
          <>
            <a href={post.url} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary')}>
              <ExternalLink /> Abrir en {platformName(post.platform)}
            </a>
            <CopyButton text={post.url} label="Copiar enlace" />
          </>
        }
      />

      <div className="grid gap-6 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {post.replyTo ? (
            <div className="rounded-lg border border-line bg-muted/50 p-4 text-sm">
              <p className="text-xs text-muted-foreground">
                En respuesta a {post.replyTo.author ?? 'una publicación'}
                {post.replyTo.url ? (
                  <>
                    {' · '}
                  <a href={post.replyTo.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">abrir ↗</a>
                  </>
                ) : null}
              </p>
              {post.replyTo.text ? <p className="mt-1 line-clamp-6 whitespace-pre-line text-muted-foreground">{post.replyTo.text}</p> : null}
            </div>
          ) : null}

          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            {review ? (
              <div className="mb-3 space-y-1">
                <p className="text-lg text-amber-500" aria-label={`${review.rating} de ${review.ratingMax} estrellas`}>
                  {'★'.repeat(Math.max(0, Math.min(review.rating, review.ratingMax)))}
                  <span className="text-zinc-300">{'★'.repeat(Math.max(0, review.ratingMax - review.rating))}</span>
                  <span className="ml-2 align-middle text-xs text-muted-foreground">{review.rating} de {review.ratingMax}</span>
                </p>
                {review.title ? <p className="font-semibold">{review.title}</p> : null}
              </div>
            ) : null}
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-foreground">{post.text || '(sin texto)'}</p>

            {engagement.length ? (
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-3 text-sm">
                {engagement.map(([key, label]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular-nums">{compact(post.engagement?.[key])}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {post.links.length ? (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs text-muted-foreground">Enlaces de esta publicación</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {post.links.map((link, linkIndex) => (
                    <li key={`${link}-${linkIndex}`} className="truncate">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {review ? (
            <Card title="Reseña">
              <dl className="divide-y divide-line">
                <Row label="Tienda">
                  <a href={review.app.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {platformName(review.app.platform)}: {review.app.id} ↗
                  </a>
                </Row>
                {review.country ? <Row label="País">{review.country.toUpperCase()}</Row> : null}
                {review.version ? <Row label="Versión">{review.version}</Row> : null}
                {review.verified !== null ? <Row label="Verificada">{review.verified ? 'Sí' : 'No'}</Row> : null}
              </dl>
              {review.response ? (
                <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Respuesta del equipo{when(review.responseAt) ? `, ${when(review.responseAt)}` : ''}</p>
                  <p className="mt-1 whitespace-pre-line text-foreground/80">{review.response}</p>
                </div>
              ) : null}
            </Card>
          ) : null}

          <Card title="Clasificación" description={verdict?.feedback ? 'El equipo corrigió esta clasificación.' : 'Resultado del análisis de esta mención.'}>
            {!verdict ? (
              <p className="text-sm text-muted-foreground">Aún no se ha clasificado.</p>
            ) : verdict.failed ? (
              <p className="text-sm text-muted-foreground">No se pudo clasificar esta mención. No genera cargos.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge tone={mention.relevant ? 'solid' : 'neutral'} className="font-mono">Relevancia {verdict.relevance ?? 'sin dato'}</Badge>
                  <Badge tone={sentimentTone(verdict.sentiment)}>{{ positive: 'Positivo', neutral: 'Neutral', negative: 'Negativo' }[verdict.sentiment]}</Badge>
                  {verdict.intents.map((intent, intentIndex) => <Badge key={`${intent}-${intentIndex}`} tone="accent">{({ buy_intent: 'Intención de apoyo', question: 'Pregunta', complaint: 'Queja', praise: 'Reconocimiento', comparison: 'Comparación', churn_intent: 'Intención de cambio', bug_report: 'Reporte de error', pricing: 'Costo', hiring: 'Contratación', event: 'Evento', promotional: 'Promoción' } as Record<string, string>)[intent] ?? tagName(intent)}</Badge>)}
                  {verdict.uncertain ? <Badge tone="warn">Incierta</Badge> : null}
                  {verdict.automated ? <Badge tone="outline">Automatizada</Badge> : null}
                </div>
                {verdict.note ? <p className="text-sm text-foreground/80">{verdict.note}</p> : null}
                <dl className="divide-y divide-line">
                  <Row label="Relevante">{mention.relevant ? 'Sí' : 'No'}</Row>
                  {verdict.confidence !== null ? <Row label="Confianza">{Math.round(verdict.confidence * 100)}%</Row> : null}
                  {verdict.language ? <Row label="Idioma">{verdict.language}</Row> : null}
                  <Row label="Prioridad">{mention.priority}</Row>
                  {verdict.feedback ? (
                    <Row label="Antes de la corrección">
                      relevancia {verdict.feedback.original.relevance ?? 'sin dato'}, {{ positive: 'positivo', neutral: 'neutral', negative: 'negativo' }[verdict.feedback.original.sentiment]}
                    </Row>
                  ) : null}
                </dl>

                <div className="space-y-3 border-t border-line pt-3">
                  <p className="text-xs text-muted-foreground">Corrige la relevancia o el sentimiento de esta mención.</p>
                  <ActionForm action={setVerdict} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={mention.id} />
                    <SubmitButton variant="secondary" size="sm" name="relevant" value="true">Relevante</SubmitButton>
                    <SubmitButton variant="secondary" size="sm" name="relevant" value="false">No relevante</SubmitButton>
                    {verdict.feedback?.relevant !== null && verdict.feedback?.relevant !== undefined ? (
                      <SubmitButton variant="ghost" size="sm" name="relevant" value="reset">Deshacer cambio</SubmitButton>
                    ) : null}
                  </ActionForm>
                  <ActionForm action={setVerdict} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={mention.id} />
                    <span className="text-sm text-muted-foreground">Sentimiento:</span>
                    {(['positive', 'neutral', 'negative'] as const).map((s, sIndex) => (
                      <SubmitButton key={`${s}-${sIndex}`} variant={verdict.sentiment === s ? 'primary' : 'secondary'} size="sm" name="sentiment" value={s}>{({ positive: 'Positivo', neutral: 'Neutral', negative: 'Negativo' }[s])}</SubmitButton>
                    ))}
                    {verdict.feedback?.sentiment ? <SubmitButton variant="ghost" size="sm" name="sentiment" value="reset">Deshacer cambio</SubmitButton> : null}
                  </ActionForm>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Autor">
            {author ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={author.name} url={author.avatarUrl} size="size-10" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{author.name ?? 'Desconocido'}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[author.handle, author.followers !== null ? `${compact(author.followers)} seguidores` : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {author.tags.length ? (
                  <div className="flex flex-wrap gap-1">{author.tags.map((t, tIndex) => <Badge key={`${t}-${tIndex}`} tone="outline">{t}</Badge>)}</div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {author.id ? <LinkButton href={`/people/${encodeURIComponent(author.id)}`} size="sm">Ver audiencia</LinkButton> : null}
                  {author.url ? (
                    <a href={author.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted">Ver perfil ↗</a>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">El canal no identifica al autor.</p>
            )}
          </Card>

          <Card title="Término monitoreado">
            <dl className="divide-y divide-line">
              <Row label="Término monitoreado">
                <Link href={`/mentions?keywordIds=${encodeURIComponent(mention.keyword.id)}`} className="text-primary hover:underline">{keywordLabel(mention.keyword)}</Link>
              </Row>
              <Row label="Campaña">{mention.keyword.group.name}</Row>
              <Row label="Detectada">{when(mention.createdAt) ?? ''}</Row>
              <Row label="Alerta enviada">{mention.delivered ? 'Sí' : 'No'}</Row>
            </dl>
          </Card>

          <Card title="Seguimiento">
            <div className="space-y-5">
              <ActionForm action={setMentionStatus} className="space-y-2">
                <input type="hidden" name="id" value={mention.id} />
                <p className="text-sm">
                  Estado: <Badge tone={mention.status === 'open' ? 'accent' : 'neutral'}>{{ open: 'Abierto', done: 'Resuelto', ignored: 'Ignorado', snoozed: 'Pospuesto', new: 'Nuevo' }[mention.status] ?? mention.status}</Badge>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {mention.status !== 'done' ? <SubmitButton variant="secondary" size="sm" name="status" value="done">Marcar como resuelta</SubmitButton> : null}
                  {mention.status !== 'ignored' ? <SubmitButton variant="secondary" size="sm" name="status" value="ignored">Ignorar</SubmitButton> : null}
                  {mention.status !== 'open' ? <SubmitButton variant="secondary" size="sm" name="status" value="open">Reabrir</SubmitButton> : null}
                </div>
              </ActionForm>

              <ActionForm action={saveTriage} className="space-y-3 border-t border-line pt-4">
                <input type="hidden" name="id" value={mention.id} />
                <Field label="Responsable">
                  {members ? (
                    <Select
                      name="assigneeId"
                      defaultValue={triage.assignee?.id ?? ''}
                      placeholder="Sin responsable"
                      options={[
                        ...members.map((m) => [m.userId, m.name ?? m.email] as const),
                        // Someone assigned who has since left still shows.
                        ...(triage.assignee && !members.some((m) => m.userId === triage.assignee?.id)
                          ? [[triage.assignee.id, triage.assignee.name ?? triage.assignee.email ?? triage.assignee.id] as const]
                          : []),
                      ]}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">No se pudo cargar el equipo.</p>
                  )}
                </Field>
                <Field label="Nota interna" hint="Solo la ve tu equipo.">
                  <Textarea name="note" rows={3} maxLength={2000} defaultValue={triage.note ?? ''} />
                </Field>
                <SubmitButton size="sm">Guardar</SubmitButton>
              </ActionForm>

              <ActionForm action={snoozeMention} className="space-y-2 border-t border-line pt-4">
                <input type="hidden" name="id" value={mention.id} />
                <p className="text-sm font-medium text-foreground">Posponer</p>
                <p className="text-xs text-muted-foreground">
                  {snoozed ? `Fuera de la lista hasta ${when(triage.snoozedUntil)}.` : 'Oculta esta mención de la lista por un tiempo.'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <SubmitButton variant="secondary" size="sm" name="snooze" value="hour">1 hora</SubmitButton>
                  <SubmitButton variant="secondary" size="sm" name="snooze" value="day">1 día</SubmitButton>
                  <SubmitButton variant="secondary" size="sm" name="snooze" value="week">1 semana</SubmitButton>
                  {snoozed ? <SubmitButton variant="ghost" size="sm" name="snooze" value="clear">Mostrar ahora</SubmitButton> : null}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Hasta (UTC)" className="min-w-0 flex-1">
                    <DateTimePicker name="until" />
                  </Field>
                  <SubmitButton variant="secondary" size="sm" name="snooze" value="custom">Posponer</SubmitButton>
                </div>
              </ActionForm>
            </div>
          </Card>

          {entry ? (
            <Card title="Silenciar autor" description="Evita que una alerta envíe sus publicaciones. Seguirán apareciendo en la lista.">
              {alerts === null ? (
                <p className="text-sm text-muted-foreground">No se pudieron cargar las alertas.</p>
              ) : alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay alertas. <Link href="/alerts" className="text-primary hover:underline">Crear una</Link>.
                </p>
              ) : (
                <ActionForm action={muteAuthorInAlert} className="space-y-2">
                  <input type="hidden" name="author" value={entry} />
                  <p className="truncate text-xs text-muted-foreground" title={entry}>Silenciar: {entry}</p>
                  <Select name="alertId" required defaultValue="" placeholder="Elige una alerta" options={alerts.map((a) => [a.id, a.name] as const)} />
                  <SubmitButton variant="secondary" size="sm">Silenciar en la alerta</SubmitButton>
                </ActionForm>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
