import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMonitorSchema } from "@uptimecrow/shared";
import { api } from "@/lib/api";
import { normalizeUrl } from "@/lib/utils";
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
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  confirmationCount: number;
  keyword?: string;
  sslDaysWarning?: number;
  domainDaysWarning?: number;
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
  const urlValue = watch("url");

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
    <form onSubmit={handleSubmit((data) => onSubmit({ ...data, url: normalizeUrl(data.url) }))} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Monitor Name</Label>
        <Input id="name" placeholder="My Website" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
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
        {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`rounded-lg border p-4 ${
          testResult.status === "up"
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}>
          <div className="mb-2 flex items-center gap-2">
            {testResult.status === "up" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm font-medium">
              {testResult.status === "up" ? "Reachable" : "Unreachable"}
            </span>
            {testResult.statusCode && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                testResult.statusCode >= 200 && testResult.statusCode < 300
                  ? "bg-emerald-500/15 text-emerald-400"
                  : testResult.statusCode >= 400 && testResult.statusCode < 500
                    ? "bg-yellow-500/15 text-yellow-400"
                    : testResult.statusCode >= 500
                      ? "bg-red-500/15 text-red-400"
                      : "bg-zinc-500/15 text-zinc-400"
              }`}>
                {testResult.statusCode}
              </span>
            )}
            {testResult.responseMs != null && (
              <span className="text-xs text-muted-foreground">{testResult.responseMs}ms</span>
            )}
          </div>
          {testResult.errorMessage && (
            <p className="mb-2 flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {testResult.errorMessage}
            </p>
          )}
          {testResult.warnings?.map((warning, i) => (
            <p key={i} className="mb-1 flex items-start gap-1 text-xs text-yellow-400">
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
                          className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label htmlFor="intervalSeconds">Check Interval (seconds)</Label>
          <Input
            id="intervalSeconds"
            type="number"
            {...register("intervalSeconds", { valueAsNumber: true })}
          />
          {errors.intervalSeconds && (
            <p className="text-sm text-destructive">{errors.intervalSeconds.message}</p>
          )}
        </div>
      </div>

      {/* Keyword field */}
      <div className="space-y-2">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timeoutMs">Timeout (ms)</Label>
          <Input
            id="timeoutMs"
            type="number"
            {...register("timeoutMs", { valueAsNumber: true })}
          />
          {errors.timeoutMs && (
            <p className="text-sm text-destructive">{errors.timeoutMs.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedStatus">Expected Status Code</Label>
          <Input
            id="expectedStatus"
            type="number"
            {...register("expectedStatus", { valueAsNumber: true })}
          />
          <p className="text-xs text-muted-foreground">
            200 = smart mode (5xx is down, rest is up)
          </p>
          {errors.expectedStatus && (
            <p className="text-sm text-destructive">{errors.expectedStatus.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmationCount">Confirmation Count</Label>
        <p className="text-xs text-muted-foreground">
          Number of consecutive failures before marking as down
        </p>
        <Input
          id="confirmationCount"
          type="number"
          {...register("confirmationCount", { valueAsNumber: true })}
        />
        {errors.confirmationCount && (
          <p className="text-sm text-destructive">{errors.confirmationCount.message}</p>
        )}
      </div>

      {urlValue?.startsWith("https://") && (
        <div className="space-y-2">
          <Label htmlFor="sslDaysWarning">SSL Warning Threshold (days)</Label>
          <p className="text-xs text-muted-foreground">
            Alert when the SSL certificate expires within this many days
          </p>
          <Input
            id="sslDaysWarning"
            type="number"
            {...register("sslDaysWarning", { valueAsNumber: true })}
          />
        </div>
      )}

      {(urlValue?.startsWith("https://") || urlValue?.startsWith("http://")) && (
        <div className="space-y-2">
          <Label htmlFor="domainDaysWarning">Domain Warning Threshold (days)</Label>
          <p className="text-xs text-muted-foreground">
            Alert when the domain registration expires within this many days
          </p>
          <Input
            id="domainDaysWarning"
            type="number"
            {...register("domainDaysWarning", { valueAsNumber: true })}
          />
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
