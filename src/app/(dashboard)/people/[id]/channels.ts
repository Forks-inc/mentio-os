import type { PersonActivity } from '@mentio-dev/sdk';

export const ACTIVITY_CHANNELS: readonly PersonActivity['channel'][] = ['email', 'x', 'linkedin', 'bluesky', 'reddit', 'github', 'call', 'meeting', 'other'];

export const CHANNEL_NAMES: Record<PersonActivity['channel'], string> = {
  email: 'Email',
  x: 'X',
  linkedin: 'LinkedIn',
  bluesky: 'Bluesky',
  reddit: 'Reddit',
  github: 'GitHub',
  call: 'Call',
  meeting: 'Meeting',
  other: 'Other',
};
