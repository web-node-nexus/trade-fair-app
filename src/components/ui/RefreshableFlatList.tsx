import { FlatList, type FlatListProps } from "react-native";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

type Props<T> = FlatListProps<T> & {
  onRefresh: () => void | Promise<void>;
};

export function RefreshableFlatList<T>({ onRefresh, ...rest }: Props<T>) {
  const { refreshControl } = usePullToRefresh(onRefresh);
  return <FlatList refreshControl={refreshControl} {...rest} />;
}
