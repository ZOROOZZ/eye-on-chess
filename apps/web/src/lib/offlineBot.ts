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

export function getOfflineBotMove(fen: string, elo: number): string | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Depth based on elo
  let depth: number;
  if (elo < 400) depth = 1;
  else if (elo < 800) depth = 1;
  else if (elo < 1200) depth = 2;
  else if (elo < 1800) depth = 2;
  else if (elo < 2400) depth = 3;
  else depth = 3;

  // Blunder probability based on elo
  const blunderChance = Math.max(0, (1200 - elo) / 2000);

  // Random blunder at low elo
  if (Math.random() < blunderChance) {
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return `${randomMove.from}${randomMove.to}${randomMove.promotion || ""}`;
  }

  const isMaximizing = chess.turn() === "w";
  let bestMove = moves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing);
    chess.undo();

    if (isMaximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  // At mid elo, occasionally pick second-best move
  if (elo < 1600 && Math.random() < 0.2 && moves.length > 1) {
    const scored = moves
      .map((m) => {
        chess.move(m);
        const s = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing);
        chess.undo();
        return { move: m, score: s };
      })
      .sort((a, b) => (isMaximizing ? b.score - a.score : a.score - b.score));

    const pick = scored[Math.min(1, scored.length - 1)];
    return `${pick.move.from}${pick.move.to}${pick.move.promotion || ""}`;
  }

  return `${bestMove.from}${bestMove.to}${bestMove.promotion || ""}`;
}
