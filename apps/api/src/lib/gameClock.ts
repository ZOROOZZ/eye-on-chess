import { redis } from "./redis.js";

function clockKey(gameId: string) {
  return `clock:${gameId}`;
}

const ACTIVE_GAMES_KEY = "active_games";

export interface ClockState {
  whiteTimeLeft: number; // ms
  blackTimeLeft: number; // ms
  lastMoveTimestamp: number; // epoch ms
  turn: "white" | "black";
  increment: number; // ms
}

export async function initClocks(gameId: string, initialTimeMs: number, incrementMs: number) {
  const state: ClockState = {
    whiteTimeLeft: initialTimeMs,
    blackTimeLeft: initialTimeMs,
    lastMoveTimestamp: Date.now(),
    turn: "white",
    increment: incrementMs,
  };
  await redis.set(clockKey(gameId), JSON.stringify(state));
  await redis.sadd(ACTIVE_GAMES_KEY, gameId);
}

export async function getClocks(gameId: string): Promise<ClockState | null> {
  const raw = await redis.get(clockKey(gameId));
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function getClocksRealtime(gameId: string): Promise<ClockState | null> {
  const state = await getClocks(gameId);
  if (!state) return null;

  // Deduct elapsed time for the active player
  const elapsed = Date.now() - state.lastMoveTimestamp;
  if (state.turn === "white") {
    state.whiteTimeLeft = Math.max(0, state.whiteTimeLeft - elapsed);
  } else {
    state.blackTimeLeft = Math.max(0, state.blackTimeLeft - elapsed);
  }
  return state;
}

export async function onMove(gameId: string, isUnlimited: boolean): Promise<ClockState | null> {
  const state = await getClocks(gameId);
  if (!state) return null;

  if (!isUnlimited) {
    const elapsed = Date.now() - state.lastMoveTimestamp;
    if (state.turn === "white") {
      state.whiteTimeLeft = Math.max(0, state.whiteTimeLeft - elapsed) + state.increment;
    } else {
      state.blackTimeLeft = Math.max(0, state.blackTimeLeft - elapsed) + state.increment;
    }
  }

  state.turn = state.turn === "white" ? "black" : "white";
  state.lastMoveTimestamp = Date.now();

  await redis.set(clockKey(gameId), JSON.stringify(state));
  return state;
}

export async function isTimeout(gameId: string): Promise<"white" | "black" | null> {
  const state = await getClocksRealtime(gameId);
  if (!state) return null;
  if (state.whiteTimeLeft <= 0) return "white";
  if (state.blackTimeLeft <= 0) return "black";
  return null;
}

export async function removeActiveGame(gameId: string) {
  await redis.srem(ACTIVE_GAMES_KEY, gameId);
  await redis.del(clockKey(gameId));
}

export async function getActiveGameIds(): Promise<string[]> {
  return redis.smembers(ACTIVE_GAMES_KEY);
}
