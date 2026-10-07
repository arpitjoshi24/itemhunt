"use client";

import { useGameSocket } from "@/hooks/useGameSocket";

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useGameSocket();
  return <>{children}</>;
}