// Stockfish Web Worker
// Loads the WASM engine and communicates via postMessage

let engine = null;

importScripts("/stockfish/stockfish.js");

Stockfish({
  locateFile: function (path) {
    return "/stockfish/" + path;
  },
}).then((sf) => {
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
