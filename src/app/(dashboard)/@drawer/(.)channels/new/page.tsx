import Page from '@/app/(dashboard)/channels/new/page';

export const dynamic = 'force-dynamic';

/** /channels/new opened from a list: the same page, in the drawer (layout.tsx). */
export default function Drawer(props: Parameters<typeof Page>[0]) {
  return <Page {...props} />;
}
