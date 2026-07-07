import { Link } from "react-router-dom";
import { Plus, Globe, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStatusPages, useDeleteStatusPage } from "@/lib/queries/status-pages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LoadError } from "@/components/load-error";

function StatusPagesListSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="divide-y divide-border border-t border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3.5">
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-14 ml-auto" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusPagesList() {
  const { data: statusPages, isLoading, isError, refetch } = useStatusPages();
  const deleteMutation = useDeleteStatusPage();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Status page deleted"),
      onError: () => toast.error("Failed to delete status page"),
    });
  };

  if (isLoading) return <StatusPagesListSkeleton />;
  if (isError) return <LoadError onRetry={() => refetch()} />;

  return (
    <TooltipProvider>
      <div>
        <PageHeader
          eyebrow="Public pages"
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
          <div className="border-t border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Slug</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="hidden sm:table-cell">Domain</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusPages.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/10"
                          style={{ backgroundColor: sp.brandColor }}
                        />
                        <Link
                          to={`/dashboard/status-pages/${sp.id}`}
                          className="font-medium text-foreground hover:text-brand transition-colors"
                        >
                          {sp.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        /status/{sp.slug}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sp.isPublic ? "default" : "secondary"}
                        className="font-mono text-[10px] uppercase tracking-[0.12em]"
                      >
                        {sp.isPublic ? "Public" : "Private"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {sp.customDomain ? (
                        <span className="font-mono text-xs">{sp.customDomain}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                              <a
                                href={`/status/${sp.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="View live status page"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Live</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                              <Link
                                to={`/dashboard/status-pages/${sp.id}/edit`}
                                aria-label="Edit status page"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              aria-label="Delete status page"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title="Delete status page?"
                          description={`This will permanently delete "${sp.name}" and remove it from public access.`}
                          onConfirm={() => handleDelete(sp.id)}
                          destructive
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
