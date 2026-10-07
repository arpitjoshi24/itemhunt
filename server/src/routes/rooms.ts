import { Router } from "express";
import { MAX_PLAYERS } from "../constants";
import type { RoomManager } from "../game/RoomManager";

export function createRoomsRouter(rooms: RoomManager) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  router.get("/api/rooms/:roomId", (req, res) => {
    const room = rooms.get(req.params.roomId.toUpperCase());
    if (!room) return res.json({ exists: false });
    res.json({
      exists: true,
      full: room.players.length >= MAX_PLAYERS,
      started: room.status !== "lobby",
    });
  });

  return router;
}