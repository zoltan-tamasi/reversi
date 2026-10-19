// In-memory store mapping session tokens to player IDs. Like the game store,
// this can be swapped for a persistent implementation later.

import { randomBytes } from 'node:crypto';

const sessions = new Map<string, string>();

export function createSession(playerId: string): string {
  const token = randomBytes(32).toString('base64url');
  sessions.set(token, playerId);
  return token;
}

export function getUserId(token: string): string | null {
  return sessions.get(token) ?? null;
}

// Accepts an `Authorization` header value of the form "Bearer <token>".
export function userIdFromAuthHeader(header: string | undefined | null): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(header ?? '');
  return match ? getUserId(match[1]) : null;
}
