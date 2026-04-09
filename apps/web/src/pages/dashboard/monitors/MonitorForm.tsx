import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMonitorSchema } from "@uptimecrow/shared";
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
};

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
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MonitorFormData>({
    resolver: monitorResolver,
    defaultValues: {
      type: "http",
      intervalSeconds: 60,
      timeoutMs: 10000,
      expectedStatus: 200,
      confirmationCount: 2,
      ...defaultValues,
    },
  });

  const monitorType = watch("type");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Monitor Name</Label>
        <Input id="name" placeholder="My Website" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input id="url" placeholder="https://example.com" {...register("url")} />
        {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
      </div>

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

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
