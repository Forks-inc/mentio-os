'use client';

/**
 * ⌘K, as Dub has it: jump to any page, start any "new" flow, or search the
 * mentions or people for what was typed. Also the app's single-key
 * shortcuts, ignored while typing in a field:
 *   /  focuses the page's search box (an input with data-search)
 *   c  presses the page's create button (an element with data-create)
 */
import { Bell, Plus, Search, Tag, Users, Webhook } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';
import { NAV, type NavItem } from '@/lib/nav';

/** Opens the palette from anywhere (the sidebar's search button). */
export const openCommandMenu = () => window.dispatchEvent(new Event('agora:command'));

const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const PAGES: NavItem[] = NAV.flatMap((item) => (item.children ? [item, ...item.children.filter((c) => c.href !== item.href)] : [item]));
const CREATE = [
  { href: '/keywords/new', label: 'Agregar candidato o tema', icon: Tag },
  { href: '/alerts/new', label: 'Crear alerta', icon: Bell },
  { href: '/channels/new', label: 'Agregar canal', icon: Webhook },
];

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector('[role=dialog]')) return;
      if (e.key === '/') {
        const search = document.querySelector<HTMLInputElement>('input[data-search]');
        if (search) {
          e.preventDefault();
          search.focus();
        }
      } else if (e.key === 'c') {
        const create = document.querySelector<HTMLElement>('[data-create]');
        if (create) {
          e.preventDefault();
          create.click();
        }
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('agora:command', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('agora:command', onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };
  const q = query.trim();

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Menú de comandos" description="Ve a una sección, crea un registro o busca en la conversación.">
      <CommandInput placeholder="Buscar o ir a…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Sin coincidencias.</CommandEmpty>
        {q ? (
          <CommandGroup heading="Buscar">
            <CommandItem value={`buscar menciones ${q}`} onSelect={() => go(`/mentions?q=${encodeURIComponent(q)}`)}>
              <Search /> Menciones que contienen “{q}”
            </CommandItem>
            <CommandItem value={`buscar personas ${q}`} onSelect={() => go(`/people?q=${encodeURIComponent(q)}`)}>
              <Users /> Personas llamadas “{q}”
            </CommandItem>
          </CommandGroup>
        ) : null}
        <CommandGroup heading="Crear">
          {CREATE.map((item) => (
            <CommandItem key={item.href} value={item.label} onSelect={() => go(item.href)}>
              <Plus /> {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ir a">
          {PAGES.map((item) => (
            <CommandItem key={`${item.href}-${item.label}`} value={`ir a ${item.label}`} onSelect={() => go(item.href)}>
              <item.icon /> {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          <CommandShortcut className="ml-0">/</CommandShortcut> buscar en la página
        </span>
        <span>
          <CommandShortcut className="ml-0">C</CommandShortcut> crear
        </span>
      </div>
    </CommandDialog>
  );
}
