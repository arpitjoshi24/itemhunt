import { SERVER_URL } from "@/utils/constants";
import type { RoomInfo } from "@/types/game";

export async function getRoomInfo(roomId: string): Promise<RoomInfo> {
  const res = await fetch(`${SERVER_URL}/api/rooms/${roomId}`);
  if (!res.ok) throw new Error("Could not reach the server");
  return res.json();
}