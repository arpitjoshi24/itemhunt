// Labels YOLO often confuses with each other.
// Key = the item we ask for, value = labels we accept as a match.
const ACCEPTED: Record<string, string[]> = {
  mouse: ["mouse", "remote"],
  remote: ["remote", "mouse", "cell phone"],
  cup: ["cup", "wine glass"],
  bottle: ["bottle", "vase"],
  vase: ["vase", "bottle"],
  backpack: ["backpack", "handbag"],
  handbag: ["handbag", "backpack"],
};

export function acceptedLabels(target: string): string[] {
  return ACCEPTED[target] ?? [target];
}