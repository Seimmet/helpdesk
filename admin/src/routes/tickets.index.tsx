import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Filter, Plus, Search, Ticket as TicketIcon, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Initials, PriorityBadge, StatusBadge, relativeTime } from "@/components/ticket-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { listAgents, listTickets, queryKeys, type TicketFilters } from "@/lib/mock/api";
import { categories } from "@/lib/mock/data";
import { useAuth } from "@/lib/providers";

export const Route = createFileRoute("/tickets/")({
  head: () => ({
    meta: [
      { title: "Tickets — Relay Helpdesk" },
      {
        name: "description",
        content: "Search, filter and triage every support ticket by status, priority and owner.",
      },
      { property: "og:title", content: "Tickets — Relay Helpdesk" },
      {
        property: "og:description",
        content: "Search, filter and triage every support ticket by status, priority and owner.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <TicketsPage />
    </RequireAuth>
  ),
});

function TicketsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketFilters["status"]>("all");
  const [priority, setPriority] = useState<TicketFilters["priority"]>("all");
  const [category, setCategory] = useState<string>("all");
  const [assignee, setAssignee] = useState<string>("all");
  const [sort, setSort] = useState<TicketFilters["sort"]>("newest");

  const filters = useMemo<TicketFilters>(
    () => ({
      search,
      status,
      priority,
      category,
      assignee,
      sort,

    }),
    [search, status, priority, category, assignee, sort, user?.role],
  );

  const { data: agents = [] } = useQuery({
    queryKey: queryKeys.agents,
    queryFn: listAgents,
  });

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.tickets(filters),
    queryFn: () => listTickets(filters),
  });

  const activeFilters =
    (status !== "all" ? 1 : 0) +
    (priority !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (assignee !== "all" ? 1 : 0);

  const clear = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setCategory("all");
    setAssignee("all");
    setSort("newest");
  };

  return (
    <AppShell
      title="Tickets"
      description="Every request across the workspace"
    >
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Label htmlFor="ticket-search" className="sr-only">
                Search tickets
              </Label>
              <Input
                id="ticket-search"
                placeholder="Search by reference, subject or tag…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button asChild className="sm:w-auto">
              <Link to="/tickets/new">
                <Plus className="size-4" aria-hidden="true" />
                New ticket
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect
              label="Status"
              value={status ?? "all"}
              onChange={(v) => setStatus(v as TicketFilters["status"])}
              options={["all", "open", "pending", "resolved", "closed"]}
            />
            <FilterSelect
              label="Priority"
              value={priority ?? "all"}
              onChange={(v) => setPriority(v as TicketFilters["priority"])}
              options={["all", "urgent", "high", "medium", "low"]}
            />
            <FilterSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={["all", ...categories]}
            />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Anyone</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FilterSelect
              label="Sort"
              value={sort ?? "newest"}
              onChange={(v) => setSort(v as TicketFilters["sort"])}
              options={["newest", "oldest", "priority"]}
            />
          </div>

          {activeFilters > 0 || search ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="size-3.5" aria-hidden="true" />
              {activeFilters} filter{activeFilters === 1 ? "" : "s"} active
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clear}>
                <X className="size-3.5" aria-hidden="true" />
                Clear
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {isPending ? (
        <LoadingRows rows={6} />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="size-5" aria-hidden="true" />}
          title="No tickets match these filters"
          description="Try widening the search or clearing a filter."
          action={
            <Button variant="outline" onClick={clear}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div aria-busy={isFetching}>
          <p className="mb-3 text-xs text-muted-foreground">
            {data.length} ticket{data.length === 1 ? "" : "s"}
          </p>
          <ul className="space-y-2">
            {data.map((t) => (
              <li key={t.id}>
                <Link
                  to="/tickets/$ticketId"
                  params={{ ticketId: t.id }}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 sm:flex-row sm:items-center"
                >
                  <Initials name={t.customer?.name ?? "?"} colorClass={t.customer?.avatarColor} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{t.reference}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{t.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.customer?.company} · {t.category} · {t.messageCount} message
                      {t.messageCount === 1 ? "" : "s"} · updated {relativeTime(t.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground md:inline">
                      {t.assignee?.name ?? "Unassigned"}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="capitalize">
              {o === "all" ? "All" : o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
