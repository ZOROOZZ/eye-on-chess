"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { useStockfish } from "../../../../lib/useStockfish";
import ChessBoard from "../../../../components/ChessBoard";
import EvaluationBar from "../../../../components/EvaluationBar";
import MoveList from "../../../../components/MoveList";
import CapturedPieces from "../../../../components/CapturedPieces";
import ConfirmModal from "../../../../components/ConfirmModal";

interface MoveRecord {
  ply: number;
  san: string;
  fen: string;
}

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function eloLabel(elo: number): string {
  if (elo < 400) return "Beginner";
  if (elo < 800) return "Novice";
  if (elo < 1200) return "Intermediate";
  if (elo < 1600) return "Advanced";
  if (elo < 2000) return "Expert";
  if (elo < 2400) return "Master";
  return "Engine";
}

export default function OfflineBotPage() {
  const [phase, setPhase] = useState<"select" | "game" | "ended">("select");
  const [botElo, setBotElo] = useState(800);
  const [colorChoice, setColorChoice] = useState<"white" | "black">("white");
  const [showEvalBar, setShowEvalBar] = useState(true);

  const [game, setGame] = useState(() => new Chess());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentPly, setCurrentPly] = useState(0);
  const [lastMove, setLastMove] = useState<[string, string] | undefined>();
  const [playerIsWhite, setPlayerIsWhite] = useState(true);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [evalScore, setEvalScore] = useState(0);

  const stockfish = useStockfish();

  // Run eval when position changes
  const currentFen = game.fen();
  const evalEnabled = showEvalBar && phase === "game" && stockfish.ready;
  // We'll update eval after each move instead of continuous polling

  function startGame() {
    const g = new Chess();
    const isWhite = colorChoice === "white";
    setGame(g);
    setPlayerIsWhite(isWhite);
    setMoves([]);
    setCurrentPly(0);
    setLastMove(undefined);
    setGameOver(null);
    setPhase("game");
    setConfirmStart(false);

    // Bot plays first if player is black
    if (!isWhite) {
      setTimeout(() => makeBotMove(g, []), 500);
    }
  }

  async function makeBotMove(chess: Chess, currentMoves: MoveRecord[]) {
    setThinking(true);
    try {
      const moveUci = await stockfish.getBotMove(chess.fen(), botElo);
      if (!moveUci) {
        setThinking(false);
        return;
      }
      const from = moveUci.slice(0, 2);
      const to = moveUci.slice(2, 4);
      const promotion = moveUci[4] || undefined;
      const move = chess.move({ from, to, promotion });
      if (!move) {
        setThinking(false);
        return;
      }

      const ply = currentMoves.length + 1;
      const newMoves = [...currentMoves, { ply, san: move.san, fen: chess.fen() }];
      setGame(new Chess(chess.fen()));
      setMoves(newMoves);
      setCurrentPly(ply);
      setLastMove([from, to]);

      // Update eval
      if (evalEnabled) {
        const ev = await stockfish.evaluate(chess.fen());
        setEvalScore(ev.score);
      }

      if (chess.isGameOver()) {
        const result = chess.isCheckmate()
          ? chess.turn() === "w"
            ? "Black wins by checkmate"
            : "White wins by checkmate"
          : "Draw";
        setGameOver(result);
        setPhase("ended");
      }
    } finally {
      setThinking(false);
    }
  }

  const handleMove = useCallback(
    async (from: string, to: string, promotion?: string) => {
      if (thinking || gameOver || !stockfish.ready) return;

      const chess = new Chess(game.fen());
      const move = chess.move({ from, to, promotion: promotion || undefined });
      if (!move) return;

      const ply = moves.length + 1;
      const newMoves = [...moves, { ply, san: move.san, fen: chess.fen() }];
      setGame(new Chess(chess.fen()));
      setMoves(newMoves);
      setCurrentPly(ply);
      setLastMove([from, to]);

      // Update eval after player move
      if (evalEnabled) {
        const ev = await stockfish.evaluate(chess.fen());
        setEvalScore(ev.score);
      }

      if (chess.isGameOver()) {
        const result = chess.isCheckmate()
          ? chess.turn() === "w"
            ? "Black wins by checkmate"
            : "White wins by checkmate"
          : "Draw";
        setGameOver(result);
        setPhase("ended");
        return;
      }

      // Bot responds
      makeBotMove(chess, newMoves);
    },
    [game, moves, thinking, gameOver, botElo, stockfish, evalEnabled]
  );

  const orientation = playerIsWhite ? "white" : "black";
  const isMyTurn =
    phase === "game" &&
    !thinking &&
    !gameOver &&
    ((game.turn() === "w" && playerIsWhite) || (game.turn() === "b" && !playerIsWhite));
  const isViewingLatest = currentPly === moves.length;
  const displayFen =
    currentPly === 0
      ? moves.length > 0
        ? STARTING_FEN
        : game.fen()
      : moves.find((m) => m.ply === currentPly)?.fen || game.fen();

  // ── Selection ────────────────────────────────────────
  if (phase === "select") {
    return (
      <main className="flex flex-col items-center min-h-screen p-4 pt-12">
        <div className="max-w-lg w-full space-y-6">
          <h1 className="text-2xl font-bold text-center">Offline Bot</h1>
          <p className="text-gray-400 text-sm text-center">No internet required</p>

          {!stockfish.ready && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-300">Loading Stockfish engine...</p>
              <p className="text-xs text-blue-400 mt-1">First load downloads ~7MB (cached after)</p>
            </div>
          )}

          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-400 mb-2">Bot Difficulty</h2>
            <div className="text-center mb-2">
              <span className="text-3xl font-bold">{botElo}</span>
              <span className="text-gray-400 ml-2">{eloLabel(botElo)}</span>
            </div>
            <input
              type="range"
              min={200}
              max={2400}
              step={50}
              value={botElo}
              onChange={(e) => setBotElo(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Play As</h2>
            <div className="grid grid-cols-2 gap-2">
              {(["white", "black"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setColorChoice(c)}
                  className={`py-2 rounded text-sm font-medium transition-colors ${
                    colorChoice === c ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setConfirmStart(true)}
            disabled={!stockfish.ready}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait rounded-lg text-lg font-bold transition-colors"
          >
            Start Offline Game
          </button>

          <div className="text-center">
            <Link href="/play" className="text-gray-400 hover:text-white text-sm">
              &larr; Back to Play
            </Link>
          </div>

          <ConfirmModal
            open={confirmStart}
            title="Start Offline Game?"
            message={`Bot: ${botElo} (${eloLabel(botElo)})\nColor: ${colorChoice}\nNo time control (untimed)\nGame won't be saved to server`}
            confirmLabel="Start"
            confirmVariant="primary"
            onConfirm={startGame}
            onCancel={() => setConfirmStart(false)}
          />
        </div>
      </main>
    );
  }

  // ── Game ─────────────────────────────────────────────
  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-4">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex gap-2 flex-1 min-w-0">
            {showEvalBar && (
              <div className="h-auto flex">
                <EvaluationBar evalCP={evalScore} mate={null} />
              </div>
            )}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Bot ({botElo}) <span className="text-gray-500">{eloLabel(botElo)}</span>
                </span>
                <span className="text-xs text-yellow-500 bg-yellow-900/30 px-2 py-0.5 rounded">
                  OFFLINE
                </span>
              </div>
              <CapturedPieces fen={displayFen} color={playerIsWhite ? "white" : "black"} />

              <div className="relative w-full max-w-[640px] border-2 border-gray-700 rounded">
                <ChessBoard
                  fen={displayFen}
                  orientation={orientation}
                  movable={isMyTurn && isViewingLatest}
                  lastMove={lastMove}
                  check={new Chess(displayFen).inCheck()}
                  onMove={handleMove}
                />
                {thinking && (
                  <div className="absolute bottom-2 right-2 bg-gray-900/80 px-2 py-1 rounded text-xs text-gray-400">
                    Thinking...
                  </div>
                )}
              </div>

              <CapturedPieces fen={displayFen} color={playerIsWhite ? "black" : "white"} />
              <span className="text-sm font-medium">You</span>
            </div>
          </div>

          <div className="w-full lg:w-72 space-y-3">
            <MoveList moves={moves} currentPly={currentPly} onGoToPly={setCurrentPly} />
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setCurrentPly(0)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPly(Math.max(0, currentPly - 1))}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                &lsaquo;
              </button>
              <button
                onClick={() => setCurrentPly(Math.min(moves.length, currentPly + 1))}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => setCurrentPly(moves.length)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                &raquo;
              </button>
            </div>

            {!gameOver && (
              <button
                onClick={() => setConfirmResign(true)}
                className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
              >
                Resign
              </button>
            )}

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400">
              <input
                type="checkbox"
                checked={showEvalBar}
                onChange={() => setShowEvalBar(!showEvalBar)}
              />
              Eval Bar
            </label>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmResign}
        title="Resign?"
        message="Are you sure you want to resign?"
        confirmLabel="Resign"
        confirmVariant="danger"
        onConfirm={() => {
          setGameOver(playerIsWhite ? "Black wins by resignation" : "White wins by resignation");
          setPhase("ended");
          setConfirmResign(false);
        }}
        onCancel={() => setConfirmResign(false)}
      />

      {gameOver && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4 text-center">
            <h2 className="text-xl font-bold mb-2">Game Over</h2>
            <p className="text-gray-300 mb-4">{gameOver}</p>
            <button
              onClick={() => {
                setPhase("select");
                setGame(new Chess());
                setMoves([]);
                setCurrentPly(0);
                setLastMove(undefined);
                setGameOver(null);
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
