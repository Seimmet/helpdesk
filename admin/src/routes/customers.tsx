import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Initials } from "@/components/ticket-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listCustomers, queryKeys } from "@/lib/mock/api";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Relay Helpdesk" },
      { name: "description", content: "Browse customer accounts, plans and their ticket history." },
      { property: "og:title", content: "Customers — Relay Helpdesk" },
      {
        property: "og:description",
        content: "Browse customer accounts, plans and their ticket history.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["owner", "admin", "agent"]}>
      <CustomersPage />
    </RequireAuth>
  ),
});

function CustomersPage() {
  const [search, setSearch] = useState("");
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.customers(search),
    queryFn: () => listCustomers(search),
  });

  return (
    <AppShell title="Customers" description="Accounts raising tickets in this workspace">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1">
          <Card className="p-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Label htmlFor="customer-search" className="sr-only">
                Search customers
              </Label>
              <Input
                id="customer-search"
                className="pl-9"
                placeholder="Search by name, company or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Card>
        </div>
        <Button asChild>
          <Link to="/customers/new">
            <Plus className="mr-2 size-4" />
            New customer
          </Link>
        </Button>
      </div>

      {isPending ? (
        <LoadingRows rows={5} />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-5" aria-hidden="true" />}
          title="No customers found"
          description="Try a different search term."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-center gap-3">
                <Initials name={c.name} colorClass={c.avatarColor} className="size-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.company}</p>
                </div>
                <span className="ml-auto rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  {c.plan}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-xs text-muted-foreground">Tickets</dt>
                  <dd className="text-lg font-semibold">{c.ticketCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Open</dt>
                  <dd className="text-lg font-semibold">{c.openCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Since</dt>
                  <dd className="text-sm font-medium">{new Date(c.since).getFullYear()}</dd>
                </div>
              </dl>
              <p className="mt-4 truncate text-xs text-muted-foreground">
                {c.email} · {c.location}
              </p>
              <Link
                to="/tickets"
                className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
              >
                View tickets
              </Link>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
