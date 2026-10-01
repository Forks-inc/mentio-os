import Page from '@/app/(dashboard)/settings/groups/[id]/page';

export const dynamic = 'force-dynamic';

/** /settings/groups/[id] opened from a list: the same page, in the drawer (layout.tsx). */
export default function Drawer(props: Parameters<typeof Page>[0]) {
  return <Page {...props} />;
}
