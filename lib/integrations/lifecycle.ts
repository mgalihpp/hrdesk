import {
  CONNECTION_STATUS,
  type ConnectionStatus,
  SYNC_STATUS,
  type SyncStatus,
} from "@/lib/integrations/types";

export { CONNECTION_STATUS, SYNC_STATUS };
export const CONNECTION_TRANSITIONS: Record<
  ConnectionStatus,
  ConnectionStatus[]
> = {
  disconnected: ["pending"],
  pending: ["connected", "error", "disconnected"],
  connected: ["error"],
  error: ["pending", "disconnected"],
};

export const SYNC_TRANSITIONS: Record<SyncStatus, SyncStatus[]> = {
  pending: ["running", "failed"],
  running: ["success", "failed"],
  success: [],
  failed: ["pending"],
};

export function isValidConnectionStatus(v: string): v is ConnectionStatus {
  return (CONNECTION_STATUS as readonly string[]).includes(v);
}
export function isValidSyncStatus(v: string): v is SyncStatus {
  return (SYNC_STATUS as readonly string[]).includes(v);
}
export function canTransitionConnection(
  from: ConnectionStatus,
  to: ConnectionStatus,
): boolean {
  return CONNECTION_TRANSITIONS[from].includes(to);
}
export function canTransitionSync(from: SyncStatus, to: SyncStatus): boolean {
  return SYNC_TRANSITIONS[from].includes(to);
}
export function computeBackoffMs(retryCount: number, baseMs = 60_000): number {
  const capped = Math.min(retryCount, 5);
  return Math.min(baseMs * 2 ** (capped - 1), 24 * 60 * 60 * 1000);
}
export function nextRetryAt(retryCount: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + computeBackoffMs(retryCount));
}
