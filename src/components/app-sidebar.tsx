'use client';

/**
 * The navigation, drawn like the Mentio dashboard's on shadcn's Sidebar: the
 * brand at the top, one flat list (an item with children opens a sub-list
 * under a line), the balance and the docs in a tinted block at the foot and
 * the workspace under them. On a phone it becomes a drawer.
 */
import { ArrowUpRight, ChevronDown, ChevronsUpDown, CreditCard, KeyRound, LogOut, Search, Settings, SunMoon, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { brand } from '@/brand.config';
import { openCommandMenu } from '@/components/command-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { signOut } from '@/app/login/actions';
import { money } from '@/lib/format';
import { DOCS, NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';

export type Workspace = { name: string | null; balanceCents: number | null; low: boolean };

export function BrandMark({ className }: { className?: string }) {
  return brand.logo ? (
    // A file under public/, any size or format, so a plain img rather than next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={brand.logo} alt="" className={cn('size-6 rounded-md object-contain', className)} />
  ) : (
    <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground', className)}>{brand.name.slice(0, 1)}</span>
  );
}

const ROW = 'h-9 gap-2.5 px-3 text-muted-foreground data-active:text-sidebar-accent-foreground';

export function AppSidebar({ workspace, canSignOut = false }: { workspace: Workspace; canSignOut?: boolean }) {
  const path = usePathname();
  const { theme, setTheme } = useTheme();
  const isActive = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

  return (
    <Sidebar>
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-5">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark />
          <span className="truncate font-semibold tracking-tight">{brand.name}</span>
        </Link>
      </SidebarHeader>

      <div className="px-3 pt-3">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-background font-normal text-muted-foreground" onClick={openCommandMenu}>
          <Search /> Search…
          <KbdGroup className="ml-auto">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
      </div>
      <SidebarContent className="p-3">
        <SidebarMenu className="gap-1">
          {NAV.map((item) =>
            item.children ? (
              <Collapsible key={item.label} defaultOpen render={<SidebarMenuItem />}>
                <SidebarMenuButton render={<Link href={item.href} />} className={ROW}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                <CollapsibleTrigger render={<SidebarMenuAction className="top-2 data-[panel-open]:[&>svg]:rotate-0 [&>svg]:-rotate-90 [&>svg]:transition-transform" />}>
                  <ChevronDown />
                  <span className="sr-only">Toggle {item.label}</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mt-0.5 mr-0 ml-5 gap-0.5 border-sidebar-border pr-0 pl-2">
                    {item.children.map((child) => (
                      <SidebarMenuSubItem key={child.href}>
                        <SidebarMenuSubButton render={<Link href={child.href} />} isActive={isActive(child.href)} className={cn(ROW, 'h-9')}>
                          <child.icon className="text-current!" />
                          <span>{child.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive(item.href)} className={ROW}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-0 p-0">
        <div className="border-t border-sidebar-border bg-sidebar-accent px-3 py-1.5">
          {workspace.balanceCents !== null ? (
            <Link href="/settings/billing" className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-background/70">
              <Wallet className="size-4" />
              <span className="flex-1">Balance</span>
              <span className={cn('font-semibold tabular-nums', workspace.low ? 'text-destructive' : 'text-foreground')}>{money(workspace.balanceCents)}</span>
            </Link>
          ) : null}
          <a href={DOCS.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background/70">
            <DOCS.icon className="size-4" />
            <span className="flex-1">{DOCS.label}</span>
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </a>
        </div>
        <div className="border-t border-sidebar-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:bg-sidebar-accent data-popup-open:bg-sidebar-accent">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{(workspace.name ?? brand.name).slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-medium">{workspace.name ?? brand.name}</span>
                <span className="truncate text-xs text-muted-foreground">Workspace</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={6} className="w-56">
              <DropdownMenuItem render={<Link href="/settings/company" />}>
                <Settings /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings/billing" />}>
                <CreditCard /> Billing
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings/team" />}>
                <Users /> Team
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings/api-keys" />}>
                <KeyRound /> API keys
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <SunMoon /> Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={(value: string) => setTheme(value)}>
                    <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem render={<a href={DOCS.href} target="_blank" rel="noopener noreferrer" />}>
                <DOCS.icon /> {DOCS.label}
              </DropdownMenuItem>
              {canSignOut ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void signOut()}>
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
