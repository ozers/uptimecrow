import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMonitorSchema, PLAN_LIMITS } from "@uptimecrow/shared";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { normalizeUrl } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { deriveMonitorDefaults, formatInterval } from "@/lib/monitor-defaults";
import { Zap, CheckCircle2, XCircle, AlertTriangle, Pencil } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const monitorResolver = zodResolver(createMonitorSchema) as any;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldSection, FieldDisclosure } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Monitor } from "@uptimecrow/shared";

/**
 * DALGA 2 — MonitorForm sadeleştirmesi.
 *
 * Önce: 12 görünür alan, hepsi eşit ağırlıkta, üç bölüm açık. Kayıt olan
 * kullanıcı ilk yeşil noktayı görmek için 12 karar veriyordu.
 *
 * Sonra:
 *  · Zorunlu alan tek: URL. Odak otomatik oraya gider.
 *  · Ad / tip / aralık URL'den türetilir ve rozet olarak gösterilir. Rozete
 *    basınca ilgili alan açılır — "tahmin ettim, istersen düzelt".
 *  · Kalan her şey (method, keyword, timeout, expected status, confirmation,
 *    SSL/domain/slow eşikleri) `Advanced` içinde katlı. Kapalıyken özeti
 *    tek satırda görünür, yani gizlenmiş değil — sadece susturulmuş.
 *  · Test sonucu URL'in hemen altında, aynı yerde: kullanıcı gözünü
 *    kaydırmıyor.
 *  · Edit modunda (`monitor` prop'u varsa) Advanced varsayılan olarak açık —
 *    düzenlemeye gelen kullanıcı zaten ince ayar peşinde.
 *
 * Alan sayısı azalmadı; görünür karar sayısı 12 → 1'e indi.
 */
type MonitorFormData = {
  name: string;
  url: string;
  type: "http" | "tcp" | "keyword";
  method: "GET" | "HEAD";
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  confirmationCount: number;
  keyword?: string;
  sslDaysWarning?: number;
  domainDaysWarning?: number;
  slowResponseThresholdMs?: number | null;
};

interface TestResult {
  status: "up" | "down" | "degraded";
  responseMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  bodyPreview: string;
  bodyLength: number;
  warnings: string[];
}

interface MonitorFormProps {
  defaultValues?: Partial<MonitorFormData>;
  onSubmit: (data: MonitorFormData) => void;
  loading?: boolean;
  submitLabel?: string;
  monitor?: Monitor;
}

/** Türetilmiş değer rozeti — tıklanınca gerçek alanı açar. */
function DerivedChip({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="focus-ring group inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-[13px] transition-colors duration-1 ease-out hover:border-muted-foreground hover:bg-accent"
    >
      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-text3">
        {label}
      </span>
      <span className="max-w-[18ch] truncate font-medium">{value || "—"}</span>
      <Pencil className="h-3 w-3 text-text3 opacity-0 transition-opacity duration-1 group-hover:opacity-100" aria-hidden="true" />
    </button>
  );
}

