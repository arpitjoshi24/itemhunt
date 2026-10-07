import { create } from "zustand";
import { TOTAL_ROUNDS } from "@/utils/constants";
import type {
  FoundNotice,
  Player,
  RoomStatus,
  RoundItem,
  RoundResult,
  ScoreEntry,
} from "@/types/game";

interface GameData {
  me: { id: string; nickname: string } | null;
  roomId: string | null;
  players: Player[];
  status: RoomStatus;
  countdownEndsAt: number | null; // server time
  totalRounds: number;
  round: number;
  item: RoundItem | null;
  endsAt: number | null; // server time
  scores: ScoreEntry[];
  foundNotices: FoundNotice[];
  roundResults: RoundResult[] | null;
  finalLeaderboard: ScoreEntry[];
  serverOffset: number;
}

interface GameActions {
  setMe: (me: GameData["me"]) => void;
  setRoomId: (roomId: string | null) => void;
  setRoom: (players: Player[], status: RoomStatus) => void;
  setCountdown: (endsAt: number | null) => void;
  setServerOffset: (offset: number) => void;
  gameStarted: (totalRounds: number) => void;
  roundStart: (d: { round: number; item: RoundItem; endsAt: number }) => void;
  addFound: (n: FoundNotice) => void;
  roundEnd: (results: RoundResult[], scores: ScoreEntry[]) => void;
  setScores: (scores: ScoreEntry[]) => void;
  gameOver: (finalLeaderboard: ScoreEntry[]) => void;
  roomReset: (players: Player[]) => void;
  reset: () => void;
}

export type GameState = GameData & GameActions;

const initial: Omit<GameData, "serverOffset"> = {
  me: null,
  roomId: null,
  players: [],
  status: "lobby",
  countdownEndsAt: null,
  totalRounds: TOTAL_ROUNDS,
  round: 0,
  item: null,
  endsAt: null,
  scores: [],
  foundNotices: [],
  roundResults: null,
  finalLeaderboard: [],
};

export const useGameStore = create<GameState>((set) => ({
  ...initial,
  serverOffset: 0,

  setMe: (me) => set({ me }),
  setRoomId: (roomId) => set({ roomId }),

  setRoom: (players, status) =>
    set((s) => ({
      players,
      status,
      countdownEndsAt: status === "countdown" ? s.countdownEndsAt : null,
    })),

  setCountdown: (countdownEndsAt) => set({ countdownEndsAt }),
  setServerOffset: (serverOffset) => set({ serverOffset }),

  gameStarted: (totalRounds) =>
    set({
      totalRounds,
      round: 0,
      item: null,
      endsAt: null,
      scores: [],
      foundNotices: [],
      roundResults: null,
      finalLeaderboard: [],
      countdownEndsAt: null,
    }),

  roundStart: ({ round, item, endsAt }) =>
    set({ round, item, endsAt, foundNotices: [], roundResults: null }),

  addFound: (n) => set((s) => ({ foundNotices: [...s.foundNotices, n] })),

  roundEnd: (roundResults, scores) => set({ roundResults, scores }),
  setScores: (scores) => set({ scores }),
  gameOver: (finalLeaderboard) => set({ finalLeaderboard }),

  roomReset: (players) =>
    set({
      players,
      status: "lobby",
      round: 0,
      item: null,
      endsAt: null,
      scores: [],
      foundNotices: [],
      roundResults: null,
      finalLeaderboard: [],
      countdownEndsAt: null,
    }),

  reset: () => set({ ...initial }),
}));