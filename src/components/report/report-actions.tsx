'use client';

import { useState } from 'react';
import { Check, Copy, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReportActions({ whatsappText }: { whatsappText: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap gap-2" aria-label="Acciones del reporte">
      <Button type="button" variant="default" onClick={() => window.print()}>
        <Printer aria-hidden="true" />
        Imprimir / Guardar PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(whatsappText);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? 'Resumen copiado' : 'Copiar resumen para WhatsApp'}
      </Button>
    </div>
  );
}
