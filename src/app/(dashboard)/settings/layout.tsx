import type { ReactNode } from 'react';
import { SettingsBreadcrumb } from '@/components/settings-breadcrumb';
import { Tabs } from '@/components/ui/client';
import { SETTINGS } from '@/lib/nav';

/** Every settings page: the breadcrumb, a tab per settings page, then the page. */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <SettingsBreadcrumb />
      <Tabs items={SETTINGS.map((item) => ({ href: item.href, label: item.label }))} />
      {children}
    </div>
  );
}
