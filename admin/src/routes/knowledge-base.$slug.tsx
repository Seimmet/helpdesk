import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, LoadingRows } from "@/components/states";
import { Initials, relativeTime } from "@/components/ticket-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getArticle, markArticleHelpful, queryKeys } from "@/lib/mock/api";

export const Route = createFileRoute("/knowledge-base/$slug")({
  head: () => ({
    meta: [
      { title: "Article — Relay Helpdesk knowledge base" },
      { name: "description", content: "A support knowledge base article." },
      { property: "og:title", content: "Article — Relay Helpdesk knowledge base" },
      { property: "og:description", content: "A support knowledge base article." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ArticlePage />
    </RequireAuth>
  ),
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.article(slug),
    queryFn: () => getArticle(slug),
  });

  const helpful = useMutation({
    mutationFn: () => markArticleHelpful(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.article(slug) });
      qc.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Thanks for the feedback");
    },
  });

  return (
    <AppShell title={data?.article.title ?? "Article"} description={data?.article.category}>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/knowledge-base">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to knowledge base
        </Link>
      </Button>

      {isPending ? (
        <LoadingRows rows={3} />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <Card className="mx-auto max-w-3xl">
          <CardContent className="pt-6">
            <span className="text-xs font-medium text-primary">{data.article.category}</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{data.article.title}</h2>
            <div className="mt-4 flex items-center gap-3">
              <Initials
                name={data.author?.name ?? "?"}
                colorClass={data.author?.avatarColor}
                className="size-8"
              />
              <div>
                <p className="text-sm font-medium">{data.author?.name}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {relativeTime(data.article.updatedAt)} ·{" "}
                  {data.article.views.toLocaleString()} views
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-relaxed">
              {data.article.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl bg-muted p-4">
              <p className="text-sm">
                Was this helpful?{" "}
                <span className="text-muted-foreground">{data.article.helpful}% say yes</span>
              </p>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => helpful.mutate()}
                disabled={helpful.isPending}
              >
                <ThumbsUp className="size-4" aria-hidden="true" />
                Yes, thanks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
