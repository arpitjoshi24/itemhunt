import { ITEMS } from "../data/items";
import type { Item } from "../types";

export function pickItem(usedLabels: string[]): Item {
  const available = ITEMS.filter((i) => !usedLabels.includes(i.detectorLabel));
  const pool = available.length > 0 ? available : ITEMS;
  return pool[Math.floor(Math.random() * pool.length)];
}