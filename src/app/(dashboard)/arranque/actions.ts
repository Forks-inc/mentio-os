'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CreateKeywordData } from '@mentio-dev/sdk';
import { run, type ActionState } from '@/lib/action';
import { lines, list, str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';

type KeywordInput = CreateKeywordData['body'];
type KeywordKind = NonNullable<KeywordInput['kind']>;
type CampaignKeyword = { term: string; kind: KeywordKind; context?: string };

function uniqueTerms(terms: CampaignKeyword[]) {
  const seen = new Map<string, string>();
  for (const item of terms) {
    const normalized = item.term.normalize('NFKC').toLocaleLowerCase('es-MX');
    const existing = seen.get(normalized);
    if (existing) throw new Error(`“${item.term}” y “${existing}” son la misma palabra. Quita una de las dos variantes.`);
    seen.set(normalized, item.term);
  }
  return terms;
}

export async function startCampaignAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const candidate = str(form, 'candidateName');
    if (!candidate) throw new Error('Escribe el nombre del candidato para continuar.');

    const terms: CampaignKeyword[] = [
      { term: candidate, kind: 'brand' },
      ...lines(form, 'brandVariants').map((term) => ({ term, kind: 'brand' as const, context: `Variante de: ${candidate}` })),
    ];

    const competitorIds = list(form, 'competitorIds');
    const competitors = competitorIds.flatMap((id) => {
      const name = str(form, `competitorName_${id}`);
      if (!name) return [];
      return [
        { term: name, kind: 'competitor' as const },
        ...lines(form, `competitorVariants_${id}`).map((term) => ({ term, kind: 'competitor' as const, context: `Variante de: ${name}` })),
      ];
    });
    if (competitors.length === 0) throw new Error('Agrega al menos un adversario con nombre.');
    terms.push(...competitors);

    const topicTerms = [...lines(form, 'suggestedTopics'), ...lines(form, 'freeTopics')].map((term) => ({ term, kind: 'topic' as const }));
    terms.push(...topicTerms);
    const checkedTerms = uniqueTerms(terms);

    const campaignName = str(form, 'campaignName') || `Campaña de ${candidate}`;
    const group = unwrap(await mentio().createGroup({ body: { name: campaignName } }));
    let created = 0;
    let failed: string | null = null;

    for (const keyword of checkedTerms) {
      try {
        unwrap(await mentio().createKeyword({ body: { ...keyword, groupId: group.id } }));
        created += 1;
      } catch {
        failed = keyword.term;
        break;
      }
    }

    if (failed) {
      throw new Error(`La campaña se creó, pero solo se registraron ${created} de ${checkedTerms.length} términos. No se pudo agregar “${failed}”; revisa la campaña antes de volver a intentarlo.`);
    }

    revalidatePath('/');
    revalidatePath('/contienda');
    revalidatePath('/alerts');
    redirect('/arranque?completado=1');
  });
}
