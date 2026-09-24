import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  bottomTabsForHub,
  drawerItemsForHub,
  hubPathFromPathname,
  isWorkspaceDetailRoute,
  workspaceMeta,
  type WorkspaceHubPath,
} from "@/lib/workspaceNav";
import type { FeatureItem } from "@/lib/roleFeatures";

type WorkspaceNavContextValue = {
  hubPath: WorkspaceHubPath | null;
  active: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  bottomTabs: FeatureItem[];
  drawerItems: FeatureItem[];
  isDetailRoute: boolean;
  meta: ReturnType<typeof workspaceMeta> | null;
};

const WorkspaceNavContext = createContext<WorkspaceNavContextValue | null>(null);

export function WorkspaceNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hubPath = useMemo(() => hubPathFromPathname(pathname), [pathname]);

  const bottomTabs = useMemo(
    () => (hubPath ? bottomTabsForHub(hubPath, profile) : []),
    [hubPath, profile]
  );

  const drawerItems = useMemo(
    () => (hubPath ? drawerItemsForHub(hubPath, profile) : []),
    [hubPath, profile]
  );

  const isDetailRoute = useMemo(
    () => (hubPath ? isWorkspaceDetailRoute(pathname, hubPath) : false),
    [hubPath, pathname]
  );

  const meta = useMemo(() => (hubPath ? workspaceMeta(hubPath) : null), [hubPath]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  const value = useMemo(
    () => ({
      hubPath,
      active: Boolean(hubPath),
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      bottomTabs,
      drawerItems,
      isDetailRoute,
      meta,
    }),
    [
      hubPath,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      bottomTabs,
      drawerItems,
      isDetailRoute,
      meta,
    ]
  );

  return <WorkspaceNavContext.Provider value={value}>{children}</WorkspaceNavContext.Provider>;
}

export function useWorkspaceNav() {
  const ctx = useContext(WorkspaceNavContext);
  if (!ctx) throw new Error("useWorkspaceNav must be used within WorkspaceNavProvider");
  return ctx;
}

export function useWorkspaceNavOptional() {
  return useContext(WorkspaceNavContext);
}
