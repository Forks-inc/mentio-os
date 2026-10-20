import type { PersonActivity } from '@mentio-dev/sdk';

export const ACTIVITY_CHANNELS: readonly PersonActivity['channel'][] = ['email', 'x', 'linkedin', 'bluesky', 'reddit', 'github', 'call', 'meeting', 'other'];

export const CHANNEL_NAMES: Record<PersonActivity['channel'], string> = {
  email: 'Correo electrónico',
  x: 'X',
  linkedin: 'LinkedIn',
  bluesky: 'Bluesky',
  reddit: 'Reddit',
  github: 'GitHub',
  call: 'Llamada',
  meeting: 'Reunión',
  other: 'Otro',
};
