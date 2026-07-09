import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMonitorSchema, PLAN_LIMITS } from "@uptimecrow/shared";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { normalizeUrl } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { Loader2, Zap, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const monitorResolver = zodResolver(createMonitorSchema) as any;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Monitor } from "@uptimecrow/shared";

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

export function MonitorForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = "Create Monitor",
}: MonitorFormProps) {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const plan = useAuthStore((s) => s.user?.plan) ?? "free";
  const minInterval = PLAN_LIMITS[plan].minInterval;

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
      type: "http",
      method: "GET",
      intervalSeconds: 60,
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
  const watchedInterval = watch("intervalSeconds");

  // HEAD ("lightweight") mode downloads no body, so keyword matching is
  // unavailable. Only offer/apply HEAD for plain HTTP monitors.
  const isHttp = monitorType === "http";
  const usesHead = isHttp && monitorMethod === "HEAD";

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

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({ ...data, url: normalizeUrl(data.url) }))} className="max-w-xl space-y-8">
      <section className="space-y-6">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Target
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="name">Monitor Name</Label>
          <Input id="name" placeholder="My Website" {...register("name")} />
          {errors.name && <p className="text-sm text-danger-foreground">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url">URL</Label>
          <div className="flex gap-2">
            <Input id="url" placeholder="example.com" {...register("url")} className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={runTest}
              disabled={testing || !urlValue}
            >
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Test
            </Button>
          </div>
          {errors.url && <p className="text-sm text-danger-foreground">{errors.url.message}</p>}
        </div>

        {/* Test Result */}
        {testResult && (
        <div className={`border-y border-l-2 p-4 ${
          testResult.status === "up"
            ? "border-success/40 bg-success/5"
            : "border-danger/40 bg-danger/5"
        }`}>
          <div className="mb-2 flex items-center gap-2">
            {testResult.status === "up" ? (
              <CheckCircle2 className="h-4 w-4 text-success-foreground" />
            ) : (
              <XCircle className="h-4 w-4 text-danger-foreground" />
            )}
            <span className="text-sm font-medium">
              {testResult.status === "up" ? "Reachable" : "Unreachable"}
            </span>
            {testResult.statusCode && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono tnum ${
                testResult.statusCode >= 200 && testResult.statusCode < 300
                  ? "bg-success/15 text-success-foreground"
                  : testResult.statusCode >= 400 && testResult.statusCode < 500
                    ? "bg-warning/15 text-warning-foreground"
                    : testResult.statusCode >= 500
                      ? "bg-danger/15 text-danger-foreground"
                      : "bg-muted-foreground/15 text-muted-foreground"
              }`}>
                {testResult.statusCode}
              </span>
            )}
            {testResult.responseMs != null && (
              <span className="text-xs text-muted-foreground font-mono tnum">{testResult.responseMs}ms</span>
            )}
          </div>
          {testResult.errorMessage && (
            <p className="mb-2 flex items-center gap-1 text-xs text-danger-foreground">
              <AlertTriangle className="h-3 w-3" />
              {testResult.errorMessage}
            </p>
          )}
          {testResult.warnings?.map((warning, i) => (
            <p key={i} className="mb-1 flex items-start gap-1 text-xs text-warning-foreground">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              {warning}
            </p>
          ))}
          {testResult.bodyPreview && (() => {
            // Extract keyword suggestions from body
            const suggestions: string[] = [];
            const titleMatch = testResult.bodyPreview.match(/^([^|—\-·]+)/);
            if (titleMatch?.[1]?.trim() && titleMatch[1].trim().length > 2 && titleMatch[1].trim().length < 60) {
              suggestions.push(titleMatch[1].trim());
            }
            // Try to find site name patterns
            const words = testResult.bodyPreview.split(/\s+/).filter((w) => w.length > 3);
            const firstMeaningful = words.slice(0, 3).join(" ");
            if (firstMeaningful && !suggestions.includes(firstMeaningful) && firstMeaningful.length < 40) {
              suggestions.push(firstMeaningful);
            }

            return (
              <div className="mt-3">
                {suggestions.length > 0 && (
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
                          className="rounded-md border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/20"
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
      </section>

      <section className="space-y-6 border-t border-border pt-6">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Check settings
        </p>
        <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Monitor Type</Label>
          <Select value={monitorType} onValueChange={(v) => setValue("type", v as "http" | "tcp" | "keyword")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="tcp">TCP</SelectItem>
              <SelectItem value="keyword">Keyword</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="intervalSeconds">Check Interval (seconds)</Label>
          <Input
            id="intervalSeconds"
            type="number"
            min={minInterval}
            max={300}
            step={10}
            {...register("intervalSeconds", { valueAsNumber: true })}
          />
          <p className="text-xs text-muted-foreground">
            Minimum {minInterval}s on your {plan} plan{plan === "free" ? " — upgrade for faster checks" : ""}.
          </p>
          {typeof watchedInterval === "number" && watchedInterval < minInterval && (
            <p className="text-sm text-warning-foreground">
              Your {plan} plan checks at most every {minInterval}s — lower values are rejected on save.
            </p>
          )}
          {errors.intervalSeconds && (
            <p className="text-sm text-danger-foreground">{errors.intervalSeconds.message}</p>
          )}
        </div>
      </div>

      {/* Request method — HTTP monitors only. HEAD skips the body for a
          lightweight up/down check; GET downloads it and supports keywords. */}
      {isHttp && (
        <div className="space-y-1.5">
          <Label>Request method</Label>
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
          <p className="text-xs text-muted-foreground">
            {usesHead
              ? "Only response headers are fetched — no body is downloaded, so up/down is decided by the status code alone. Keyword matching is disabled."
              : "The full response body is downloaded. Add a keyword below to require specific text in the response."}
          </p>
        </div>
      )}

      {/* Keyword field — unavailable in HEAD mode (no body to match). */}
      {!usesHead && (
        <div className="space-y-1.5">
          <Label htmlFor="keyword">Keyword (optional)</Label>
          <Input
            id="keyword"
            placeholder="e.g. Welcome, Dashboard, OK"
            {...register("keyword")}
          />
          <p className="text-xs text-muted-foreground">
            If set, the response body must contain this text to be considered UP. Works even on JS-rendered pages (checks the raw HTML including meta tags).
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="timeoutMs">Timeout (ms)</Label>
          <Input
            id="timeoutMs"
            type="number"
            min={1000}
            max={30000}
            step={1000}
            {...register("timeoutMs", { valueAsNumber: true })}
          />
          {errors.timeoutMs && (
            <p className="text-sm text-danger-foreground">{errors.timeoutMs.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expectedStatus">Expected Status Code</Label>
          <Input
            id="expectedStatus"
            type="number"
            min={100}
            max={599}
            {...register("expectedStatus", { valueAsNumber: true })}
          />
          <p className="text-xs text-muted-foreground">
            200 = smart mode (5xx is down, rest is up)
          </p>
          {errors.expectedStatus && (
            <p className="text-sm text-danger-foreground">{errors.expectedStatus.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmationCount">Confirmation Count</Label>
        <p className="text-xs text-muted-foreground">
          Number of consecutive failures before marking as down
        </p>
        <Input
          id="confirmationCount"
          type="number"
          min={1}
          max={5}
          {...register("confirmationCount", { valueAsNumber: true })}
        />
        {errors.confirmationCount && (
          <p className="text-sm text-danger-foreground">{errors.confirmationCount.message}</p>
        )}
      </div>
      </section>

      <section className="space-y-6 border-t border-border pt-6">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Expiry &amp; alerts
        </p>
      {urlValue?.startsWith("https://") && (
        <div className="space-y-1.5">
          <Label htmlFor="sslDaysWarning">SSL Warning Threshold (days)</Label>
          <p className="text-xs text-muted-foreground">
            Alert when the SSL certificate expires within this many days
          </p>
          <Input
            id="sslDaysWarning"
            type="number"
            min={1}
            max={365}
            {...register("sslDaysWarning", { valueAsNumber: true })}
          />
        </div>
      )}

      {(urlValue?.startsWith("https://") || urlValue?.startsWith("http://")) && (
        <div className="space-y-1.5">
          <Label htmlFor="domainDaysWarning">Domain Warning Threshold (days)</Label>
          <p className="text-xs text-muted-foreground">
            Alert when the domain registration expires within this many days
          </p>
          <Input
            id="domainDaysWarning"
            type="number"
            min={1}
            max={365}
            {...register("domainDaysWarning", { valueAsNumber: true })}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="slowResponseThresholdMs">Slow Response Alert (ms, optional)</Label>
        <p className="text-xs text-muted-foreground">
          Send a notification when a successful check takes longer than this. Leave empty to disable.
        </p>
        <Input
          id="slowResponseThresholdMs"
          type="number"
          min={100}
          max={60000}
          step={100}
          placeholder="e.g. 2000"
          {...register("slowResponseThresholdMs", {
            setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
          })}
        />
        {errors.slowResponseThresholdMs && (
          <p className="text-sm text-danger-foreground">{errors.slowResponseThresholdMs.message}</p>
        )}
      </div>
      </section>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
