import { StockfishEngine } from "./stockfish.js";
import { createChildLogger } from "./logger.js";

const log = createChildLogger("bot-engine");

let engine: StockfishEngine | null = null;
let currentElo: number | null = null;

async function getEngine(): Promise<StockfishEngine> {
  if (!engine) {
    engine = new StockfishEngine();
    await engine.init();
    log.info("bot stockfish engine initialized");
  }
  return engine;
}

export async function getBotMove(
  fen: string,
  elo: number,
  maxTimeMs: number = 2000
): Promise<string> {
  const eng = await getEngine();
  const proc = eng["process"];
  if (!proc) throw new Error("Engine not initialized");

  // Set UCI_Elo if changed
  if (currentElo !== elo) {
    proc.stdin.write("setoption name UCI_LimitStrength value true\n");
    proc.stdin.write(`setoption name UCI_Elo value ${Math.max(200, Math.min(3200, elo))}\n`);
    await eng.send("isready", "readyok");
    currentElo = elo;
  }

  proc.stdin.write("ucinewgame\n");
  proc.stdin.write(`position fen ${fen}\n`);
  await eng.send("isready", "readyok");

  // Think time scales with elo for natural feel
  const thinkTime = Math.min(maxTimeMs, Math.max(200, Math.floor(elo / 3)));

  const lines = await eng.send(`go movetime ${thinkTime}`, "bestmove");

  let bestMove = "";
  for (const line of lines) {
    if (line.startsWith("bestmove")) {
      bestMove = line.split(" ")[1] || "";
      break;
    }
  }

  if (!bestMove) {
    log.error({ fen, elo }, "bot engine returned no move");
    throw new Error("Bot engine returned no move");
  }

  return bestMove;
}
