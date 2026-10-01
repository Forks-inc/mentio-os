import Page from '@/app/(dashboard)/channels/[id]/page';

export const dynamic = 'force-dynamic';

/** /channels/[id] opened from a list: the same page, in the drawer (layout.tsx). */
export default function Drawer(props: Parameters<typeof Page>[0]) {
  return <Page {...props} />;
}
