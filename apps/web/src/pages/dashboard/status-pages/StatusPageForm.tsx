import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStatusPageSchema } from "@uptimecrow/shared";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const statusPageResolver = zodResolver(createStatusPageSchema) as any;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type StatusPageFormData = {
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor: string;
  isPublic: boolean;
  showIncidentHistory: boolean;
  allowSubscribe: boolean;
  showUptimeBars: boolean;
  showMaintenance: boolean;
};

type VisibilityKey =
  | "showIncidentHistory"
  | "allowSubscribe"
  | "showUptimeBars"
  | "showMaintenance";

const VISIBILITY_ROWS: Array<{ key: VisibilityKey; title: string; description: string }> = [
  {
    key: "showUptimeBars",
    title: "Uptime bars",
    description: "Show the 90-day daily uptime bars under each monitor.",
  },
  {
    key: "showIncidentHistory",
    title: "Incident history",
    description: "Show past resolved incidents to visitors.",
  },
  {
    key: "showMaintenance",
    title: "Scheduled maintenance",
    description: "Show upcoming and in-progress maintenance windows.",
  },
  {
    key: "allowSubscribe",
    title: "Subscribe form",
    description: "Let visitors subscribe by email for incident updates.",
  },
];

interface StatusPageFormProps {
  defaultValues?: Partial<StatusPageFormData>;
  onSubmit: (data: StatusPageFormData) => void;
  loading?: boolean;
  submitLabel?: string;
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function StatusPageForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = "Create Status Page",
}: StatusPageFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StatusPageFormData>({
    resolver: statusPageResolver,
    defaultValues: {
      brandColor: "#00e676",
      isPublic: true,
      showIncidentHistory: true,
      allowSubscribe: true,
      showUptimeBars: true,
      showMaintenance: true,
      ...defaultValues,
    },
  });

  const name = watch("name");
  const isPublic = watch("isPublic");
  const brandColor = watch("brandColor");
  const visibility = watch(VISIBILITY_ROWS.map((r) => r.key));

  useEffect(() => {
    if (!defaultValues?.slug && name) {
      setValue("slug", toSlug(name));
    }
  }, [name, defaultValues?.slug, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
      <Card>
        <CardContent className="space-y-6 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Page details
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="name">Page Name</Label>
            <Input id="name" placeholder="My Service Status" {...register("name")} />
            {errors.name && <p className="text-sm text-danger-foreground">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">/status/</span>
              <Input id="slug" className="font-mono" placeholder="my-service" {...register("slug")} />
            </div>
            {errors.slug && <p className="text-sm text-danger-foreground">{errors.slug.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Branding
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brandColor">Brand Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="h-10 w-10 shrink-0 rounded-md border border-border cursor-pointer overflow-hidden"
                  style={{ backgroundColor: brandColor }}
                >
                  <input
                    type="color"
                    className="opacity-0 h-full w-full cursor-pointer"
                    value={brandColor}
                    onChange={(e) => setValue("brandColor", e.target.value)}
                  />
                </div>
                <Input
                  id="brandColor"
                  className="flex-1 font-mono"
                  placeholder="#00e676"
                  {...register("brandColor")}
                />
              </div>
              {errors.brandColor && (
                <p className="text-sm text-danger-foreground">{errors.brandColor.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logoUrl">Logo URL (optional)</Label>
              <Input id="logoUrl" className="font-mono" placeholder="https://..." {...register("logoUrl")} />
              {errors.logoUrl && (
                <p className="text-sm text-danger-foreground">{errors.logoUrl.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              id="isPublic"
              onClick={() => setValue("isPublic", !isPublic)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isPublic ? "bg-brand" : "bg-muted"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${isPublic ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
            <Label htmlFor="isPublic" className="cursor-pointer">
              Publicly accessible
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Visibility
          </p>
          <p className="-mt-4 text-sm text-muted-foreground">
            Choose which sections appear on your public status page.
          </p>

          <div className="divide-y divide-border">
            {VISIBILITY_ROWS.map((row, i) => {
              const checked = visibility[i];
              return (
                <div key={row.key} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <Label htmlFor={row.key} className="cursor-pointer">
                      {row.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">{row.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    id={row.key}
                    onClick={() => setValue(row.key, !checked)}
                    className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${checked ? "bg-brand" : "bg-muted"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
