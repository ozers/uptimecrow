import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * `<Field>`: label, control, hint and error as one component.
 *
 * Every form used to hand-roll this block:
 *   <div className="space-y-1.5">
 *     <Label htmlFor="x">…</Label>
 *     <Input id="x" {...register("x")} />
 *     <p className="text-xs text-muted-foreground">…</p>
 *     {errors.x && <p className="text-sm text-danger-foreground">…</p>}
 *   </div>
 *
 * Which meant the aria wiring (aria-describedby / aria-invalid) was nowhere to
 * be found, the hint sat above the error in one form and below it in the next,
 * and the spacing drifted. Field settles all three in one place.
 *
 * Usage:
 *   <Field label="URL" htmlFor="url" hint="https:// is added when missing."
 *          error={errors.url?.message}>
 *     <Input id="url" {...register("url")} />
 *   </Field>
 *
 * A single React element child gets id / aria-describedby / aria-invalid
 * automatically. With multiple children, wire them yourself.
 */
export interface FieldProps {
  label?: React.ReactNode;
  /** Control id. Generated when omitted. */
  htmlFor?: string;
  /** Neutral guidance. Stays visible even when there is an error. */
  hint?: React.ReactNode;
  /** Validation error. Its presence marks the control aria-invalid. */
  error?: React.ReactNode;
  /** Small mono tag on the right: "Optional", "Pro", a unit. */
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
 * Section heading inside a form — mono, uppercase, with a rule above it.
 * Replaces the hand-written <p className="font-mono …"> blocks in MonitorForm
 * and StatusPageForm.
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
  /** Pass false on the first section so it does not open with a stray rule. */
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
 * Collapsible "Advanced" block, built on <details>: no JS state, keyboard and
 * screen-reader behaviour for free, closed again after a reload.
 */
export function FieldDisclosure({
  label,
  summary,
  defaultOpen = false,
  className,
  children,
}: {
  label: string;
  /** Summary shown on the right while collapsed, e.g. "10s timeout · 200 · 2× confirm". */
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
