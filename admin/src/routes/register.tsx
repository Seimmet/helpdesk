import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerOrganization } from "@/lib/mock/api";
import { useAuth } from "@/lib/providers";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setPending(true);
    try {
      const result = await registerOrganization({ organizationName, name, email, password, websiteUrl: websiteUrl || undefined, supportEmail: supportEmail || undefined, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos" });
      toast.success(`Welcome to ${result.organization.name}`);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally { setPending(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><LifeBuoy className="size-5" /></span>
          <span className="text-lg font-semibold">Relay Helpdesk</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your organization</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">This creates the organization and its first owner account.</p>
        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <div className="space-y-2"><Label htmlFor="organizationName">Organization name</Label><Input id="organizationName" value={organizationName} onChange={e => setOrganizationName(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="name">Your name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="websiteUrl">Website URL <span className="text-muted-foreground">(optional)</span></Label><Input id="websiteUrl" type="url" placeholder="https://example.com" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="supportEmail">Support email <span className="text-muted-foreground">(optional)</span></Label><Input id="supportEmail" type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} /></div>
          {error ? <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : null}{pending ? "Creating…" : "Create organization"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
