import { describe, it, expect } from "vitest";
import { computeCustomMove, getStockfishConfig } from "./engine";
import type { BotPersonality } from "./types";

const AMIR: BotPersonality = {
  id: "amir",
  name: "Amir",
  elo: 200,
  description: "Test",
  avatar: "T",
  tier: "custom",
  category: "beginner",
  randomMoveChance: 0.45,
  blunderChance: 0.3,
  captureGreed: 0.2,
  aggressionBias: 0,
  maxDepth: 1,
  queenEarly: false,
  pawnPusher: true,
};

const HANA: BotPersonality = {
  id: "hana",
  name: "Hana",
  elo: 2000,
  description: "Test",
  avatar: "T",
  tier: "engine",
  category: "expert",
  randomMoveChance: 0,
  blunderChance: 0,
  captureGreed: 0.35,
  aggressionBias: 0,
  maxDepth: 12,
  queenEarly: false,
  pawnPusher: false,
};

const VIKTOR: BotPersonality = {
  id: "viktor",
  name: "Viktor",
  elo: 1300,
  description: "Test",
  avatar: "T",
  tier: "hybrid",
  category: "advanced",
  randomMoveChance: 0.05,
  blunderChance: 0.12,
  captureGreed: 0.5,
  aggressionBias: 0.9,
  maxDepth: 4,
  queenEarly: false,
  pawnPusher: false,
};

describe("computeCustomMove", () => {
  const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const checkmatedFen = "rnb1kbnr/pppp1ppp/4p3/8/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

  it("returns a valid UCI move string from the starting position", () => {
    const move = computeCustomMove(startFen, AMIR);
    expect(move).not.toBeNull();
    expect(move!.length).toBeGreaterThanOrEqual(4);
    expect(move!.length).toBeLessThanOrEqual(5);
  });

  it("returns null for a checkmate position", () => {
    const move = computeCustomMove(checkmatedFen, AMIR);
    expect(move).toBeNull();
  });

  it("returns different moves over multiple runs with high randomness", () => {
    const moves = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const move = computeCustomMove(startFen, AMIR);
      if (move) moves.add(move);
    }
    expect(moves.size).toBeGreaterThan(1);
  });
});

describe("getStockfishConfig", () => {
  it("returns correct config for engine tier", () => {
    const config = getStockfishConfig(HANA);
    expect(config.uciElo).toBe(2000);
    expect(config.blunderChance).toBe(0);
    expect(config.depth).toBe(12);
  });

  it("returns correct config for hybrid tier", () => {
    const config = getStockfishConfig(VIKTOR);
    expect(config.uciElo).toBe(0);
    expect(config.blunderChance).toBeGreaterThan(0);
    expect(config.depth).toBe(4);
  });
});
