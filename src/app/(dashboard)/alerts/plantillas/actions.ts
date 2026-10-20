'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CreateAlertData } from '@mentio-dev/sdk';
import { run, type ActionState } from '@/lib/action';
import { isOneOf, str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';

const TEMPLATE_IDS = ['crisis', 'daily', 'competitors'] as const;
type TemplateId = (typeof TEMPLATE_IDS)[number];

const templateNames: Record<TemplateId, string> = {
  crisis: 'Avísame si hay crisis',
  daily: 'Resumen diario a las 8am',
  competitors: 'Menciones de adversarios',
};

export async function createTemplateAlertAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const template = str(form, 'template');
    if (!isOneOf(TEMPLATE_IDS, template)) throw new Error('Elige una plantilla válida.');
    const channelId = str(form, 'channelId');
    if (!channelId) throw new Error('Elige un canal para recibir esta alerta.');

    const channels = unwrap(await mentio().listChannels());
    if (!channels.data.some((channel) => channel.id === channelId)) throw new Error('Ese canal ya no está disponible. Actualiza la página y vuelve a elegirlo.');

    let filter: CreateAlertData['body']['filter'];
    let mode: CreateAlertData['body']['mode'] = 'instant';
    let schedule: CreateAlertData['body']['schedule'];

    if (template === 'crisis') {
      filter = { sentiments: ['negative'] };
    } else if (template === 'daily') {
      mode = 'daily';
      schedule = { hour: 8, minute: 0, timezone: 'America/Chihuahua', skipEmpty: true };
    } else {
      const keywords = unwrap(await mentio().listKeywords({ query: { kind: ['competitor'] } }));
      const keywordIds = keywords.data.map((keyword) => keyword.id);
      if (keywordIds.length === 0) throw new Error('Aún no registras adversarios. Agrégalos en el asistente de arranque para crear esta alerta.');
      filter = { keywordIds };
    }

    const alert = unwrap(await mentio().createAlert({
      body: {
        name: templateNames[template],
        enabled: true,
        mode,
        ...(filter ? { filter } : {}),
        ...(schedule ? { schedule } : {}),
        channelIds: [channelId],
      },
    }));
    revalidatePath('/alerts');
    redirect(`/alerts/${alert.id}`);
  });
}
