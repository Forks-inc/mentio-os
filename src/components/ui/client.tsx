'use client';

/**
 * The interactive building blocks: a form that shows its server action's
 * result inline, a submit button that knows it is pending, a button that
 * asks before doing something destructive, tabs that know the current page,
 * and copy-to-clipboard.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useActionState, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/lib/action';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { Button } from './button';
import { Kbd } from './kbd';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from './tabs';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './sheet';

/** The kit's button names, mapped onto shadcn's variants (as in index.tsx). */
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
const VARIANTS = { primary: 'default', secondary: 'outline', danger: 'destructive', ghost: 'ghost' } as const;

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

/**
 * Set by a drawer around its forms: what a successful save does there (a
 * create drawer closes; a record's drawer only forgets it was edited, so
 * closing it afterwards does not ask to discard).
 */
export const DrawerSavedContext = createContext<(() => void) | null>(null);

/**
 * A form posting to a server action. The result is announced as a toast
 * (Dub's and Midday's way); an error also stays under the form. Inside a
 * create drawer, a success closes the drawer.
 */
export function ActionForm({ action, children, className, resetOnSuccess = false, id }: { action: Action; children: ReactNode; className?: string; resetOnSuccess?: boolean; id?: string }) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const onSaved = useContext(DrawerSavedContext);
  useEffect(() => {
    if (!state?.ok) return;
    if (resetOnSuccess) ref.current?.reset();
    onSaved?.();
  }, [state, resetOnSuccess, onSaved]);
  return (
    <form ref={ref} action={formAction} className={className} id={id}>
      {children}
      <FormResult state={state} />
    </form>
  );
}

/** Announces an action's result as a toast; an error also stays inline, next to what caused it. */
export function FormResult({ state }: { state: ActionState }) {
  useEffect(() => {
    if (state?.ok) toast.success(state.ok);
    else if (state?.error) toast.error(state.error);
  }, [state]);
  if (!state?.error) return null;
  return (
    <p role="alert" className="mt-2 text-xs text-destructive">
      {state.error}
    </p>
  );
}

/**
 * A form's submit button that knows it is pending. With `confirm`, it asks
 * first in a dialog and submits (with its own name and value) on yes.
 */
