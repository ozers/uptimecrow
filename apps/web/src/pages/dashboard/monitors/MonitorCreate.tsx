import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateMonitor } from "@/lib/queries/monitors";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { MonitorForm } from "./MonitorForm";

/**
 * Where you land after creating a monitor.
 *
 * Before: back to the list, staring at a "Pending" row, waiting for a first
 * result that appears somewhere off screen.
 * Now: straight to the monitor detail, where the first check result lands —
 * the green dot, the response time, the status code. That first green dot is
 * the whole point of the signup flow.
 *
 * Backend note: the API already queues a one-off check when a monitor is
 * created (routes/monitors.ts), so the detail page has something to show within
 * a second or two.
 */
export function MonitorCreate() {
  const navigate = useNavigate();
  const mutation = useCreateMonitor();

  return (
    <div>
      <PageHeader
        eyebrow="New monitor"
        title="Add Monitor"
        description="Paste a URL — everything else has a sensible default."
      />
      <MonitorForm
        loading={mutation.isPending}
        onSubmit={(data) =>
          mutation.mutate(data, {
            onSuccess: (res) => {
              toast.success("Monitor created — running first check");
              const id = res?.monitor?.id;
              navigate(id ? `/dashboard/monitors/${id}` : "/dashboard/monitors");
            },
            onError: (e) =>
              toast.error(e instanceof ApiError ? e.message : "Failed to create monitor"),
          })
        }
      />
      <div className="mt-4 max-w-xl">
        <Button variant="ghost" asChild>
          <Link to="/dashboard/monitors">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
