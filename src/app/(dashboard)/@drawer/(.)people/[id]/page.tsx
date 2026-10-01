import Page from '@/app/(dashboard)/people/[id]/page';

export const dynamic = 'force-dynamic';

/** /people/[id] opened from a list: the same page, in the drawer (layout.tsx). */
export default function Drawer(props: Parameters<typeof Page>[0]) {
  return <Page {...props} />;
}
