'use client';

/** Breadcrumb above every settings page. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { SETTINGS } from '@/lib/nav';

export function SettingsBreadcrumb() {
  const path = usePathname();
  const page = SETTINGS.find((item) => path === item.href || path.startsWith(`${item.href}/`));
  const deeper = page && path !== page.href;
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={SETTINGS[0].href} />}>Ajustes</BreadcrumbLink>
        </BreadcrumbItem>
        {page ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{deeper ? <BreadcrumbLink render={<Link href={page.href} />}>{page.label}</BreadcrumbLink> : <BreadcrumbPage>{page.label}</BreadcrumbPage>}</BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
