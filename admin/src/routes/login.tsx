import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LifeBuoy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/providers";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Relay Helpdesk" },
      { name: "description", content: "Sign in to the Relay Helpdesk support workspace." },
      { property: "og:title", content: "Sign in — Relay Helpdesk" },
      { property: "og:description", content: "Sign in to the Relay Helpdesk support workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const u = await signIn(email, password);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <LifeBuoy className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Relay Helpdesk</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Every conversation, in one calm queue.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Triage by priority, keep SLA breaches visible, and hand off with the full history intact.
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-4">
            {[
              ["22m", "First response"],
              ["94%", "CSAT"],
              ["18", "Live tickets"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-2xl font-semibold text-primary">{value}</dt>
                <dd className="text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="text-xs text-muted-foreground">Your workspace is securely connected to the Helpdesk API.</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your support workspace.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New organization? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
