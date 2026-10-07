export type RoomStatus =
  | "lobby"
  | "countdown"
  | "round"
  | "results"
  | "finished";

export interface Player {
  id: string; // socket id
  nickname: string;
  isHost: boolean;
  ready: boolean;
  score: number;
  totalTimeMs: number; // for tie-breaks
}

export interface Item {
  name: string; // shown to players, e.g. "a bottle"
  detectorLabel: string; // exact COCO name
  level: "easy" | "medium";
}

export interface FoundEntry {
  rank: number;
  timeMs: number;
  points: number;
}

export interface RoundState {
  number: number;
  item: Item;
  startedAt: number;
  endsAt: number;
  found: Map<string, FoundEntry>;
}

export interface Room {
  id: string;
  status: RoomStatus;
  players: Player[];
  leftPlayers: Player[]; // players who left mid-game; scores stay on the board
  currentRound: RoundState | null;
  usedItems: string[];
  timers: {
    countdown?: ReturnType<typeof setTimeout>;
    round?: ReturnType<typeof setTimeout>;
    next?: ReturnType<typeof setTimeout>;
  };
}

export type JoinAck =
  | { ok: true; roomId: string; playerId: string }
  | { ok: false; error: string };