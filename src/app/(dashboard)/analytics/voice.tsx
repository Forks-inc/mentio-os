import Link from 'next/link';
import { ChartColumn } from 'lucide-react';
import { Badge, Card, EmptyState, Table, td, TableCell, TableRow } from '@/components/ui';
import { compact } from '@/lib/format';
import { mentio, unwrap } from '@/lib/mentio';
import { Delta, PALETTE, ShareBar } from './charts';
import { keywordName, mentionsHref, type WindowQuery } from './window';

/** Your candidate keywords against the opposition's keywords. */
export async function ShareOfVoice({ query }: { query: WindowQuery }) {
  const report = unwrap(await mentio().getShareOfVoice({ query: { ...query, compare: true } }));
  const link = (keywordId: string) => mentionsHref(report.window, query, { keywordIds: keywordId });
  const ranked = report.data.filter((r) => r.share !== null);
  const topics = report.data.filter((r) => r.share === null);

  if (report.data.length === 0) {
    return <EmptyState icon={ChartColumn} title="No hay menciones en este periodo.">La participación de voz compara las menciones a tus candidatos con las de sus adversarios.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <Card
        title="Participación de voz"
        description="Compara la proporción de menciones a candidatos y adversarios. Los temas de agenda se muestran aparte. Clasifica cada término monitoreado como candidato o adversario en Candidatos y temas."
      >
        {ranked.length ? (
          <ShareBar items={ranked.map((r, i) => ({ label: keywordName(r.keyword), value: r.share ?? 0, color: PALETTE[i % PALETTE.length], href: link(r.keyword.id) }))} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No se encontraron menciones a candidatos ni adversarios. <Link href="/keywords" className="text-primary hover:underline">Clasifica los términos monitoreados</Link> para compararlos.
          </p>
        )}
      </Card>

      <Table head={['Término monitoreado', 'Tipo', 'Participación', 'Menciones', 'Cambio', 'Relevantes', 'Negativas', 'Intención de apoyo']}>
        {[...ranked, ...topics].map((r) => (
          <TableRow key={r.keyword.id}>
            <TableCell className={td}>
              <Link href={link(r.keyword.id)} className="font-medium hover:underline">{keywordName(r.keyword)}</Link>
            </TableCell>
            <TableCell className={td}>
              <Badge tone={r.keyword.kind === 'brand' ? 'accent' : r.keyword.kind === 'competitor' ? 'warn' : 'neutral'}>{{ brand: 'Candidato', competitor: 'Adversario', topic: 'Tema' }[r.keyword.kind]}</Badge>
            </TableCell>
            <TableCell className={`${td} tabular-nums`}>{r.share === null ? <span className="text-muted-foreground">s/d</span> : `${r.share.toFixed(1)}%`}</TableCell>
            <TableCell className={`${td} tabular-nums`}>{compact(r.matched)}</TableCell>
            <TableCell className={`${td} text-xs whitespace-nowrap`}><Delta current={r.matched} previous={r.previous?.matched} short /></TableCell>
            <TableCell className={`${td} tabular-nums`}>{compact(r.relevant)}</TableCell>
            <TableCell className={`${td} tabular-nums`}>{compact(r.negative)}</TableCell>
            <TableCell className={`${td} tabular-nums`}>{compact(r.buyIntent)}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
