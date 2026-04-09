import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateMonitor } from "@/lib/queries/monitors";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { MonitorForm } from "./MonitorForm";

export function MonitorCreate() {
  const navigate = useNavigate();
  const mutation = useCreateMonitor();

  return (
    <div>
      <PageHeader title="Add Monitor" description="Start monitoring a new service" />
      <MonitorForm
        loading={mutation.isPending}
        onSubmit={(data) =>
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Monitor created");
              navigate("/dashboard/monitors");
            },
            onError: (e) =>
              toast.error(e instanceof ApiError ? e.message : "Failed to create monitor"),
          })
        }
      />
    </div>
  );
}
