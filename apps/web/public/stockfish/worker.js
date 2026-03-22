// Stockfish Web Worker
// Loads the WASM engine and communicates via postMessage

let engine = null;

// Load Stockfish
importScripts("/stockfish/stockfish.js");

Stockfish().then((sf) => {
  engine = sf;

  engine.addMessageListener((line) => {
    postMessage({ type: "uci", data: line });
  });

  postMessage({ type: "ready" });
});

// Handle messages from main thread
onmessage = function (e) {
  if (!engine) return;

  if (e.data.type === "cmd") {
    engine.postMessage(e.data.cmd);
  }
};
