'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, X } from 'lucide-react';
import { Badge, Card, Field, Input, TokenInput } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SubmitButton } from '@/components/ui/client';

const STEPS = [
  { label: 'Tu candidatura', hint: 'El nombre y los apodos con los que te reconocen.' },
  { label: 'Adversarios', hint: 'A quién quieres comparar en el tablero.' },
  { label: 'Temas', hint: 'De qué asuntos quieres seguir la conversación.' },
] as const;

const SUGGESTED_TOPICS = ['Seguridad', 'Economía', 'Salud', 'Educación', 'Corrupción', 'Transporte', 'Agua', 'Empleo'];

type CompetitorRow = { id: number; name: string };

export function SetupWizard() {
  const [step, setStep] = useState(0);
  const [candidateName, setCandidateName] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([{ id: 1, name: '' }]);
  const [campaignName, setCampaignName] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [stepError, setStepError] = useState('');
  const percent = Math.round(((step + 1) / STEPS.length) * 100);

  function next() {
    setStepError('');
    if (step === 0 && !candidateName.trim()) {
      setStepError('Escribe el nombre del candidato para continuar.');
      return;
    }
    if (step === 1 && !competitors.some((competitor) => competitor.name.trim())) {
      setStepError('Agrega al menos un adversario con nombre.');
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function addCompetitor() {
    if (competitors.length >= 10) return;
    setCompetitors((current) => [...current, { id: Math.max(0, ...current.map((item) => item.id)) + 1, name: '' }]);
  }

  function removeCompetitor(id: number) {
    setCompetitors((current) => current.filter((item) => item.id !== id));
  }

  function updateCompetitor(id: number, name: string) {
    setCompetitors((current) => current.map((item) => (item.id === id ? { ...item, name } : item)));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="overflow-hidden">
        <div className="space-y-4 px-5 pt-5 sm:px-7 sm:pt-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paso {step + 1} de {STEPS.length}</p>
              <h2 className="mt-1 text-lg font-semibold">{STEPS[step].label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{STEPS[step].hint}</p>
            </div>
            <Badge tone="accent">{percent}%</Badge>
          </div>
          <div role="progressbar" aria-label="Progreso del asistente" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <ol className="grid grid-cols-3 gap-2 pb-1" aria-label="Pasos">
            {STEPS.map((item, index) => (
              <li key={item.label} className={`flex items-center gap-2 text-xs ${index === step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${index < step ? 'border-primary bg-primary text-primary-foreground' : index === step ? 'border-primary text-primary' : 'border-border'}`}>
                  {index < step ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          <section hidden={step !== 0} aria-labelledby="candidate-step-title" className="space-y-5">
            <h3 id="candidate-step-title" className="sr-only">Datos de tu candidatura</h3>
            <Field label="Nombre del candidato">
              <Input name="candidateName" value={candidateName} onChange={(event) => setCandidateName(event.target.value)} placeholder="Ej. Andrea López" autoComplete="name" />
            </Field>
            <Field label="Apodos y variantes" hint="Presiona Enter después de cada nombre. Cada variante se seguirá como un término propio.">
              <TokenInput name="brandVariants" placeholder="Ej. Andrea, Andy López" max={20} />
            </Field>
            <Field label="Nombre de campaña (opcional)" hint={`Si lo dejas vacío, usaremos “Campaña de ${candidateName.trim() || 'tu candidato'}”.`}>
              <Input name="campaignName" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="Ej. Andrea López 2027" />
            </Field>
          </section>

          <section hidden={step !== 1} aria-labelledby="competitors-step-title" className="space-y-4">
            <h3 id="competitors-step-title" className="sr-only">Adversarios</h3>
            {competitors.map((competitor, index) => (
              <div key={competitor.id} className="rounded-xl border bg-card p-4 sm:p-5">
                <input type="hidden" name="competitorIds" value={competitor.id} />
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Adversario {index + 1}</p>
                  {competitors.length > 1 ? (
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Quitar adversario ${index + 1}`} onClick={() => removeCompetitor(competitor.id)}>
                      <X aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4">
                  <Field label="Nombre">
                    <Input name={`competitorName_${competitor.id}`} value={competitor.name} onChange={(event) => updateCompetitor(competitor.id, event.target.value)} placeholder="Ej. Carlos Ramírez" />
                  </Field>
                  <Field label="Apodos y variantes">
                    <TokenInput name={`competitorVariants_${competitor.id}`} placeholder="Ej. Carlos, Charly Ramírez" max={10} />
                  </Field>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addCompetitor} disabled={competitors.length >= 10}>
              <Plus aria-hidden="true" /> Agregar adversario
            </Button>
            {competitors.length >= 10 ? <p className="text-xs text-muted-foreground">Puedes agregar hasta 10 adversarios en este paso.</p> : null}
          </section>

          <section hidden={step !== 2} aria-labelledby="topics-step-title" className="space-y-5">
            <h3 id="topics-step-title" className="sr-only">Temas de conversación</h3>
            <Field label="Temas sugeridos" hint="Elige los que quieras seguir; también puedes añadir otros abajo." group>
              <ToggleGroup
                multiple
                spacing={1.5}
                value={selectedTopics}
                onValueChange={(next) => setSelectedTopics(next)}
                aria-label="Temas sugeridos"
                className="flex-wrap"
              >
                {SUGGESTED_TOPICS.map((topic) => (
                  <ToggleGroupItem key={topic} value={topic} variant="outline" className="h-8 rounded-full px-3 text-xs font-normal data-pressed:border-primary/40 data-pressed:bg-primary/10 data-pressed:text-primary">
                    {topic}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            {selectedTopics.map((topic) => <input key={topic} type="hidden" name="suggestedTopics" value={topic} />)}
            <Field label="Otros temas" hint="Opcional. Puedes escribir varios y presionar Enter después de cada uno.">
              <TokenInput name="freeTopics" placeholder="Ej. Obras públicas" max={20} />
            </Field>
            <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
              Al terminar crearemos una campaña con el candidato, sus adversarios y los temas que elegiste. Cada nombre o variante será un término de seguimiento.
            </p>
          </section>

          {stepError ? <p role="alert" className="text-sm text-destructive">{stepError}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={() => { setStepError(''); setStep((current) => Math.max(current - 1, 0)); }}>
                <ArrowLeft aria-hidden="true" /> Volver
              </Button>
            ) : <span />}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                Continuar <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <SubmitButton>Crear mi tablero</SubmitButton>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
