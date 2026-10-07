import { io, Socket } from "socket.io-client";
import { SERVER_URL } from "@/utils/constants";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false, // we connect when the user acts
      transports: ["websocket"],
    });
  }
  return socket;
}