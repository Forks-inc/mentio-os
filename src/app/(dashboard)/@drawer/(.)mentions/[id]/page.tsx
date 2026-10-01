import Page from '@/app/(dashboard)/mentions/[id]/page';

export const dynamic = 'force-dynamic';

/** /mentions/[id] opened from a list: the same page, in the drawer (layout.tsx). */
export default function Drawer(props: Parameters<typeof Page>[0]) {
  return <Page {...props} />;
}
