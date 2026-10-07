import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { RoomManager } from "./game/RoomManager";
import { GameEngine } from "./game/GameEngine";
import { createRoomsRouter } from "./routes/rooms";
import { registerRoomHandlers } from "./socket/roomHandlers";
import { registerGameHandlers } from "./socket/gameHandlers";

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

const app = express();
app.use(cors({ origin: CLIENT_URL }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_URL } });

const rooms = new RoomManager();
const engine = new GameEngine(io, rooms);

app.use(createRoomsRouter(rooms));

io.on("connection", (socket) => {
  console.log(`[socket] connected ${socket.id}`);
  registerRoomHandlers(io, socket, rooms, engine);
  registerGameHandlers(io, socket, rooms, engine);
});

server.listen(PORT, () => {
  console.log(`Huntio server running on http://localhost:${PORT}`);
});