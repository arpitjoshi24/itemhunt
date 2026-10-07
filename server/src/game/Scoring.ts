import { ROUND_MS } from "../constants";

const RANK_POINTS = [100, 80, 60, 40, 20];

export function scoring(rank: number, msLeft: number): number {
  const base = RANK_POINTS[Math.min(rank, 5) - 1];
  const clamped = Math.max(0, Math.min(msLeft, ROUND_MS));
  const speedBonus = Math.floor((clamped / ROUND_MS) * 20); // 0..20
  return base + speedBonus;
}