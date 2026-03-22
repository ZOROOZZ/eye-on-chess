import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { BOT_PERSONALITIES } from "@eyeonchess/chess";

/**
 * Register the public bot listing endpoint.
 * Serves bot personalities from the database, falling back to hardcoded defaults.
 * No authentication is required for this route.
 */
export async function botRoutes(app: FastifyInstance) {
  app.get("/api/bots", async () => {
    try {
      const dbBots = await prisma.botProfile.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: "asc" },
      });

      if (dbBots.length > 0) {
        return {
          bots: dbBots.map((b) => ({
            id: b.botId,
            name: b.name,
            elo: b.elo,
            description: b.description,
            avatar: b.avatar,
            tier: b.tier,
            category: b.category,
            randomMoveChance: b.randomMoveChance,
            blunderChance: b.blunderChance,
            captureGreed: b.captureGreed,
            aggressionBias: b.aggressionBias,
            maxDepth: b.maxDepth,
            queenEarly: b.queenEarly,
            pawnPusher: b.pawnPusher,
          })),
        };
      }
    } catch {
      // DB not available or table doesn't exist yet — fall back
    }

    // Fallback to hardcoded personalities
    return { bots: BOT_PERSONALITIES };
  });
}
