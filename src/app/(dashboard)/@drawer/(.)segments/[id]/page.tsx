import Page from '@/app/(dashboard)/segments/[id]/page';

export const dynamic = 'force-dynamic';

/** /segments/[id] opened from a list: the same page, in the drawer (layout.tsx). */
export default function Drawer(props: Parameters<typeof Page>[0]) {
  return <Page {...props} />;
}
