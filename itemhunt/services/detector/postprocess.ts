import { COCO_LABELS } from "./labels";

export interface Detection {
  classId: number;
  label: string;
  confidence: number;
  box: [number, number, number, number]; // x1, y1, x2, y2 in 640x640 space
}

const IOU_THRESHOLD = 0.45;

function iou(a: Detection["box"], b: Detection["box"]): number {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = (a[2] - a[0]) * (a[3] - a[1]);
  const areaB = (b[2] - b[0]) * (b[3] - b[1]);
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

export function decodeAndNms(
  output: Float32Array,
  dims: number[], // [1, 84, 8400]
  confThreshold = 0.25
): Detection[] {
  const numAnchors = dims[2];
  const numClasses = dims[1] - 4;

  // 1. decode: best class per candidate box
  const candidates: Detection[] = [];
  for (let a = 0; a < numAnchors; a++) {
    let best = -1;
    let bestScore = 0;
    for (let c = 0; c < numClasses; c++) {
      const s = output[(4 + c) * numAnchors + a];
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    if (best < 0 || bestScore < confThreshold) continue;

    const cx = output[a];
    const cy = output[numAnchors + a];
    const w = output[2 * numAnchors + a];
    const h = output[3 * numAnchors + a];

    candidates.push({
      classId: best,
      label: COCO_LABELS[best] ?? String(best),
      confidence: bestScore,
      box: [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2],
    });
  }

  // 2. NMS: keep the strongest box, drop overlapping boxes of the same class
  candidates.sort((a, b) => b.confidence - a.confidence);
  const kept: Detection[] = [];
  for (const d of candidates.slice(0, 300)) {
    const overlaps = kept.some(
      (k) => k.classId === d.classId && iou(k.box, d.box) >= IOU_THRESHOLD
    );
    if (!overlaps) kept.push(d);
    if (kept.length >= 50) break;
  }
  return kept;
}