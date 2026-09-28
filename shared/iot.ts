export const FRESHNESS_MS = 60_000;
export const OFFLINE_MS = 180_000;

export function dataState(lastSeen: Date | string | null, now = Date.now()) {
  const age = lastSeen ? now - new Date(lastSeen).getTime() : Infinity;
  return {
    status: age > OFFLINE_MS ? "offline" as const : "online" as const,
    stale: age > FRESHNESS_MS,
  };
}
