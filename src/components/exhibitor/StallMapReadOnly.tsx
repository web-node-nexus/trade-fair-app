import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Stall = {
  id: string;
  label: string;
  status: string;
  gridRow: number | null;
  gridCol: number | null;
  stallTypeId: string;
};

type StallType = { id: string; code: string; name: string };

const STATUS_COLOR: Record<string, string> = {
  available: "#d1fae5",
  held: "#fef3c7",
  booked: "#fecaca",
  blocked: "#e5e7eb",
};

export function StallMapReadOnly({
  stalls,
  stallTypes,
}: {
  stalls: Stall[];
  stallTypes: StallType[];
}) {
  const withGrid = stalls.filter((s) => s.gridRow != null && s.gridCol != null);
  if (withGrid.length === 0) {
    return (
      <View style={styles.fallback}>
        {stalls.map((s) => {
          const type = stallTypes.find((t) => t.id === s.stallTypeId);
          return (
            <View key={s.id} style={[styles.chip, { backgroundColor: STATUS_COLOR[s.status] ?? colors.border }]}>
              <Text style={styles.chipText}>{s.label}</Text>
              <Text style={styles.chipSub}>{type?.code ?? s.status}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  const maxRow = Math.max(...withGrid.map((s) => s.gridRow ?? 0));
  const maxCol = Math.max(...withGrid.map((s) => s.gridCol ?? 0));
  const grid: (Stall | null)[][] = Array.from({ length: maxRow + 1 }, () =>
    Array.from({ length: maxCol + 1 }, () => null)
  );
  for (const s of withGrid) {
    if (s.gridRow != null && s.gridCol != null) grid[s.gridRow][s.gridCol] = s;
  }

  return (
    <View style={styles.grid}>
      {grid.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((cell, ci) => (
            <View
              key={`${ri}-${ci}`}
              style={[
                styles.cell,
                cell ? { backgroundColor: STATUS_COLOR[cell.status] ?? colors.surface } : styles.cellEmpty,
              ]}
            >
              {cell ? <Text style={styles.cellText}>{cell.label}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontWeight: "700", fontSize: 12, color: colors.navy },
  chipSub: { fontSize: 10, color: colors.textMuted },
  grid: { gap: 4 },
  row: { flexDirection: "row", gap: 4 },
  cell: {
    width: 52,
    height: 40,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellEmpty: { backgroundColor: "transparent", borderColor: "transparent" },
  cellText: { fontSize: 9, fontWeight: "700", color: colors.navy, textAlign: "center" },
});
