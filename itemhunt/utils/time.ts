// offset = serverTime - clientTime, measured once on connect
export function serverNow(offset: number): number {
  return Date.now() + offset;
}

export function secondsLeft(endsAt: number, offset: number): number {
  return Math.max(0, Math.ceil((endsAt - serverNow(offset)) / 1000));
}