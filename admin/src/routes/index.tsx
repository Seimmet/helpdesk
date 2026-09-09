import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertOctagon, CheckCircle2, Clock, Inbox, Smile } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, LoadingCards, LoadingRows } from "@/components/states";
import { Initials, PriorityBadge, StatusBadge, relativeTime } from "@/components/ticket-bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboard, queryKeys } from "@/lib/mock/api";
import { useAuth } from "@/lib/providers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Relay Helpdesk" },
      {
        name: "description",
        content: "Live support metrics: open tickets, SLA breaches, CSAT and recent activity.",
      },
      { property: "og:title", content: "Dashboard — Relay Helpdesk" },
      {
        property: "og:description",
        content: "Live support metrics: open tickets, SLA breaches, CSAT and recent activity.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

const statusColors: Record<string, string> = {
  open: "var(--chart-2)",
  pending: "var(--chart-5)",
  resolved: "var(--primary)",
  closed: "var(--muted-foreground)",
};

function DashboardPage() {
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboard,
  });

  return (
    <AppShell
      title={`Good morning, ${user?.name.split(" ")[0]}`}
      description="Here's how the queue is looking today."
    >
      {isPending ? (
        <div className="space-y-6">
          <LoadingCards />
          <LoadingRows rows={4} />
        </div>
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Inbox className="size-4" aria-hidden="true" />}
              label="Open tickets"
              value={data.stats.open}
              hint={`${data.stats.pending} awaiting customer`}
            />
            <StatCard
              icon={<AlertOctagon className="size-4" aria-hidden="true" />}
              label="SLA breached"
              value={data.stats.breached}
              hint="Past the response window"
              tone="danger"
            />
            <StatCard
              icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
              label="Resolved"
              value={data.stats.resolved}
              hint="Last 30 days"
            />
            <StatCard
              icon={<Smile className="size-4" aria-hidden="true" />}
              label="CSAT"
              value={`${data.stats.csat}%`}
              hint={`First response ${data.stats.firstResponse}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Created vs resolved</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.volume} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="var(--chart-2)"
                      fill="url(#gCreated)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="var(--primary)"
                      fill="url(#gResolved)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">By status</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byStatus}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {data.byStatus.map((s) => (
                        <Cell key={s.status} fill={statusColors[s.status]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="-mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {data.byStatus.map((s) => (
                    <li key={s.status} className="flex items-center gap-1.5 capitalize">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: statusColors[s.status] }}
                        aria-hidden="true"
                      />
                      {s.status} ({s.count})
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold">Latest tickets</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/tickets">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.recent.length === 0 ? (
                  <EmptyState title="No tickets yet" description="New requests will appear here." />
                ) : (
                  <ul className="divide-y divide-border">
                    {data.recent.map((t) => (
                      <li key={t.id}>
                        <Link
                          to="/tickets/$ticketId"
                          params={{ ticketId: t.id }}
                          className="flex items-center gap-3 py-3 transition-colors hover:bg-accent/40"
                        >
                          <Initials
                            name={t.customer?.name ?? "Unknown"}
                            colorClass={t.customer?.avatarColor}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{t.subject}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t.reference} · {t.customer?.company} · {relativeTime(t.createdAt)}
                            </p>
                          </div>
                          <PriorityBadge priority={t.priority} className="hidden sm:inline-flex" />
                          <StatusBadge status={t.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Team activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {data.activity.map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <Initials
                        name={a.user?.name ?? "?"}
                        colorClass={a.user?.avatarColor}
                        className="size-8"
                      />
                      <div className="min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{a.user?.name}</span>{" "}
                          <span className="text-muted-foreground">{a.what}</span>
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" aria-hidden="true" />
                          {relativeTime(a.when)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint: string;
  tone?: "danger";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span
            className={
              tone === "danger"
                ? "grid size-8 place-items-center rounded-lg bg-destructive/10 text-destructive"
                : "grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"
            }
          >
            {icon}
          </span>
        </div>
        <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
