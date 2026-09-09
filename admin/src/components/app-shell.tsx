import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Initials } from "@/components/ticket-bits";
import { useAuth, useTheme } from "@/lib/providers";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Ticket;
  roles?: Array<"owner" | "admin" | "agent">;
};

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/customers", label: "Customers", icon: Building2, roles: ["owner", "admin", "agent"] },
  { to: "/agents", label: "Agents", icon: Users, roles: ["owner", "admin"] },
  { to: "/knowledge-base", label: "Knowledge base", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["owner", "admin"] },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {navItems
        .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
        .map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-1 py-1">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <LifeBuoy className="size-4" aria-hidden="true" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Relay Helpdesk</span>
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-accent"
          aria-label="Account menu"
        >
          <Initials name={user.name} colorClass={user.avatarColor} className="size-8" />
          <span className="hidden text-sm font-medium sm:inline">{user.name.split(" ")[0]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
          <div className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium capitalize text-secondary-foreground">
            {user.role}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
          <UserRound className="size-4" aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
          <Settings className="size-4" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1">
          <NavLinks />
        </div>
        <div className="rounded-xl bg-sidebar-accent/60 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo workspace</p>
          <p className="mt-1">All data is local to this browser — nothing is sent anywhere.</p>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand />
                <div className="mt-6">
                  <NavLinks onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
              {description ? (
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/tickets/new">
                  <Plus className="size-4" aria-hidden="true" />
                  New ticket
                </Link>
              </Button>
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        <main id="main" className="px-4 py-6 sm:px-6 lg:py-8">
          {actions ? <div className="mb-6">{actions}</div> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
