import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useStatusPage, useUpdateStatusPage } from "@/lib/queries/status-pages";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading-page";
import { StatusPageForm } from "./StatusPageForm";

export function StatusPageEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useStatusPage(id!);
  const mutation = useUpdateStatusPage(id!);

  if (isLoading) return <LoadingPage />;
  if (!data) return <p className="text-muted-foreground">Status page not found</p>;

  const { statusPage } = data;

  return (
    <div>
      <PageHeader eyebrow="Edit status page" title={`Edit: ${statusPage.name}`} />
      <StatusPageForm
        defaultValues={{
          name: statusPage.name,
          slug: statusPage.slug,
          brandColor: statusPage.brandColor,
          logoUrl: statusPage.logoUrl ?? undefined,
          isPublic: statusPage.isPublic,
        }}
        loading={mutation.isPending}
        submitLabel="Save Changes"
        onSubmit={(data) =>
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Status page updated");
              navigate(`/dashboard/status-pages/${id}`);
            },
            onError: (e) =>
              toast.error(e instanceof ApiError ? e.message : "Failed to update status page"),
          })
        }
      />
    </div>
  );
}
