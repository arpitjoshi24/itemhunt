export type RoomStatus =
  | "lobby"
  | "countdown"
  | "round"
  | "results"
  | "finished";

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  ready: boolean;
  score: number;
}

// Response of GET /api/rooms/:roomId
export interface RoomInfo {
  exists: boolean;
  full?: boolean;
  started?: boolean;
}

// Acknowledgement the server sends back for room:create and room:join
export type JoinAck =
  | { ok: true; roomId: string; playerId: string }
  | { ok: false; error: string };

export interface RoundItem {
  name: string; // "a bottle"
  detectorLabel: string; // "bottle"
}

export interface ScoreEntry {
  playerId: string;
  nickname: string;
  score: number;
}

export interface RoundResult {
  playerId: string;
  nickname: string;
  found: boolean;
  rank: number | null;
  points: number;
}

export interface FoundNotice {
  playerId: string;
  nickname: string;
  points: number;
  rank: number;
}