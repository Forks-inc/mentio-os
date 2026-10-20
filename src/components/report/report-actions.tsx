'use client';

import { useState } from 'react';
import { Check, Copy, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReportActions({ whatsappText }: { whatsappText: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function copyWithFallback() {
    const textarea = document.createElement('textarea');
    textarea.value = whatsappText;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    textarea.remove();
    return success;
  }

  async function copySummary() {
    setCopyFailed(false);
    let success = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(whatsappText);
        success = true;
      }
    } catch {
      success = false;
    }
    if (!success) {
      try {
        success = copyWithFallback();
      } catch {
        success = false;
      }
    }
    if (!success) {
      setCopyFailed(true);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-wrap gap-2" aria-label="Acciones del reporte">
      <Button type="button" variant="default" onClick={() => window.print()}>
        <Printer aria-hidden="true" />
        Imprimir / Guardar PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={copySummary}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? 'Resumen copiado' : 'Copiar para WhatsApp'}
      </Button>
      {copyFailed ? <p role="status" className="basis-full text-xs text-destructive">No se pudo copiar el resumen. Revisa los permisos del portapapeles.</p> : null}
    </div>
  );
}
