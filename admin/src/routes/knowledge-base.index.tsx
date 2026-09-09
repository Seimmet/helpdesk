import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { relativeTime } from "@/components/ticket-bits";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { listArticles, queryKeys } from "@/lib/mock/api";
import { categories } from "@/lib/mock/data";

export const Route = createFileRoute("/knowledge-base/")({
  head: () => ({
    meta: [
      { title: "Knowledge base — Relay Helpdesk" },
      { name: "description", content: "Self-serve articles on billing, access, integrations and onboarding." },
      { property: "og:title", content: "Knowledge base — Relay Helpdesk" },
      {
        property: "og:description",
        content: "Self-serve articles on billing, access, integrations and onboarding.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <KnowledgeBasePage />
    </RequireAuth>
  ),
});

function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.articles(search, category),
    queryFn: () => listArticles(search, category),
  });

  return (
    <AppShell title="Knowledge base" description="Answers agents and customers can self-serve">
      <Card className="mb-6 space-y-4 p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Label htmlFor="kb-search" className="sr-only">
            Search articles
          </Label>
          <Input
            id="kb-search"
            className="pl-9"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", ...categories].map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className="capitalize"
            >
              {c === "all" ? "All topics" : c}
            </Button>
          ))}
        </div>
      </Card>

      {isPending ? (
        <LoadingRows rows={4} />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-5" aria-hidden="true" />}
          title="No articles match"
          description="Try another search term or topic."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Reset
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((a) => (
            <Link
              key={a.id}
              to="/knowledge-base/$slug"
              params={{ slug: a.slug }}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <span className="text-xs font-medium text-primary">{a.category}</span>
              <h2 className="mt-1.5 text-base font-semibold">{a.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{a.excerpt}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                Updated {relativeTime(a.updatedAt)} · {a.views.toLocaleString()} views · {a.helpful}%
                found it helpful
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
