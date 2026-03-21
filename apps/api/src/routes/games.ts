import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { initClocks } from "../lib/gameClock.js";
import { getIO } from "../lib/socket.js";
import type { TimeControl } from "@prisma/client";

const TIME_CONTROL_MAP: Record<
  string,
  { timeControl: TimeControl; initialTime: number; increment: number }
> = {
  bullet_1_0: { timeControl: "BULLET", initialTime: 60, increment: 0 },
  bullet_2_1: { timeControl: "BULLET", initialTime: 120, increment: 1 },
  blitz_3_0: { timeControl: "BLITZ", initialTime: 180, increment: 0 },
  blitz_5_0: { timeControl: "BLITZ", initialTime: 300, increment: 0 },
  blitz_5_3: { timeControl: "BLITZ", initialTime: 300, increment: 3 },
  rapid_10_0: { timeControl: "RAPID", initialTime: 600, increment: 0 },
  rapid_15_10: { timeControl: "RAPID", initialTime: 900, increment: 10 },
  classical_30_0: { timeControl: "CLASSICAL", initialTime: 1800, increment: 0 },
  unlimited: { timeControl: "UNLIMITED", initialTime: 0, increment: 0 },
};

export async function gameRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Challenge a friend
  app.post<{
    Body: {
      friendId: string;
      preset?: string;
      initialTime?: number;
      increment?: number;
    };
  }>("/api/games/friend", async (request, reply) => {
    const userId = request.user.userId;
    const { friendId, preset, initialTime: customTime, increment: customIncrement } = request.body;

    if (!friendId) {
      return reply.status(400).send({ error: "friendId is required" });
    }

    if (friendId === userId) {
      return reply.status(400).send({ error: "Cannot challenge yourself" });
    }

    // Verify friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    });

    if (!friendship) {
      return reply.status(403).send({ error: "Must be friends to challenge" });
    }

    // Resolve time control
    let timeControl: TimeControl;
    let initialTime: number;
    let increment: number;

    if (preset && TIME_CONTROL_MAP[preset]) {
      const p = TIME_CONTROL_MAP[preset];
      timeControl = p.timeControl;
      initialTime = p.initialTime;
      increment = p.increment;
    } else if (customTime !== undefined) {
      initialTime = customTime;
      increment = customIncrement ?? 0;
      // Categorize
      const totalSeconds = initialTime + increment * 40;
      if (totalSeconds < 180) timeControl = "BULLET";
      else if (totalSeconds < 480) timeControl = "BLITZ";
      else if (totalSeconds < 1500) timeControl = "RAPID";
      else timeControl = "CLASSICAL";
    } else {
      return reply.status(400).send({ error: "Must provide preset or custom time" });
    }

    // Randomly assign colors
    const whiteId = Math.random() < 0.5 ? userId : friendId;
    const blackId = whiteId === userId ? friendId : userId;

    const game = await prisma.game.create({
      data: {
        whiteId,
        blackId,
        status: "WAITING",
        timeControl,
        initialTime,
        increment,
        whiteTimeLeft: initialTime * 1000,
        blackTimeLeft: initialTime * 1000,
      },
      include: {
        white: { select: { id: true, username: true, rating: true, avatarUrl: true } },
        black: { select: { id: true, username: true, rating: true, avatarUrl: true } },
      },
    });

    // Notify the challenged friend via socket
    const io = getIO();
    if (io) {
      io.emit("challenge:incoming", {
        gameId: game.id,
        challenger: game.whiteId === userId ? game.white : game.black,
        timeControl,
        initialTime,
        increment,
      });
    }

    return { game };
  });

  // Accept challenge
  app.post<{ Body: { gameId: string } }>("/api/games/challenge/accept", async (request, reply) => {
    const userId = request.user.userId;
    const { gameId } = request.body;

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return reply.status(404).send({ error: "Game not found" });
    }

    if (game.status !== "WAITING") {
      return reply.status(400).send({ error: "Challenge already resolved" });
    }

    if (game.whiteId !== userId && game.blackId !== userId) {
      return reply.status(403).send({ error: "Not part of this challenge" });
    }

    await prisma.game.update({
      where: { id: gameId },
      data: { status: "ACTIVE", startedAt: new Date() },
    });

    // Init clocks in Redis (skip for unlimited)
    if (game.timeControl !== "UNLIMITED") {
      await initClocks(gameId, game.initialTime * 1000, game.increment * 1000);
    }

    const io = getIO();
    if (io) {
      io.emit("challenge:accepted", { gameId });
    }

    return { success: true, gameId };
  });

  // Decline challenge
  app.post<{ Body: { gameId: string } }>("/api/games/challenge/decline", async (request, reply) => {
    const userId = request.user.userId;
    const { gameId } = request.body;

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return reply.status(404).send({ error: "Game not found" });
    }

    if (game.status !== "WAITING") {
      return reply.status(400).send({ error: "Challenge already resolved" });
    }

    if (game.whiteId !== userId && game.blackId !== userId) {
      return reply.status(403).send({ error: "Not part of this challenge" });
    }

    await prisma.game.delete({ where: { id: gameId } });

    const io = getIO();
    if (io) {
      io.emit("challenge:declined", { gameId });
    }

    return { success: true };
  });

  // Get game state
  app.get<{ Params: { id: string } }>("/api/games/:id", async (request, reply) => {
    const { id } = request.params;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        white: { select: { id: true, username: true, rating: true, avatarUrl: true } },
        black: { select: { id: true, username: true, rating: true, avatarUrl: true } },
        moves: { orderBy: { ply: "asc" } },
      },
    });

    if (!game) {
      return reply.status(404).send({ error: "Game not found" });
    }

    return { game };
  });
}
