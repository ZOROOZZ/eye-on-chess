"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface StockfishHook {
  ready: boolean;
  getBotMove: (fen: string, elo: number) => Promise<string | null>;
  evaluate: (fen: string) => Promise<{ score: number; bestMove: string | null }>;
}

export function useStockfish(): StockfishHook {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const resolverRef = useRef<{
    resolve: (lines: string[]) => void;
    lines: string[];
    waitFor: string;
  } | null>(null);

  useEffect(() => {
    const worker = new Worker("/stockfish/worker.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === "ready") {
        // Initialize UCI
        worker.postMessage({ type: "cmd", cmd: "uci" });
        // Wait briefly for uciok
        setTimeout(() => {
          worker.postMessage({ type: "cmd", cmd: "isready" });
          setReady(true);
        }, 100);
      }

      if (e.data.type === "uci" && resolverRef.current) {
        const line = e.data.data;
        resolverRef.current.lines.push(line);
        if (line.includes(resolverRef.current.waitFor)) {
          const r = resolverRef.current;
          resolverRef.current = null;
          r.resolve(r.lines);
        }
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const sendCommand = useCallback(
    (cmd: string, waitFor: string, timeoutMs: number = 15000): Promise<string[]> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error("Worker not ready"));
          return;
        }
        resolverRef.current = { resolve, lines: [], waitFor };
        workerRef.current.postMessage({ type: "cmd", cmd });

        setTimeout(() => {
          if (resolverRef.current?.resolve === resolve) {
            resolverRef.current = null;
            reject(new Error("Stockfish timeout"));
          }
        }, timeoutMs);
      });
    },
    []
  );

  const sendRaw = useCallback((cmd: string) => {
    workerRef.current?.postMessage({ type: "cmd", cmd });
  }, []);

  const getBotMove = useCallback(
    async (fen: string, elo: number): Promise<string | null> => {
      if (!ready) return null;

      const clampedElo = Math.max(200, Math.min(3200, elo));

      // Set strength
      sendRaw("setoption name UCI_LimitStrength value true");
      sendRaw(`setoption name UCI_Elo value ${clampedElo}`);
      await sendCommand("isready", "readyok");

      sendRaw("ucinewgame");
      sendRaw(`position fen ${fen}`);
      await sendCommand("isready", "readyok");

      // Think time scales with elo
      const thinkTime = Math.max(200, Math.floor(clampedElo / 3));
      const lines = await sendCommand(`go movetime ${thinkTime}`, "bestmove");

      for (const line of lines) {
        if (line.startsWith("bestmove")) {
          const move = line.split(" ")[1];
          return move && move !== "(none)" ? move : null;
        }
      }
      return null;
    },
    [ready, sendCommand, sendRaw]
  );

  const evaluate = useCallback(
    async (fen: string): Promise<{ score: number; bestMove: string | null }> => {
      if (!ready) return { score: 0, bestMove: null };

      // Disable elo limiting for eval
      sendRaw("setoption name UCI_LimitStrength value false");
      await sendCommand("isready", "readyok");

      sendRaw("ucinewgame");
      sendRaw(`position fen ${fen}`);
      await sendCommand("isready", "readyok");

      const lines = await sendCommand("go depth 12", "bestmove");

      let score = 0;
      let bestMove: string | null = null;
      const isBlack = fen.split(" ")[1] === "b";

      for (const line of lines) {
        if (line.startsWith("bestmove")) {
          const m = line.split(" ")[1];
          if (m && m !== "(none)") bestMove = m;
        }
        if (line.includes("score cp")) {
          const match = line.match(/score cp (-?\d+)/);
          if (match) {
            score = parseInt(match[1]);
            if (isBlack) score = -score;
          }
        }
        if (line.includes("score mate")) {
          const match = line.match(/score mate (-?\d+)/);
          if (match) {
            const mate = parseInt(match[1]);
            score = mate > 0 ? 100000 : -100000;
            if (isBlack) score = -score;
          }
        }
      }

      return { score, bestMove };
    },
    [ready, sendCommand, sendRaw]
  );

  return { ready, getBotMove, evaluate };
}
