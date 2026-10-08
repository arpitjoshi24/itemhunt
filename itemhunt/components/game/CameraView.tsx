import type { RefObject } from "react";
import type { CameraStatus } from "@/hooks/useCamera";

export default function CameraView({
  videoRef,
  cameraStatus,
  message,
  found,
  onRetry,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraStatus: CameraStatus;
  message: string;
  found: boolean;
  onRetry: () => void;
}) {
  const cameraOk = cameraStatus === "ready";

  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-2xl bg-black ring-4 transition ${
        found ? "ring-emerald-400" : "ring-transparent"
      }`}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="h-full w-full object-cover"
      />

      {!cameraOk && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90 p-4 text-center text-sm text-slate-300">
          {cameraStatus === "requesting" && <p>Starting camera...</p>}
          {cameraStatus === "denied" && (
            <p className="text-red-400">Camera access was denied.</p>
          )}
          {cameraStatus === "error" && (
            <p className="text-red-400">Could not start the camera.</p>
          )}
          {cameraStatus !== "requesting" && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900"
            >
              Turn on camera
            </button>
          )}
        </div>
      )}

      {/* status pill */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm font-semibold ${
          found
            ? "bg-emerald-500 text-slate-900"
            : "bg-slate-900/80 text-slate-200"
        }`}
      >
        {message}
      </div>
    </div>
  );
}