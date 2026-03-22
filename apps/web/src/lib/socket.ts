import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Establishes a Socket.IO connection to the API server using the current access token.
 * Starts a heartbeat interval once connected. No-ops if already connected or no token is available.
 */
export function connectSocket() {
  const token = getAccessToken();
  if (!token) return;

  if (socket?.connected) return;

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost";

  socket = io(apiUrl, {
    auth: { token },
    withCredentials: true,
  });

  socket.on("connect", () => {
    // Start heartbeat
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
      socket?.emit("heartbeat");
    }, 20_000);
  });

  socket.on("disconnect", () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  });
}

/**
 * Disconnects the active Socket.IO connection and clears the heartbeat interval.
 */
export function disconnectSocket() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Returns the current Socket.IO client instance, or null if not connected.
 *
 * @returns The active socket instance or null.
 */
export function getSocket(): Socket | null {
  return socket;
}
