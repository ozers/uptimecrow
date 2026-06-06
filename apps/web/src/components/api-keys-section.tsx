import { useState } from "react";
import { Key, Copy, Check, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/lib/queries/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { RelativeTime } from "@/components/relative-time";

function SectionLabel({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
    </div>
  );
}

interface Props {
  enabled: boolean;
}

export function ApiKeysSection({ enabled }: Props) {
  const { data: keys, isLoading } = useApiKeys();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();

  const [name, setName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const res = await create.mutateAsync(name.trim());
      setRevealedKey(res.key);
      setName("");
      setCreateOpen(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create key");
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleRevoke = async (id: string, keyName: string) => {
    if (!confirm(`Revoke "${keyName}"? Any integration using it will stop working immediately.`)) return;
    try {
      await revoke.mutateAsync(id);
      toast.success("Key revoked");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to revoke key");
    }
  };

  return (
    <div>
      <SectionLabel icon={Key} title="API Keys" />
      <div className="border-t border-b border-border">
        {!enabled ? (
          <div className="py-6">
            <p className="text-sm text-muted-foreground">
              API access is available on the <span className="font-medium text-foreground">Indie</span> plan and above.
              Upgrade to programmatically manage monitors, incidents, and status pages.
            </p>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="py-3 text-xs text-muted-foreground">Loading keys…</div>
            ) : !keys?.length ? (
              <div className="py-4">
                <p className="mb-3 text-xs text-muted-foreground">
                  No keys yet. Create one to authenticate API requests with
                  {" "}<code className="rounded bg-muted px-1 py-0.5 text-[11px]">Authorization: Bearer &lt;key&gt;</code>.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {keys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{k.name}</span>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {k.prefix}…
                        </code>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Created <RelativeTime date={k.createdAt} />
                        {k.lastUsedAt && (
                          <> · Last used <RelativeTime date={k.lastUsedAt} /></>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(k.id, k.name)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Revoke ${k.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="py-3">
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                New API Key
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setName(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                placeholder="CI deploy hook"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Helps you identify the key later. You'll see the full secret only once.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revealedKey !== null} onOpenChange={(o) => { if (!o) setRevealedKey(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Copy this key now. We won't show it again — if you lose it, revoke it and create a new one.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded border border-border bg-muted px-3 py-2 text-xs">
                {revealedKey}
              </code>
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-success-foreground" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
