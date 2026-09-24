export type StallLayoutEventFields = {
  stallLayoutMode?: "grid" | "image" | string | null;
  stallLayoutImageUrl?: string | null;
  stallNumberCount?: number | null;
};

export function isImageStallLayout(event: StallLayoutEventFields | null | undefined): boolean {
  return event?.stallLayoutMode === "image" && Boolean(event.stallLayoutImageUrl?.trim());
}
