import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";
import { colors } from "@/theme/colors";

export function usePullToRefresh(onRefresh?: () => void | Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => void handleRefresh()}
      colors={[colors.emerald]}
      tintColor={colors.emerald}
    />
  ) : undefined;

  return { refreshing, onRefresh: handleRefresh, refreshControl };
}
