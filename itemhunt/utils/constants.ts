export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";

export const MAX_NICKNAME_LENGTH = 16;
export const ROOM_ID_LENGTH = 6;

export const TOTAL_ROUNDS = 5;
export const ROUND_SECONDS = 60;
export const COUNTDOWN_SECONDS = 10;
export const DETECTION_THRESHOLD = 0.55;
export const DETECT_INTERVAL_MS = 350; // minimum gap between detections
export const CONFIRM_FRAMES = 3; // frames in a row before we report a find