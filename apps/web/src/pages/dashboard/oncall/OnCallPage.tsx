import { useState } from "react";
import { Phone, Mail, Plus, Trash2, Edit2, Bell, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useOnCall, useAddContact, useDeleteContact, useUpsertSchedule, useUpdateContact } from "@/lib/queries/oncall";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";

function nextRotationDate(rotationDays: number, currentIndex: number, totalContacts: number): Date {
  const periodMs = rotationDays * 86_400_000;
  const currentPeriodStart = Math.floor(Date.now() / periodMs) * periodMs;
  return new Date(currentPeriodStart + periodMs);
}

export function OnCallPage() {
  const { data, isLoading } = useOnCall();
  const addContact = useAddContact();
  const deleteContact = useDeleteContact();
  const upsertSchedule = useUpsertSchedule();
  const updateContact = useUpdateContact();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await addContact.mutateAsync({ name: newName.trim(), email: newEmail.trim() || undefined, phone: newPhone.trim() || undefined });
      setNewName(""); setNewEmail(""); setNewPhone("");
      setShowForm(false);
      toast.success("Contact added to rotation");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to add contact");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact.mutateAsync(id);
      toast.success("Contact removed");
    } catch {
      toast.error("Failed to remove contact");
    }
  };

  const handleUpdateRotation = async (days: number) => {
    try {
      await upsertSchedule.mutateAsync({ rotationDays: days });
      toast.success("Rotation period updated");
    } catch {
      toast.error("Failed to update rotation");
    }
  };

  const handleSavePhone = async (id: string) => {
    try {
      await updateContact.mutateAsync({ id, phone: editPhone || undefined });
      setEditingId(null);
      toast.success("Phone updated");
    } catch {
      toast.error("Failed to update phone");
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="On-Call" description="Manage your on-call rotation" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  const { schedule, contacts, current } = data ?? { schedule: null, contacts: [], current: null };

  return (
    <div>
      <PageHeader
        title="On-Call"
        description="Rotate who gets paged when an incident fires"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        }
      />

      {/* Current on-call */}
      {current && (
        <div className="mb-6 rounded-xl border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-success-foreground" />
            <span className="text-sm font-semibold text-success-foreground">Currently On-Call</span>
          </div>
          <p className="text-base font-medium">{current.name}</p>
          <div className="mt-1 flex flex-wrap gap-3">
            {current.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{current.email}</span>}
            {current.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{current.phone}</span>}
          </div>
          {schedule && contacts.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Rotates in {Math.ceil((Math.floor(Date.now() / (schedule.rotationDays * 86_400_000) + 1) * schedule.rotationDays * 86_400_000 - Date.now()) / 86_400_000)} day(s)
            </p>
          )}
        </div>
      )}

      {/* Rotation settings */}
      {schedule && (
        <div className="mb-6 flex items-center gap-4 rounded-lg border border-border bg-muted/20 p-3">
          <RotateCcw className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Rotation every</span>
          <Select
            value={String(schedule.rotationDays)}
            onValueChange={(v) => handleUpdateRotation(Number(v))}
          >
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 7, 14, 30].map((d) => (
                <SelectItem key={d} value={String(d)}>{d} day{d !== 1 ? "s" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{contacts.length} contact{contacts.length !== 1 ? "s" : ""} in rotation</span>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-border p-4 space-y-4">
          <h3 className="text-sm font-semibold">New On-Call Contact</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="oc-name" className="text-xs">Name *</Label>
              <Input id="oc-name" placeholder="Alice" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="oc-email" className="text-xs">Email</Label>
              <Input id="oc-email" placeholder="alice@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="oc-phone" className="text-xs">Phone (for SMS)</Label>
              <Input id="oc-phone" placeholder="+15551234567" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || addContact.isPending}>
              Add to rotation
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Contacts list */}
      {contacts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Phone className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No on-call contacts yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add team members to rotate who gets paged on incidents.</p>
        </div>
      ) : (
        <div className="divide-y divide-border border-t border-border">
          {contacts.map((contact, idx) => (
            <div key={contact.id} className="flex items-center gap-4 py-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-mono text-muted-foreground">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{contact.name}</span>
                  {current?.id === contact.id && (
                    <Badge className="text-[10px] h-4 bg-success/15 text-success-foreground border-success/30">on-call</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-0.5">
                  {contact.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{contact.email}</span>}
                  {editingId === contact.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-6 text-xs w-36"
                        placeholder="+15551234567"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSavePhone(contact.id)}
                        autoFocus
                      />
                      <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleSavePhone(contact.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingId(null)}>✕</Button>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { setEditingId(contact.id); setEditPhone(contact.phone ?? ""); }}
                    >
                      <Phone className="h-3 w-3" />
                      {contact.phone ?? <span className="text-muted-foreground/50 italic">add phone</span>}
                      <Edit2 className="h-2.5 w-2.5 ml-0.5 opacity-0 group-hover:opacity-100" />
                    </button>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive"
                onClick={() => handleDelete(contact.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        SMS alerts require Twilio to be configured in{" "}
        <a href="/dashboard/settings" className="text-primary hover:underline">Settings → Integrations</a>.
      </p>
    </div>
  );
}
