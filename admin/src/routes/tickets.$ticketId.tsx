import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, LoadingRows } from "@/components/states";
import { Initials, PriorityBadge, StatusBadge, relativeTime } from "@/components/ticket-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { addMessage, deleteTicket, getTicket, listAgents, queryKeys, updateTicket } from "@/lib/mock/api";
import { type TicketPriority, type TicketStatus } from "@/lib/mock/data";
import { useAuth } from "@/lib/providers";

export const Route = createFileRoute("/tickets/$ticketId")({
  head: () => ({
    meta: [
      { title: "Ticket detail — Relay Helpdesk" },
      { name: "description", content: "Full conversation, properties and history for a support ticket." },
      { property: "og:title", content: "Ticket detail — Relay Helpdesk" },
      {
        property: "og:description",
        content: "Full conversation, properties and history for a support ticket.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <TicketDetailPage />
    </RequireAuth>
  ),
});

function TicketDetailPage() {
  const { ticketId } = Route.useParams();
  const { user, can } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.ticket(ticketId),
    queryFn: () => getTicket(ticketId),
  });
  const { data: agents = [] } = useQuery({
    queryKey: queryKeys.agents,
    queryFn: listAgents,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) });
    qc.invalidateQueries({ queryKey: ["tickets"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const patch = useMutation({
    mutationFn: (p: Parameters<typeof updateTicket>[1]) => updateTicket(ticketId, p),
    onSuccess: () => {
      invalidate();
      toast.success("Ticket updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const send = useMutation({
    mutationFn: () =>
      addMessage({
        ticketId,
        authorId: user!.id,
        authorKind: "agent",
        body: reply.trim(),
        internal,
      }),
    onSuccess: () => {
      setReply("");
      setInternal(false);
      invalidate();
      toast.success("Reply added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send the reply"),
  });

  const remove = useMutation({
    mutationFn: () => deleteTicket(ticketId),
    onSuccess: () => {
      invalidate();
      toast.success("Ticket deleted");
      navigate({ to: "/tickets" });
    },
  });

  return (
    <AppShell
      title={data?.ticket.subject ?? "Ticket"}
      description={data ? `${data.ticket.reference} · ${data.ticket.category}` : undefined}
    >
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/tickets">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to tickets
        </Link>
      </Button>

      {isPending ? (
        <LoadingRows rows={5} />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader className="flex-row flex-wrap items-center gap-2 space-y-0">
                <StatusBadge status={data.ticket.status} />
                <PriorityBadge priority={data.ticket.priority} />
                {data.ticket.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </CardHeader>
              <CardContent>
                <h2 className="text-lg font-semibold">{data.ticket.subject}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Opened {relativeTime(data.ticket.createdAt)} by {data.ticket.customer?.name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.messages.map((m) => {
                  const author = m.author ?? (m.authorKind === "customer" ? data.ticket.customer : undefined);
                  return (
                    <article
                      key={m.id}
                      className={
                        m.internal
                          ? "rounded-xl border border-chart-5/40 bg-chart-5/10 p-4"
                          : "rounded-xl border border-border p-4"
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Initials
                          name={author?.name ?? "Unknown"}
                          colorClass={author?.avatarColor}
                          className="size-8"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{author?.name ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.authorKind === "agent" ? "Agent" : m.authorKind === "ai" ? "AI" : "Customer"} ·{" "}
                            {relativeTime(m.createdAt)}
                          </p>
                        </div>
                        {m.internal ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-chart-5">
                            <Lock className="size-3" aria-hidden="true" />
                            Internal
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{m.body}</p>
                    </article>
                  );
                })}

                <Separator />

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (reply.trim().length < 2) {
                      toast.error("Write a reply before sending.");
                      return;
                    }
                    send.mutate();
                  }}
                  className="space-y-3"
                >
                  <Label htmlFor="reply">Reply</Label>
                  <Textarea
                    id="reply"
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={internal ? "Visible to your team only…" : "Write a reply…"}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {true ? (
                      <div className="flex items-center gap-2">
                        <Switch id="internal" checked={internal} onCheckedChange={setInternal} />
                        <Label htmlFor="internal" className="text-sm font-normal">
                          Internal note
                        </Label>
                      </div>
                    ) : (
                      <span />
                    )}
                    <Button type="submit" disabled={send.isPending}>
                      {send.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="size-4" aria-hidden="true" />
                      )}
                      Send reply
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={data.ticket.status}
                    disabled={!can("edit_ticket") || patch.isPending}
                    onValueChange={(v) => patch.mutate({ status: v as TicketStatus })}
                  >
                    <SelectTrigger className="w-full capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["open", "pending", "resolved", "closed"].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select
                    value={data.ticket.priority}
                    disabled={!can("edit_ticket") || patch.isPending}
                    onValueChange={(v) => patch.mutate({ priority: v as TicketPriority })}
                  >
                    <SelectTrigger className="w-full capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["urgent", "high", "medium", "low"].map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Assignee</Label>
                  <Select
                    value={data.ticket.assigneeId ?? "unassigned"}
                    disabled={!can("edit_ticket") || patch.isPending}
                    onValueChange={(v) =>
                      patch.mutate({ assigneeId: v === "unassigned" ? null : v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!can("edit_ticket") ? (
                  <p className="text-xs text-muted-foreground">
                    Only agents and admins can change ticket properties.
                  </p>
                ) : null}

                <Separator />

                <dl className="space-y-2 text-sm">
                  <Row label="Reference" value={data.ticket.reference} />
                  <Row label="Category" value={data.ticket.category} />
                  <Row label="Due" value={new Date(data.ticket.dueAt).toLocaleDateString()} />
                  <Row label="Updated" value={relativeTime(data.ticket.updatedAt)} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Initials
                    name={data.ticket.customer?.name ?? "?"}
                    colorClass={data.ticket.customer?.avatarColor}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{data.ticket.customer?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {data.ticket.customer?.email}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Company" value={data.ticket.customer?.company ?? "—"} />
                  <Row label="Plan" value={data.ticket.customer?.plan ?? "—"} />
                  <Row label="Location" value={data.ticket.customer?.location ?? "—"} />
                </dl>
              </CardContent>
            </Card>

            {can("delete_ticket") ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-destructive">
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete ticket
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {data.ticket.reference}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the ticket and its conversation from this demo workspace.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove.mutate()}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{value}</dd>
    </div>
  );
}