export function MonitorForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = "Add monitor & run first check",
  monitor,
}: MonitorFormProps) {
  const isEdit = !!monitor;
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  /** Türetilen değerleri elle düzenleme modu. */
  const [editIdentity, setEditIdentity] = useState(isEdit);
  const [nameTouched, setNameTouched] = useState(isEdit || !!defaultValues?.name);
  const plan = useAuthStore((s) => s.user?.plan) ?? "free";
  const minInterval = PLAN_LIMITS[plan].minInterval;
  const urlRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<MonitorFormData>({
    resolver: monitorResolver,
    defaultValues: {
      name: "",
      type: "http",
      method: "GET",
      intervalSeconds: Math.max(60, minInterval),
      timeoutMs: 10000,
      expectedStatus: 200,
      confirmationCount: 2,
      sslDaysWarning: 30,
      domainDaysWarning: 30,
      ...defaultValues,
    },
  });

  const monitorType = watch("type");
  const monitorMethod = watch("method");
  const urlValue = watch("url");
  const nameValue = watch("name");
  const watchedInterval = watch("intervalSeconds");
  const timeoutValue = watch("timeoutMs");
  const expectedStatusValue = watch("expectedStatus");
  const confirmationValue = watch("confirmationCount");

  const urlRegister = register("url");

  const isHttp = monitorType === "http";
  const usesHead = isHttp && monitorMethod === "HEAD";

  // Yeni monitörde odak doğrudan tek zorunlu alana
  useEffect(() => {
    if (!isEdit) urlRef.current?.focus();
  }, [isEdit]);

  // URL yazıldıkça ad ve tip türetilir — kullanıcı ada dokunmadıysa
  useEffect(() => {
    if (isEdit || !urlValue) return;
    const derived = deriveMonitorDefaults(urlValue, watchedInterval ?? 60);
    if (!nameTouched) setValue("name", derived.name);
    if (monitorType !== "keyword") setValue("type", derived.type);
  }, [urlValue, nameTouched, isEdit, setValue, watchedInterval, monitorType]);

  const runTest = async () => {
    const raw = getValues("url");
    if (!raw) return;
    const url = normalizeUrl(raw);
    if (url !== raw) setValue("url", url);
    setTesting(true);
    setTestResult(null);
    try {
      const { result } = await api.post<{ result: TestResult }>("/api/monitors/test", {
        url,
        expectedStatus: getValues("expectedStatus"),
        keyword: getValues("keyword") || undefined,
      });
      setTestResult(result);
      analytics.monitorTested();
    } catch {
      setTestResult({
        status: "down",
        responseMs: null,
        statusCode: null,
        errorMessage: "Failed to run test",
        bodyPreview: "",
        bodyLength: 0,
        warnings: [],
      });
    } finally {
      setTesting(false);
    }
  };

  const advancedSummary = [
    usesHead ? "HEAD" : "GET",
    `${Math.round((timeoutValue ?? 10000) / 1000)}s timeout`,
    `expect ${expectedStatusValue ?? 200}`,
    `${confirmationValue ?? 2}× confirm`,
  ].join(" · ");

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({ ...data, url: normalizeUrl(data.url) }))}
      className="max-w-xl space-y-7"
    >
      {/* ── Tek zorunlu karar ────────────────────────────────────────────── */}
      <Field
        label="URL"
        htmlFor="url"
        required
        hint="Şema yazmasan da olur — https:// eklenir. Kaydettiğin an ilk kontrol çalışır."
        error={errors.url?.message}
      >
        <div className="flex gap-2">
          <Input
            id="url"
            placeholder="api.example.com/health"
            className="flex-1 font-mono"
            {...urlRegister}
            ref={(el) => {
              urlRegister.ref(el);
              urlRef.current = el;
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={runTest}
            loading={testing}
            disabled={!urlValue}
          >
            {!testing && <Zap className="h-4 w-4" aria-hidden="true" />}
            Test
          </Button>
        </div>
      </Field>

      {/* Test sonucu — URL'in hemen altında, aynı odak alanında */}
      {testResult && (
        <div
          className={`border-y border-l-2 p-4 ${
            testResult.status === "up"
              ? "border-y-success/40 border-l-success bg-success/5"
              : "border-y-danger/40 border-l-danger bg-danger/5"
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {testResult.status === "up" ? (
              <CheckCircle2 className="h-4 w-4 text-success-foreground" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 text-danger-foreground" aria-hidden="true" />
            )}
            <span className="text-sm font-medium">
              {testResult.status === "up" ? "Reachable" : "Unreachable"}
            </span>
            {testResult.statusCode && (
              <span
                className={`rounded-full px-2 py-0.5 font-mono tnum text-xs ${
                  testResult.statusCode >= 200 && testResult.statusCode < 300
                    ? "bg-success/15 text-success-foreground"
                    : testResult.statusCode >= 400 && testResult.statusCode < 500
                      ? "bg-warning/15 text-warning-foreground"
                      : testResult.statusCode >= 500
                        ? "bg-danger/15 text-danger-foreground"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {testResult.statusCode}
              </span>
            )}
            {testResult.responseMs != null && (
              <span className="font-mono tnum text-xs text-muted-foreground">
                {testResult.responseMs}ms
              </span>
            )}
          </div>
          {testResult.errorMessage && (
            <p className="mb-2 flex items-center gap-1 text-xs text-danger-foreground">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              {testResult.errorMessage}
            </p>
          )}
          {testResult.warnings?.map((warning, i) => (
            <p key={i} className="mb-1 flex items-start gap-1 text-xs text-warning-foreground">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              {warning}
            </p>
          ))}
          {testResult.bodyPreview &&
            (() => {
              const suggestions: string[] = [];
              const titleMatch = testResult.bodyPreview.match(/^([^|—\-·]+)/);
              const candidate = titleMatch?.[1]?.trim();
              if (candidate && candidate.length > 2 && candidate.length < 60) {
                suggestions.push(candidate);
              }
              const words = testResult.bodyPreview.split(/\s+/).filter((w) => w.length > 3);
              const firstMeaningful = words.slice(0, 3).join(" ");
              if (
                firstMeaningful &&
                !suggestions.includes(firstMeaningful) &&
                firstMeaningful.length < 40
              ) {
                suggestions.push(firstMeaningful);
              }

              return (
                <div className="mt-3">
                  {suggestions.length > 0 && !usesHead && (
                    <div className="mb-2">
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        Suggested keywords — click to use:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setValue("keyword", s)}
                            className="focus-ring rounded-md border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand transition-colors duration-1 hover:bg-brand/20"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Response preview ({Math.round(testResult.bodyLength / 1024)}KB):
                  </p>
                  <div className="max-h-24 overflow-y-auto rounded bg-background/50 p-2 text-xs text-muted-foreground">
                    {testResult.bodyPreview}
                  </div>
                </div>
              );
            })()}
        </div>
      )}

      {/* ── Türetilenler ─────────────────────────────────────────────────── */}
      {!editIdentity ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            URL'den tahmin edildi — değiştirmek için tıkla.
          </p>
          <div className="flex flex-wrap gap-2">
            <DerivedChip label="Ad" value={nameValue} onEdit={() => setEditIdentity(true)} />
            <DerivedChip
              label="Tip"
              value={(monitorType ?? "http").toUpperCase()}
              onEdit={() => setEditIdentity(true)}
            />
            <DerivedChip
              label="Aralık"
              value={formatInterval(watchedInterval ?? 60)}
              onEdit={() => setEditIdentity(true)}
            />
          </div>
          {errors.name && (
            <p role="alert" className="text-sm text-danger-foreground">
              {errors.name.message}
            </p>
          )}
        </div>
      ) : (
        <FieldSection title="Identity" divider={false}>
          <Field label="Monitor name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              placeholder="My Website"
              {...register("name", { onChange: () => setNameTouched(true) })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monitor type">
              <Select
                value={monitorType}
                onValueChange={(v) => setValue("type", v as "http" | "tcp" | "keyword")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="keyword">Keyword</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Check interval"
              htmlFor="intervalSeconds"
              adornment="seconds"
              hint={`Minimum ${minInterval}s on your ${plan} plan${plan === "free" ? " — upgrade for faster checks" : ""}.`}
              error={
                errors.intervalSeconds?.message ??
                (typeof watchedInterval === "number" && watchedInterval < minInterval
                  ? `Your ${plan} plan checks at most every ${minInterval}s — lower values are rejected on save.`
                  : undefined)
              }
            >
              <Input
                id="intervalSeconds"
                type="number"
                min={minInterval}
                max={300}
                step={10}
                className="tnum"
                {...register("intervalSeconds", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </FieldSection>
      )}

      {/* ── Advanced ─────────────────────────────────────────────────────── */}
      <FieldDisclosure label="Advanced" summary={advancedSummary} defaultOpen={isEdit}>
        {isHttp && (
          <Field
            label="Request method"
            hint={
              usesHead
                ? "Only response headers are fetched — no body is downloaded, so up/down is decided by the status code alone. Keyword matching is disabled."
                : "The full response body is downloaded. Add a keyword below to require specific text in the response."
            }
          >
            <Select
              value={monitorMethod ?? "GET"}
              onValueChange={(v) => {
                setValue("method", v as "GET" | "HEAD");
                if (v === "HEAD") setValue("keyword", undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET — Full (downloads the response, supports keyword match)</SelectItem>
                <SelectItem value="HEAD">HEAD — Lightweight (headers only, minimal load on your endpoint)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}

        {!usesHead && (
          <Field
            label="Keyword"
            htmlFor="keyword"
            adornment="optional"
            hint="If set, the response body must contain this text to be considered UP. Works even on JS-rendered pages (checks the raw HTML including meta tags)."
          >
            <Input id="keyword" placeholder="e.g. Welcome, Dashboard, OK" {...register("keyword")} />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Timeout"
            htmlFor="timeoutMs"
            adornment="ms"
            error={errors.timeoutMs?.message}
          >
            <Input
              id="timeoutMs"
              type="number"
              min={1000}
              max={30000}
              step={1000}
              className="tnum"
              {...register("timeoutMs", { valueAsNumber: true })}
            />
          </Field>

          <Field
            label="Expected status"
            htmlFor="expectedStatus"
            hint="200 = smart mode (5xx is down, rest is up)"
            error={errors.expectedStatus?.message}
          >
            <Input
              id="expectedStatus"
              type="number"
              min={100}
              max={599}
              className="tnum"
              {...register("expectedStatus", { valueAsNumber: true })}
            />
          </Field>
        </div>

        <Field
          label="Confirmation count"
          htmlFor="confirmationCount"
          hint="Number of consecutive failures before marking as down. 2 is the safe default — 1 causes false alarms."
          error={errors.confirmationCount?.message}
        >
          <Input
            id="confirmationCount"
            type="number"
            min={1}
            max={5}
            className="tnum"
            {...register("confirmationCount", { valueAsNumber: true })}
          />
        </Field>

        {urlValue?.startsWith("https://") && (
          <Field
            label="SSL warning threshold"
            htmlFor="sslDaysWarning"
            adornment="days"
            hint="Alert when the SSL certificate expires within this many days."
          >
            <Input
              id="sslDaysWarning"
              type="number"
              min={1}
              max={365}
              className="tnum"
              {...register("sslDaysWarning", { valueAsNumber: true })}
            />
          </Field>
        )}

        {(urlValue?.startsWith("https://") || urlValue?.startsWith("http://")) && (
          <Field
            label="Domain warning threshold"
            htmlFor="domainDaysWarning"
            adornment="days"
            hint="Alert when the domain registration expires within this many days."
          >
            <Input
              id="domainDaysWarning"
              type="number"
              min={1}
              max={365}
              className="tnum"
              {...register("domainDaysWarning", { valueAsNumber: true })}
            />
          </Field>
        )}

        <Field
          label="Slow response alert"
          htmlFor="slowResponseThresholdMs"
          adornment="ms · optional"
          hint="Send a notification when a successful check takes longer than this. Leave empty to disable."
          error={errors.slowResponseThresholdMs?.message}
        >
          <Input
            id="slowResponseThresholdMs"
            type="number"
            min={100}
            max={60000}
            step={100}
            placeholder="e.g. 2000"
            className="tnum"
            {...register("slowResponseThresholdMs", {
              setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
            })}
          />
        </Field>
      </FieldDisclosure>

      <Button type="submit" size="touch" loading={loading} className="w-full sm:w-auto">
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
