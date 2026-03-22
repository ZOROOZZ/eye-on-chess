import { Chess } from "chess.js";

// Piece-square tables for positional evaluation
const PST_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10,
  25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10,
  10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];

const PST_KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0,
  -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5,
  -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
];

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const PST: Record<string, number[]> = {
  p: PST_PAWN,
  n: PST_KNIGHT,
};

function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type] || 0;
      const pst = PST[piece.type];
      const posBonus = pst ? (piece.color === "w" ? pst[r * 8 + c] : pst[(7 - r) * 8 + c]) : 0;

      if (piece.color === "w") {
        score += value + posBonus;
      } else {
        score -= value + posBonus;
      }
    }
  }

  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Offline bot move selection.
 *
 * Elo behavior:
 *  200-400:  ~80% pure random, 20% depth-0 (just eval, no lookahead)
 *  400-800:  ~40% random, 60% depth-1 with noise
 *  800-1200: depth 1, ~20% pick from bottom half of moves
 *  1200-1600: depth 2, ~10% suboptimal
 *  1600-2000: depth 2, clean play
 *  2000-2400: depth 3
 */
export function getOfflineBotMove(fen: string, elo: number): string | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // ── Elo < 400: Mostly random, occasionally avoids hanging queen ──
  if (elo < 400) {
    // 80% pure random
    if (Math.random() < 0.8) {
      const pick = moves[Math.floor(Math.random() * moves.length)];
      return `${pick.from}${pick.to}${pick.promotion || ""}`;
    }
    // 20% pick a capture if available, otherwise random
    const captures = moves.filter((m) => m.captured);
    if (captures.length > 0) {
      const pick = captures[Math.floor(Math.random() * captures.length)];
      return `${pick.from}${pick.to}${pick.promotion || ""}`;
    }
    const pick = moves[Math.floor(Math.random() * moves.length)];
    return `${pick.from}${pick.to}${pick.promotion || ""}`;
  }

  // ── Elo 400-800: High randomness with shallow eval ──
  if (elo < 800) {
    const randomChance = 0.4 - ((elo - 400) / 400) * 0.2; // 40% at 400, 20% at 800
    if (Math.random() < randomChance) {
      const pick = moves[Math.floor(Math.random() * moves.length)];
      return `${pick.from}${pick.to}${pick.promotion || ""}`;
    }

    // Depth 0: just evaluate resulting position, add noise
    const isMaximizing = chess.turn() === "w";
    const scored = moves.map((m) => {
      chess.move(m);
      const score = evaluateBoard(chess) + (Math.random() - 0.5) * 200; // +/-100 noise
      chess.undo();
      return { move: m, score };
    });
    scored.sort((a, b) => (isMaximizing ? b.score - a.score : a.score - b.score));

    // Pick from top 60% of moves
    const poolSize = Math.max(1, Math.ceil(scored.length * 0.6));
    const pick = scored[Math.floor(Math.random() * poolSize)];
    return `${pick.move.from}${pick.move.to}${pick.move.promotion || ""}`;
  }

  // ── Elo 800+: Minimax with depth and controlled imprecision ──
  let depth: number;
  let noiseAmount: number; // centipawn noise added to eval
  let pickFromTopN: number; // pick randomly from top N moves

  if (elo < 1200) {
    depth = 1;
    noiseAmount = 150 - ((elo - 800) / 400) * 100; // 150cp at 800, 50cp at 1200
    pickFromTopN = 3;
  } else if (elo < 1600) {
    depth = 2;
    noiseAmount = 50 - ((elo - 1200) / 400) * 40; // 50cp at 1200, 10cp at 1600
    pickFromTopN = 2;
  } else if (elo < 2000) {
    depth = 2;
    noiseAmount = 10;
    pickFromTopN = 1;
  } else {
    depth = 3;
    noiseAmount = 0;
    pickFromTopN = 1;
  }

  const isMaximizing = chess.turn() === "w";
  const scored = moves.map((m) => {
    chess.move(m);
    const score =
      minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing) +
      (Math.random() - 0.5) * noiseAmount * 2;
    chess.undo();
    return { move: m, score };
  });

  scored.sort((a, b) => (isMaximizing ? b.score - a.score : a.score - b.score));

  // Pick from top N (with safety check)
  const idx = Math.floor(Math.random() * Math.min(pickFromTopN, scored.length));
  const pick = scored[idx];
  return `${pick.move.from}${pick.move.to}${pick.move.promotion || ""}`;
}
