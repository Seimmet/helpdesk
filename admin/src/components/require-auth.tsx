import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/providers";
import { LoadingCards, EmptyState } from "@/components/states";
import type { Role } from "@/lib/mock/data";

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !user) navigate({ to: "/login", replace: true });
  }, [ready, user, navigate]);
  if (!ready || !user) return <div className="min-h-screen bg-background p-8"><LoadingCards /></div>;
  if (roles && !roles.includes(user.role)) return <div className="p-6"><EmptyState icon={<ShieldAlert className="size-5" aria-hidden="true" />} title="You don't have access to this page" description={`This area is limited to ${roles.join(" and ")} accounts. You're signed in as ${user.role}.`} /></div>;
  return <>{children}</>;
}
