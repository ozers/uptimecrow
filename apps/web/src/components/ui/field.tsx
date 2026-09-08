import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * DALGA 2 — `<Field>`: label + kontrol + yardım metni + hata tek componentte.
 *
 * Bugün her formda şu blok elle tekrarlanıyor:
 *   <div className="space-y-1.5">
 *     <Label htmlFor="x">…</Label>
 *     <Input id="x" {...register("x")} />
 *     <p className="text-xs text-muted-foreground">…</p>
 *     {errors.x && <p className="text-sm text-danger-foreground">…</p>}
 *   </div>
 *
 * Sorunlar: aria bağlantısı (aria-describedby / aria-invalid) hiçbir yerde
 * kurulmuyor, yardım metni bazen hatanın üstünde bazen altında, boşluklar
 * tutarsız. Field bunları tek yerde çözer.
 *
 * Kullanım:
 *   <Field label="URL" htmlFor="url" hint="Şema yoksa https:// eklenir."
 *          error={errors.url?.message}>
 *     <Input id="url" {...register("url")} />
 *   </Field>
 *
 * Kontrol otomatik olarak id / aria-describedby / aria-invalid alır — tek
 * çocuk bir React elementi ise. Birden fazla çocukta bunları elle ver.
 */
export interface FieldProps {
  label?: React.ReactNode;
  /** Kontrolün id'si. Verilmezse otomatik üretilir. */
  htmlFor?: string;
  /** Nötr açıklama — hata olsa bile görünür kalır. */
  hint?: React.ReactNode;
  /** Doğrulama hatası. Varsa kontrol aria-invalid alır. */
  error?: React.ReactNode;
  /** Sağ üstte küçük mono etiket: "Optional", "Pro", birim vb. */
  adornment?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  adornment,
  required,
  className,
  children,
}: FieldProps) {
  const auto = React.useId();
  const id = htmlFor ?? `f-${auto}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = React.useMemo(() => {
    if (!React.isValidElement(children)) return children;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = children as React.ReactElement<any>;
    return React.cloneElement(el, {
      id: el.props.id ?? id,
      "aria-describedby": el.props["aria-describedby"] ?? describedBy,
      "aria-invalid": error ? true : el.props["aria-invalid"],
      "aria-errormessage": error ? errorId : el.props["aria-errormessage"],
    });
  }, [children, id, describedBy, error, errorId]);

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || adornment) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <Label htmlFor={id}>
              {label}
              {required && (
                <span className="ml-1 text-danger-foreground" aria-hidden="true">
                  *
                </span>
              )}
            </Label>
          )}
          {adornment && (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text3">
              {adornment}
            </span>
          )}
        </div>
      )}

      {control}

      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger-foreground">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Form içinde bölüm başlığı — mono, uppercase, üst çizgi. MonitorForm ve
 * StatusPageForm'daki elle yazılmış <p className="font-mono …"> bloklarının
 * yerine geçer.
 */
export function FieldSection({
  title,
  description,
  divider = true,
  className,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  /** İlk bölümde false ver — üstte gereksiz çizgi olmasın. */
  divider?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-5", divider && "border-t border-border pt-6", className)}>
      <div className="space-y-1">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Katlanabilir "Advanced" bloğu. <details> üzerine kurulu: JS state yok,
 * klavye ve ekran okuyucu bedava, sayfa yenilendiğinde kapalı gelir.
 */
export function FieldDisclosure({
  label,
  summary,
  defaultOpen = false,
  className,
  children,
}: {
  label: string;
  /** Kapalıyken sağda görünen özet: "timeout 10s · 200 · 2 onay" gibi. */
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn("group border-t border-border pt-4", className)}
    >
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 text-sm font-semibold marker:content-none">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-1 ease-out group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{label}</span>
        {summary && (
          <span className="ml-auto truncate font-mono text-[11px] font-normal text-text3 group-open:hidden">
            {summary}
          </span>
        )}
      </summary>
      <div className="mt-5 space-y-5">{children}</div>
    </details>
  );
}
