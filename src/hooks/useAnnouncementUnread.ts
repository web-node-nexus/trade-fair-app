import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { apiJson } from "@/lib/authFetch";
import { useAuth } from "@/context/AuthContext";

/** Unread announcement count for nav badges (polls while signed in). */
export function useAnnouncementUnread(pollMs = 45_000) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const j = await apiJson<{ unreadCount: number }>("/notifications/me/unread-count");
      setUnreadCount(Number(j.unreadCount ?? 0));
    } catch {
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
    if (!user) return;
    const id = setInterval(() => void refresh(), pollMs);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [user, pollMs, refresh]);

  return { unreadCount, refreshUnread: refresh };
}
