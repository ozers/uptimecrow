import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateStatusPage } from "@/lib/queries/status-pages";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { StatusPageForm } from "./StatusPageForm";

export function StatusPageCreate() {
  const navigate = useNavigate();
  const mutation = useCreateStatusPage();

  return (
    <div>
      <PageHeader title="Create Status Page" description="Set up a public status page" />
      <StatusPageForm
        loading={mutation.isPending}
        onSubmit={(data) =>
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Status page created");
              navigate("/dashboard/status-pages");
            },
            onError: (e) =>
              toast.error(e instanceof ApiError ? e.message : "Failed to create status page"),
          })
        }
      />
    </div>
  );
}
