'use client';

import { Info } from 'lucide-react';
import { GLOSSARY, type GlossaryTerm } from '@/lib/glossary';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type InfoTipProps =
  | { term: GlossaryTerm; text?: never }
  | { text: string; term?: never };

/** Keyboard and pointer accessible help attached to a metric or label. */
export function InfoTip(props: InfoTipProps) {
  const entry = 'term' in props && props.term ? GLOSSARY[props.term] : null;
  const label = entry?.label ?? 'Más información';

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`Ayuda: ${label}`}
            className="relative z-20 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <Info className="size-3.5" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent className="block max-w-[min(22rem,calc(100vw-2rem))] whitespace-normal text-left leading-relaxed">
        {entry ? (
          <span className="block space-y-1">
            <span className="block"><strong>{entry.label}:</strong> {entry.definition}</span>
            <span className="block"><strong>Ejemplo:</strong> {entry.example}</span>
          </span>
        ) : props.text}
      </TooltipContent>
    </Tooltip>
  );
}
