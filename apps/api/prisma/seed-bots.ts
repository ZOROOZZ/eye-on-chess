/**
 * Bot personality seeder — populates the BotProfile table from the shared
 * BOT_PERSONALITIES definitions. Idempotent via upsert on botId.
 *
 * Run with: make seed-bots
 */
import { PrismaClient } from "@prisma/client";
import { BOT_PERSONALITIES } from "@eyeonchess/chess";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding bot profiles...\n");

  for (let i = 0; i < BOT_PERSONALITIES.length; i++) {
    const bot = BOT_PERSONALITIES[i];
    await prisma.botProfile.upsert({
      where: { botId: bot.id },
      update: {
        name: bot.name,
        elo: bot.elo,
        description: bot.description,
        avatar: bot.avatar,
        category: bot.category,
        tier: bot.tier,
        randomMoveChance: bot.randomMoveChance,
        blunderChance: bot.blunderChance,
        captureGreed: bot.captureGreed,
        aggressionBias: bot.aggressionBias,
        maxDepth: bot.maxDepth,
        queenEarly: bot.queenEarly,
        pawnPusher: bot.pawnPusher,
        sortOrder: i,
      },
      create: {
        botId: bot.id,
        name: bot.name,
        elo: bot.elo,
        description: bot.description,
        avatar: bot.avatar,
        category: bot.category,
        tier: bot.tier,
        randomMoveChance: bot.randomMoveChance,
        blunderChance: bot.blunderChance,
        captureGreed: bot.captureGreed,
        aggressionBias: bot.aggressionBias,
        maxDepth: bot.maxDepth,
        queenEarly: bot.queenEarly,
        pawnPusher: bot.pawnPusher,
        sortOrder: i,
      },
    });
    console.log(`  ${bot.avatar} ${bot.name} (${bot.elo}) — ${bot.category}`);
  }

  console.log(`\nSeeded ${BOT_PERSONALITIES.length} bot profiles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
