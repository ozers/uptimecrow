import * as React from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldSection } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UPDATE_TEMPLATES,
  fillTemplate,
  type IncidentUpdateStatus,
} from "@/lib/incident-templates";

/**
 * DALGA 3 — incident güncelleme yazma bloğu, şablonlarla.
 *
 * IncidentDetail'daki "Post Update" formunun yerine geçer. Fark:
 *  · Üstte dört şablon rozeti. Tıklama hem metni hem durumu doldurur.
 *  · Şablon uygulandıktan sonra metin serbestçe düzenlenebilir; kullanıcı
 *    yazmaya başlayınca rozet seçimi düşer (sürpriz üzerine yazma olmaz).
 *  · Durum ve metin tek Field dilinde, aria bağlantıları kurulu.
 *
 * IncidentDetail entegrasyonu (mevcut form bloğunun yerine):
 *
 *   <IncidentUpdateComposer
 *     serviceName={incident.monitorName}
 *     status={watch("status")}
 *     body={watch("body")}
 *     onStatusChange={(v) => setValue("status", v)}
 *     onBodyChange={(v) => setValue("body", v, { shouldValidate: true })}
 *     error={errors.body?.message}
 *     pending={createUpdate.isPending}
 *     onSubmit={handleSubmit(onSubmitUpdate)}
 *     statuses={INCIDENT_STATUSES}
 *   />
 */
export interface IncidentUpdateComposerProps {
  /** Şablonlarda `{service}` yerine yazılacak ad. */
  serviceName?: string | null;
  status: IncidentUpdateStatus | string;
  body: string;
  onStatusChange: (status: IncidentUpdateStatus) => void;
  onBodyChange: (body: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  statuses: readonly string[];
  error?: string;
  pending?: boolean;
}

export function IncidentUpdateComposer({
  serviceName,
  status,
  body,
  onStatusChange,
  onBodyChange,
  onSubmit,
  statuses,
  error,
  pending,
}: IncidentUpdateComposerProps) {
  const [appliedTemplate, setAppliedTemplate] = React.useState<string | null>(null);

  const applyTemplate = (id: string) => {
    const t = UPDATE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    onBodyChange(fillTemplate(t, serviceName));
    onStatusChange(t.status);
    setAppliedTemplate(t.id);
  };

  return (
    <form onSubmit={onSubmit} className="max-w-xl">
      <FieldSection
        title="Post update"
        description="Müşteri bu metni olduğu gibi okuyacak — kısa, net, mazeretsiz."
      >
        {/* Şablonlar */}
        <div className="flex flex-wrap gap-2">
          {UPDATE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              aria-pressed={appliedTemplate === t.id}
              className={cn(
                "focus-ring rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-1 ease-out",
                appliedTemplate === t.id
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Field label="Status">
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(v as IncidentUpdateStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Message"
          htmlFor="incident-update-body"
          hint={`${body.length} karakter · abonelere e-posta olarak da gider`}
          error={error}
        >
          <Textarea
            id="incident-update-body"
            rows={4}
            placeholder="Describe the current state…"
            value={body}
            onChange={(e) => {
              onBodyChange(e.target.value);
              setAppliedTemplate(null);
            }}
          />
        </Field>

        <Button type="submit" size="touch" className="w-full" loading={pending}>
          {!pending && <Send className="h-4 w-4" aria-hidden="true" />}
          {pending ? "Posting…" : "Post update"}
        </Button>
      </FieldSection>
    </form>
  );
}

/**
 * Otomatik çözüm teklifi bandı — incident detayının üstünde görünür.
 * `autoResolveState()` suggest=true döndürdüğünde göster.
 */
export function AutoResolveBanner({
  countdown,
  onResolveNow,
  onKeepOpen,
}: {
  countdown: string;
  onResolveNow: () => void;
  onKeepOpen: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-y border-y-success/40 border-l-2 border-l-success bg-success/5 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-success-foreground">
          Service has been up for 15 minutes
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Bu incident{" "}
          <span className="font-mono tnum text-foreground">{countdown}</span> içinde otomatik
          olarak çözüldü işaretlenecek. İstersen şimdi kapat ya da açık tut.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" onClick={onKeepOpen}>
          Keep open
        </Button>
        <Button variant="brand" onClick={onResolveNow}>
          Resolve now
        </Button>
      </div>
    </div>
  );
}
