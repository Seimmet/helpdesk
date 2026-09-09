import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getCurrentUser, signIn as apiSignIn, signOut as apiSignOut, type SessionUser } from "./mock/api";
import type { Role } from "./mock/data";

/* ---------------------------------- theme --------------------------------- */
type Theme = "light" | "dark";
const THEME_KEY = "helpdesk.theme";
type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };
const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setThemeState(stored ?? (prefersDark ? "dark" : "light"));
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    window.localStorage.setItem(THEME_KEY, t);
  }, []);
  const value = useMemo(() => ({ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const ctx = useContext(ThemeContext); if (!ctx) throw new Error("useTheme must be used inside ThemeProvider"); return ctx; }

/* ---------------------------------- auth ---------------------------------- */
type AuthCtx = {
  user: SessionUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<SessionUser>) => void;
  can: (action: "manage_agents" | "manage_settings" | "edit_ticket" | "delete_ticket") => boolean;
};
const AuthContext = createContext<AuthCtx | null>(null);
const SESSION_KEY = "helpdesk.session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const token = window.localStorage.getItem("helpdesk.token");
      if (!token) { if (active) setReady(true); return; }
      try {
        const current = await getCurrentUser();
        if (active) {
          setUser(current);
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(current));
        }
      } catch {
        window.localStorage.removeItem("helpdesk.token");
        window.localStorage.removeItem(SESSION_KEY);
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    };
    hydrate();
    return () => { active = false; };
  }, []);

  const persist = useCallback((u: SessionUser | null) => {
    setUser(u);
    if (u) window.localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user,
    ready,
    signIn: async (email, password) => { const u = await apiSignIn(email, password); persist(u); return u; },
    signOut: async () => { await apiSignOut(); persist(null); },
    updateProfile: (patch) => { if (user) persist({ ...user, ...patch }); },
    can: (action) => {
      if (!user) return false;
      if (user.role === "owner") return true;
      if (user.role === "admin") return action !== "manage_settings" || true;
      return action === "edit_ticket";
    },
  }), [user, ready, persist]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error("useAuth must be used inside AuthProvider"); return ctx; }
