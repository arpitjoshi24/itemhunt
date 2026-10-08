"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { detect, isModelLoaded, loadModel } from "@/services/detector/yolo";
import {
  CONFIRM_FRAMES,
  DETECTION_THRESHOLD,
  DETECT_INTERVAL_MS,
} from "@/utils/constants";
import { acceptedLabels } from "@/services/detector/aliases";
export type ModelStatus = "loading" | "ready" | "error";

export function useModelStatus(): ModelStatus {
  const [status, setStatus] = useState<ModelStatus>(
    isModelLoaded() ? "ready" : "loading"
  );

  useEffect(() => {
    let cancelled = false;
    loadModel()
      .then(() => !cancelled && setStatus("ready"))
      .catch((err) => {
        console.error("Model failed to load:", err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean; // true only while a round is active and not yet found
  target: string | null; // COCO label we are looking for
  onFound: (label: string, confidence: number) => void;
}

export function useDetector({ videoRef, enabled, target, onFound }: Options) {
  const [seen, setSeen] = useState<{ label: string; confidence: number } | null>(
    null
  );

  const onFoundRef = useRef(onFound);
  useEffect(() => {
    onFoundRef.current = onFound;
  });

  useEffect(() => {
    if (!enabled || !target) {
      setSeen(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let streak = 0;
   const accepted = acceptedLabels(target);
    const loop = async () => {
      const started = performance.now();
      const video = videoRef.current;

      if (video && video.readyState >= 2) {
        try {
          const detections = await detect(video);
          if (cancelled) return;

          const best = detections[0] ?? null;
          setSeen(best ? { label: best.label, confidence: best.confidence } : null);

          const hit = detections.find(
  (d) => accepted.includes(d.label) && d.confidence >= DETECTION_THRESHOLD
);
          streak = hit ? streak + 1 : 0;

          if (hit && streak >= CONFIRM_FRAMES) {
            onFoundRef.current(target, hit.confidence);
            return; // stop the loop once found
          }
        } catch (err) {
          console.error("Detection error:", err);
        }
      }

      if (cancelled) return;
      const elapsed = performance.now() - started;
      timer = setTimeout(loop, Math.max(0, DETECT_INTERVAL_MS - elapsed));
    };

    loop();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, target, videoRef]);

  return { seen };
}