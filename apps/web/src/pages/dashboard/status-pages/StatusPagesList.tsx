import { Link } from "react-router-dom";
import { Plus, Globe, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useStatusPages, useDeleteStatusPage } from "@/lib/queries/status-pages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingPage } from "@/components/loading-page";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function StatusPagesList() {
  const { data: statusPages, isLoading } = useStatusPages();
  const deleteMutation = useDeleteStatusPage();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Status page deleted"),
      onError: () => toast.error("Failed to delete status page"),
    });
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div>
      <PageHeader
        title="Status Pages"
        description="Public status pages for your services"
        action={
          <Button asChild>
            <Link to="/dashboard/status-pages/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Status Page
            </Link>
          </Button>
        }
      />

      {!statusPages?.length ? (
        <EmptyState
          icon={Globe}
          title="No status pages"
          description="Create a status page to share service status with your users"
          action={
            <Button asChild>
              <Link to="/dashboard/status-pages/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Status Page
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {statusPages.map((sp) => (
            <Card key={sp.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">
                    <Link
                      to={`/dashboard/status-pages/${sp.id}`}
                      className="hover:text-primary"
                    >
                      {sp.name}
                    </Link>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">/{sp.slug}</p>
                </div>
                <div
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: sp.brandColor }}
                />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={sp.isPublic ? "default" : "secondary"}>
                    {sp.isPublic ? "Public" : "Private"}
                  </Badge>
                  {sp.customDomain && (
                    <span className="text-xs text-muted-foreground">{sp.customDomain}</span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/status/${sp.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View Live
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/dashboard/status-pages/${sp.id}/edit`}>Edit</Link>
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="text-destructive">
                        Delete
                      </Button>
                    }
                    title="Delete status page?"
                    description={`This will permanently delete "${sp.name}" and remove it from public access.`}
                    onConfirm={() => handleDelete(sp.id)}
                    destructive
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
