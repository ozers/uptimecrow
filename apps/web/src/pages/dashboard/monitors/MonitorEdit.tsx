import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useMonitor, useUpdateMonitor } from "@/lib/queries/monitors";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading-page";
import { MonitorForm } from "./MonitorForm";

export function MonitorEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: monitor, isLoading } = useMonitor(id!);
  const mutation = useUpdateMonitor(id!);

  if (isLoading) return <LoadingPage />;
  if (!monitor) return <p className="text-muted-foreground">Monitor not found</p>;

  return (
    <div>
      <PageHeader title={`Edit: ${monitor.name}`} />
      <MonitorForm
        defaultValues={{
          name: monitor.name,
          url: monitor.url,
          type: monitor.type,
          intervalSeconds: monitor.intervalSeconds,
          timeoutMs: monitor.timeoutMs,
          expectedStatus: monitor.expectedStatus,
          confirmationCount: monitor.confirmationCount,
        }}
        loading={mutation.isPending}
        submitLabel="Save Changes"
        onSubmit={(data) =>
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Monitor updated");
              navigate(`/dashboard/monitors/${id}`);
            },
            onError: (e) =>
              toast.error(e instanceof ApiError ? e.message : "Failed to update monitor"),
          })
        }
      />
    </div>
  );
}
