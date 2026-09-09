import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTicket, listAgents, listCategories, listCustomers, queryKeys } from "@/lib/mock/api";
import { categories, type TicketPriority } from "@/lib/mock/data";

export const Route = createFileRoute("/tickets/new")({
  head: () => ({
    meta: [
      { title: "New ticket — Relay Helpdesk" },
      { name: "description", content: "Raise a new support ticket with priority, category and owner." },
      { property: "og:title", content: "New ticket — Relay Helpdesk" },
      {
        property: "og:description",
        content: "Raise a new support ticket with priority, category and owner.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NewTicketPage />
    </RequireAuth>
  ),
});

function NewTicketPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [category, setCategory] = useState(categories[0] ?? "");
  const { data: apiCategories = [] } = useQuery({ queryKey: ["ticket-categories"], queryFn: listCategories });
  const { data: customers = [] } = useQuery({ queryKey: queryKeys.customers(""), queryFn: () => listCustomers("") });
  const { data: agents = [] } = useQuery({ queryKey: queryKeys.agents, queryFn: listAgents });
  const [customerId, setCustomerId] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`${ticket.reference} created`);
      navigate({ to: "/tickets/$ticketId", params: { ticketId: ticket.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create the ticket"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (subject.trim().length < 6) next.subject = "Give the ticket a subject of at least 6 characters.";
    if (description.trim().length < 15)
      next.description = "Add a little more detail — at least 15 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    mutation.mutate({
      subject: subject.trim(),
      description: description.trim(),
      priority,
      category,
      customerId: customerId || customers[0]?.id || "",
      assigneeId: assigneeId === "unassigned" ? null : assigneeId,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <AppShell title="New ticket" description="Log a request on behalf of a customer">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/tickets">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to tickets
        </Link>
      </Button>

      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                aria-invalid={!!errors.subject}
                aria-describedby={errors.subject ? "subject-error" : undefined}
                placeholder="Short summary of the problem"
              />
              {errors.subject ? (
                <p id="subject-error" role="alert" className="text-xs text-destructive">
                  {errors.subject}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? "description-error" : undefined}
                placeholder="What happened, what was expected, and any steps to reproduce."
              />
              {errors.description ? (
                <p id="description-error" role="alert" className="text-xs text-destructive">
                  {errors.description}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="billing, refund (comma separated)"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
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

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(apiCategories.length ? apiCategories.map((c) => c.name) : categories).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {true ? (
              <>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} — {c.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assign to</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
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
              </>
            ) : (
              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                Your request goes straight to the support queue and an agent will pick it up.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {mutation.isPending ? "Creating…" : "Create ticket"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </AppShell>
  );
}
