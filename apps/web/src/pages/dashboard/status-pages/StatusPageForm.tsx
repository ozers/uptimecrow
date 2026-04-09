import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStatusPageSchema } from "@uptimecrow/shared";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const statusPageResolver = zodResolver(createStatusPageSchema) as any;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type StatusPageFormData = {
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor: string;
  isPublic: boolean;
};

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
      ...defaultValues,
    },
  });

  const name = watch("name");
  const isPublic = watch("isPublic");

  useEffect(() => {
    if (!defaultValues?.slug && name) {
      setValue("slug", toSlug(name));
    }
  }, [name, defaultValues?.slug, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Page Name</Label>
        <Input id="name" placeholder="My Service Status" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/status/</span>
          <Input id="slug" placeholder="my-service" {...register("slug")} />
        </div>
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brandColor">Brand Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="brandColor"
              type="color"
              className="h-10 w-14 cursor-pointer p-1"
              {...register("brandColor")}
            />
            <Input {...register("brandColor")} className="flex-1" placeholder="#00e676" />
          </div>
          {errors.brandColor && (
            <p className="text-sm text-destructive">{errors.brandColor.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL (optional)</Label>
          <Input id="logoUrl" placeholder="https://..." {...register("logoUrl")} />
          {errors.logoUrl && (
            <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setValue("isPublic", e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="isPublic" className="cursor-pointer">
          Publicly accessible
        </Label>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
