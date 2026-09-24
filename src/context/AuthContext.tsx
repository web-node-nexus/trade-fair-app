import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dashboardPathForRoles } from "@/lib/dashboardDestination";
import { buildDashboardNavItems } from "@/lib/dashboardNav";
import type { AuthMe } from "@/lib/adminAccess";
import { apiJson } from "@/lib/authFetch";
import { clearAuthTokens, hasAccessToken, persistAuthTokens } from "@/lib/authStorage";

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  roles: string[];
};

export type AuthProfile = AuthMe & {
  organizerKycApproved?: boolean;
  subscriptionByRole?: Record<
    string,
    { active: boolean; premiumActive: boolean; planName?: string; endsAt?: string }
  >;
};

type AuthContextValue = {
  ready: boolean;
  user: AuthUser | null;
  profile: AuthProfile | null;
  workspaces: ReturnType<typeof buildDashboardNavItems>;
  primaryDashboard: string;
  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (phone: string, otp: string) => Promise<void>;
  register: (body: Record<string, string | boolean | string[]>) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const refreshMe = useCallback(async () => {
    const loggedIn = await hasAccessToken();
    if (!loggedIn) {
      setUser(null);
      setProfile(null);
      return;
    }
    try {
      const me = await apiJson<{
        id: string;
        email: string;
        fullName?: string | null;
        phone?: string | null;
        roles?: string[];
        permissions?: string[];
        subAdminScopes?: string[];
        organizerKycApproved?: boolean;
        subscriptionByRole?: AuthProfile["subscriptionByRole"];
      }>("/auth/me");
      setUser({
        id: me.id,
        email: me.email,
        fullName: me.fullName,
        phone: me.phone,
        roles: me.roles ?? [],
      });
      setProfile({
        roles: me.roles ?? [],
        permissions: me.permissions ?? [],
        subAdminScopes: me.subAdminScopes,
        organizerKycApproved: me.organizerKycApproved,
        subscriptionByRole: me.subscriptionByRole,
      });
    } catch {
      await clearAuthTokens();
      setUser(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshMe();
      setReady(true);
    })();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiJson<{
      accessToken?: string;
      refreshToken?: string;
      user?: { roles?: string[] };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    await persistAuthTokens(data.accessToken, data.refreshToken);
    await refreshMe();
  }, [refreshMe]);

  const loginWithOtp = useCallback(async (phone: string, otp: string) => {
    const data = await apiJson<{
      accessToken?: string;
      refreshToken?: string;
    }>("/auth/otp/login", {
      method: "POST",
      body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
    });
    await persistAuthTokens(data.accessToken, data.refreshToken);
    await refreshMe();
  }, [refreshMe]);

  const register = useCallback(
    async (body: Record<string, string | boolean | string[]>) => {
      const data = await apiJson<{
        accessToken?: string;
        refreshToken?: string;
        user?: { roles?: string[] };
      }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await persistAuthTokens(data.accessToken, data.refreshToken);
      await refreshMe();
    },
    [refreshMe]
  );

  const logout = useCallback(async () => {
    try {
      await apiJson("/auth/logout", { method: "POST", body: "{}" });
    } catch {
      /* ignore */
    }
    await clearAuthTokens();
    setUser(null);
    setProfile(null);
  }, []);

  const workspaces = useMemo(() => buildDashboardNavItems(user?.roles), [user?.roles]);
  const primaryDashboard = useMemo(
    () => dashboardPathForRoles(user?.roles),
    [user?.roles]
  );

  const value = useMemo(
    () => ({
      ready,
      user,
      profile,
      workspaces,
      primaryDashboard,
      login,
      loginWithOtp,
      register,
      logout,
      refreshMe,
    }),
    [ready, user, profile, workspaces, primaryDashboard, login, loginWithOtp, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
