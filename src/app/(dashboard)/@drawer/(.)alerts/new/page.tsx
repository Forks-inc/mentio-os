import Page from '@/app/(dashboard)/alerts/new/page';

export const dynamic = 'force-dynamic';

/** /alerts/new opened from a list: the same page, in the drawer (layout.tsx). */
export default function Drawer() {
  return <Page />;
}