export function SubmitButton({ children, variant = 'primary', size = 'md', name, value, confirm }: { children: ReactNode; variant?: ButtonVariant; size?: 'sm' | 'md'; name?: string; value?: string; confirm?: string }) {
  const { pending } = useFormStatus();
  const [asking, setAsking] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const button = (
    <Button
      ref={ref}
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      variant={VARIANTS[variant]}
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={(event) => {
        if (!confirm) return;
        event.preventDefault();
        setAsking(true);
      }}
    >
      {pending ? 'Guardando…' : children}
    </Button>
  );
  if (!confirm) return button;
  return (
    <>
      {button}
      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas esta acción?</AlertDialogTitle>
            <AlertDialogDescription>{confirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant={variant === 'danger' ? 'destructive' : 'default'}
              onClick={() => {
                setAsking(false);
                const submitter = ref.current;
                submitter?.form?.requestSubmit(submitter);
              }}
            >
              {children}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Tabs whose every tab is a link (a page per tab, or a search param):
 * shadcn's Tabs, line variant. `current` is the active one; left out, it is
 * the tab matching the current path.
 */
export function Tabs({ items, current }: { items: Array<{ href: string; label: ReactNode; value?: string; exact?: boolean }>; current?: string }) {
  const path = usePathname();
  const active =
    current ??
    items.find((item) => (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`)))?.href;
  return (
    <ShadcnTabs value={active ?? null} className="mb-5">
      <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b">
        {items.map((item) => (
          <TabsTrigger key={item.href} value={item.value ?? item.href} nativeButton={false} render={<Link href={item.href} />} className="flex-none px-2.5">
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadcnTabs>
  );
}

/** One choice of a few, each a link (7d, 30d, 90d): shadcn's ToggleGroup. */
export function LinkToggle({ current, items }: { current: string; items: Array<{ value: string; label: ReactNode; href: string }> }) {
  const router = useRouter();
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      value={[current]}
      onValueChange={(next: string[]) => {
        const item = items.find((i) => i.value === next[0]);
        if (item) router.push(item.href, { scroll: false });
      }}
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} className="px-2.5 text-xs">
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? 'Copiado' : label}
    </Button>
  );
}

/**
 * A button that opens a side drawer holding a form (the dashboard's way for
 * every overlay): "Save view", "Save as segment". The form is rendered by the
 * server page and passed in as children.
 */
export function DrawerButton({ label, icon, title, description, children, variant = 'ghost', size = 'md', create = false }: { label: ReactNode; icon?: ReactNode; title: string; description?: string; children: ReactNode; variant?: ButtonVariant; size?: 'sm' | 'md'; /** The page's create action: pressed by the C shortcut, which it shows. */ create?: boolean }) {
  const [open, setOpen] = useState(false);
  const guard = useDiscardGuard(() => setOpen(false));
  // A successful save closes without asking.
  const { reset } = guard;
  const close = useCallback(() => {
    reset();
    setOpen(false);
  }, [reset]);
  return (
    <>
      <Button variant={VARIANTS[variant]} size={size === 'sm' ? 'sm' : 'default'} onClick={() => setOpen(true)} data-create={create ? '' : undefined}>
        {icon}
        {label}
        {create ? <Kbd className="ml-1 hidden bg-primary-foreground/20 text-current md:inline-flex">C</Kbd> : null}
      </Button>
      <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : guard.request())}>
        <SheetContent data-drawer="" {...guard.bind} className="inset-y-2 right-2 w-[calc(100%-1rem)] gap-0 rounded-xl p-0 shadow-xl sm:max-w-[560px]">
          <SheetHeader className="sticky top-0 z-10 border-b bg-popover px-6 py-4">
            <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
            {description ? <SheetDescription className="text-xs">{description}</SheetDescription> : null}
          </SheetHeader>
          <DrawerSavedContext.Provider value={close}>
            <div className="@container px-6 pt-5 pb-10">{children}</div>
          </DrawerSavedContext.Provider>
        </SheetContent>
      </Sheet>
      {guard.dialog}
    </>
  );
}

/**
 * A settings card that is its own form (Zernio's and Vercel's shape): title,
 * a line of description, the fields, and a footer with a short hint on the
 * left and Save on the right. The action's result replaces the hint.
 */
export function FormCard({ action, title, description, hint, submit = 'Guardar', children, danger = false }: { action: Action; title: ReactNode; description?: ReactNode; hint?: ReactNode; submit?: ReactNode; children: ReactNode; danger?: boolean }) {
  const [state, formAction] = useActionState(action, null);
  const onSaved = useContext(DrawerSavedContext);
  useEffect(() => {
    if (state?.ok) {
      toast.success(state.ok);
      onSaved?.();
    } else if (state?.error) toast.error(state.error);
  }, [state, onSaved]);
  return (
    <form action={formAction}>
      <Card className={cn('pb-0', danger && 'ring-destructive/30')}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="grid gap-4">{children}</CardContent>
        <CardFooter className="justify-between gap-3 border-t bg-muted/40 py-3">
          <span className={cn('text-xs', state?.error ? 'text-destructive' : 'text-muted-foreground')}>{state?.error ?? hint}</span>
          <SubmitButton size="sm" variant={danger ? 'danger' : 'primary'}>{submit}</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}

/**
 * OpenStatus's dirty-form guard for drawers: once anything inside has been
 * typed or changed, closing it (Esc, a click outside, the X) asks first.
 * `bind` goes on the drawer's content; `close` is the guarded close.
 */
export function useDiscardGuard(close: () => void) {
  const [dirty, setDirty] = useState(false);
  const [asking, setAsking] = useState(false);
  const request = () => (dirty ? setAsking(true) : close());
  const bind = { onInputCapture: () => setDirty(true), onChangeCapture: () => setDirty(true) };
  const dialog = (
    <AlertDialog open={asking} onOpenChange={setAsking}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle>
          <AlertDialogDescription>Los cambios que escribiste aún no se han guardado.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Seguir editando</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => {
              setAsking(false);
              setDirty(false);
              close();
            }}
          >
            Descartar cambios
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  // Stable, so forms that call it on success do not re-run on every render.
  const reset = useCallback(() => setDirty(false), []);
  return { request, bind, dialog, reset };
}
