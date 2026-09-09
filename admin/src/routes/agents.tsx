import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, LoadingRows } from "@/components/states";
import { Initials } from "@/components/ticket-bits";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { listAgents, queryKeys } from "@/lib/mock/api";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agents — Relay Helpdesk" },
      { name: "description", content: "Workload and satisfaction scores across the support team." },
      { property: "og:title", content: "Agents — Relay Helpdesk" },
      {
        property: "og:description",
        content: "Workload and satisfaction scores across the support team.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["owner", "admin"]}>
      <AgentsPage />
    </RequireAuth>
  ),
});

function AgentsPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.agents,
    queryFn: listAgents,
  });

  return (
    <AppShell title="Agents" description="Team workload and performance">
      {isPending ? (
        <LoadingRows rows={4} />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-center gap-3">
                <Initials name={a.name} colorClass={a.avatarColor} className="size-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.title}</p>
                </div>
                <span className="ml-auto rounded-full bg-secondary px-2.5 py-0.5 text-xs capitalize text-secondary-foreground">
                  {a.role}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-xs text-muted-foreground">Assigned</dt>
                  <dd className="text-lg font-semibold">{a.assigned}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Open</dt>
                  <dd className="text-lg font-semibold">{a.open}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Resolved</dt>
                  <dd className="text-lg font-semibold">{a.resolved}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Satisfaction</span>
                  <span>{a.csat !== null ? `${a.csat}%` : "No ratings yet"}</span>
                </div>
                <Progress value={a.csat ?? 0} className="mt-2" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
