import { Link, useParams } from "react-router-dom";
import { ExternalLink, Pencil, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useStatusPage } from "@/lib/queries/status-pages";
import { useSubscribers, useDeleteSubscriber } from "@/lib/queries/subscribers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading-page";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RelativeTime } from "@/components/relative-time";

export function StatusPageDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: statusPage, isLoading } = useStatusPage(id!);
  const { data: subscribers } = useSubscribers(id!);
  const deleteSubscriber = useDeleteSubscriber(id!);

  if (isLoading) return <LoadingPage />;
  if (!statusPage) return <p className="text-muted-foreground">Status page not found</p>;

  return (
    <div>
      <PageHeader
        title={statusPage.name}
        description={`/status/${statusPage.slug}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/status/${statusPage.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/status-pages/${statusPage.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Slug</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{statusPage.slug}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusPage.isPublic ? "default" : "secondary"}>
              {statusPage.isPublic ? "Public" : "Private"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Brand Color
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className="h-5 w-5 rounded-full border border-border"
                style={{ backgroundColor: statusPage.brandColor }}
              />
              <span className="font-mono text-sm">{statusPage.brandColor}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subscribers?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers">
            <Mail className="mr-2 h-4 w-4" />
            Subscribers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="subscribers">
          <Card>
            <CardContent className="pt-6">
              {subscribers && subscribers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              sub.isVerified
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                            }
                          >
                            {sub.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <RelativeTime date={sub.createdAt} />
                        </TableCell>
                        <TableCell>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title="Remove subscriber?"
                            description={`This will remove ${sub.email} from notifications.`}
                            onConfirm={() =>
                              deleteSubscriber.mutate(sub.id, {
                                onSuccess: () => toast.success("Subscriber removed"),
                              })
                            }
                            destructive
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No subscribers yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
