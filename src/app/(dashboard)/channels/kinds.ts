/** Channel vocabulary shared by the channel pages and actions. */
import type { Channel, CreateWebhookChannel } from '@mentio-dev/sdk';
import { isOneOf, list, str } from '@/lib/form';

export type ChannelKind = Channel['kind'];
export type AccountEvent = NonNullable<CreateWebhookChannel['events']>[number];

export const KINDS = ['slack', 'email', 'webhook', 'telegram'] as const satisfies readonly ChannelKind[];

export const KIND_LABELS: Record<ChannelKind, string> = { slack: 'Slack', email: 'Correo electrónico', webhook: 'Webhook', telegram: 'Telegram' };

export const ACCOUNT_EVENTS: ReadonlyArray<readonly [AccountEvent, string]> = [
  ['keyword.capped', 'Un término monitoreado alcanzó su límite mensual de menciones'],
  ['keyword.paused_for_balance', 'Un término se pausó por falta de saldo'],
  ['keyword.resumed', 'Se reanudó el monitoreo de un término pausado o al límite'],
  ['wallet.low', 'El saldo está por agotarse'],
  ['wallet.paused', 'El saldo pausó el monitoreo'],
  ['wallet.resumed', 'El monitoreo se reanudó después de una recarga'],
];
const EVENT_IDS = ACCOUNT_EVENTS.map(([id]) => id);

/** Where a channel delivers, in a few words. */
export function targetText(channel: Channel): string {
  switch (channel.kind) {
    case 'slack':
      return `#${channel.config.channelName}`;
    case 'email':
      return channel.config.recipients.map((r) => r.email).join(', ');
    case 'webhook':
      return channel.config.url;
    case 'telegram': {
      const chatType = { private: 'privado', group: 'grupo', supergroup: 'supergrupo', channel: 'canal' }[channel.config.chatType];
      return `Chat ${chatType} ${channel.config.chatId}`;
    }
  }
}

export function eventLabel(event: string): string {
  if (event === 'mention.matched') return 'Mención coincidente';
  if (event === 'digest') return 'Resumen periódico';
  return ACCOUNT_EVENTS.find(([id]) => id === event)?.[1] ?? event;
}

export function readEvents(form: FormData): AccountEvent[] {
  return list(form, 'events').filter((e): e is AccountEvent => isOneOf(EVENT_IDS, e));
}

/** "Name: value" per line into a headers object. */
export function readHeaders(form: FormData): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of str(form, 'headers').split('\n')) {
    if (!line.trim()) continue;
    const at = line.indexOf(':');
    if (at < 1) throw new Error(`Escribe cada encabezado con el formato "Nombre: valor" ("${line.trim()}" no tiene dos puntos).`);
    headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return headers;
}

export const headersText = (headers: Record<string, string>) =>
  Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n');
