# Bot Personalities

EyeOnChess features 31 distinct bot personalities ranging from 200 to 3200 Elo, each with unique playstyles and behaviors.

## Tiers

Bots are organized into three tiers based on how their moves are generated:

| Tier       | Elo Range | Engine               | Description                                                                     |
| ---------- | --------- | -------------------- | ------------------------------------------------------------------------------- |
| **Custom** | 200-1200  | JS minimax           | Pure JavaScript with personality quirks — random moves, blunders, capture greed |
| **Hybrid** | 1300-1900 | Stockfish + blunders | Stockfish at limited depth with chance to play random moves                     |
| **Engine** | 2000-3200 | Stockfish UCI_Elo    | Full Stockfish with Elo-limited strength                                        |

## Behavior Parameters

Each bot has tunable parameters that control its playstyle:

| Parameter          | Range   | Effect                                                  |
| ------------------ | ------- | ------------------------------------------------------- |
| `randomMoveChance` | 0-0.5   | Chance to play a completely random legal move           |
| `blunderChance`    | 0-0.3   | Chance to deliberately miss the best move               |
| `captureGreed`     | 0-1     | Bias toward capturing pieces even when it's a bad trade |
| `aggressionBias`   | -1 to 1 | Preference for attacking (+) vs defensive (-) moves     |
| `maxDepth`         | 1-18    | How many moves ahead the bot can "see"                  |
| `queenEarly`       | bool    | Brings queen out in the first 5 moves                   |
| `pawnPusher`       | bool    | Pushes random edge pawns                                |

## The Roster

| Bot     | Elo  | Tier   | Personality                               |
| ------- | ---- | ------ | ----------------------------------------- |
| Amir    | 200  | Custom | Moves randomly. Hangs everything.         |
| Timmy   | 300  | Custom | Pushes edge pawns. Moves king for fun.    |
| Bella   | 400  | Custom | Captures everything. Queen out on move 2. |
| Rusty   | 500  | Custom | Forgets about threats immediately.        |
| Chloe   | 600  | Custom | Only pushes center pawns. Never develops. |
| Omar    | 700  | Custom | Only attacks with queen.                  |
| Noodle  | 800  | Custom | Okay openings then chaos.                 |
| Elena   | 900  | Custom | Takes every piece. Falls for every trap.  |
| Scout   | 1000 | Custom | Ultra defensive. Never attacks.           |
| Ahmed   | 1100 | Custom | 5 moves of theory then panics.            |
| Maple   | 1200 | Custom | Average club player. Occasional hangs.    |
| Viktor  | 1300 | Hybrid | Berserker. Reckless sacrifices.           |
| Sophie  | 1400 | Hybrid | Trades everything. Grinds endgame.        |
| Jin     | 1500 | Hybrid | Loves traps and gambits.                  |
| Diana   | 1600 | Hybrid | Positional. Good structure.               |
| Rook    | 1700 | Hybrid | Endgame nerd.                             |
| Nina    | 1800 | Hybrid | Sharp openings. Sometimes overextends.    |
| Felix   | 1900 | Hybrid | All-rounder. Few weaknesses.              |
| Hana    | 2000 | Engine | Technical. Rarely blunders.               |
| Kaspar  | 2100 | Engine | Tactician. Finds combinations.            |
| Yuki    | 2200 | Engine | Calm. Deep positional understanding.      |
| Boris   | 2300 | Engine | Classical old-school play.                |
| Aria    | 2400 | Engine | Dynamic. Adapts style.                    |
| Sven    | 2500 | Engine | Candidate master strength.                |
| Mei     | 2600 | Engine | IM strength.                              |
| Atlas   | 2700 | Engine | GM strength.                              |
| Titan   | 2800 | Engine | Super GM.                                 |
| Oracle  | 2900 | Engine | Engine level.                             |
| Quantum | 3000 | Engine | Inhuman.                                  |
| Erfan   | 3200 | Engine | God mode. The final boss.                 |

## Bot Selection UI

Players select a bot from a visual grid on the `/play/bot` page. Each card shows the bot's emoji avatar, name, Elo badge (color-coded by tier), and a short description.

A "Custom Elo" toggle allows advanced users to use the raw Elo slider with Stockfish directly.

## API

`GET /api/bots` returns the list of available bot personalities (no authentication required).

## Admin Management

Admins can customize bot personalities through the admin panel:

- Edit name, description, avatar, and Elo
- Tune behavior parameters with sliders
- Enable/disable individual bots

## Adding a New Bot

To add a bot personality, add an entry to `packages/chess/src/bots/personalities.ts`:

```typescript
{
  id: "unique-slug",
  name: "Display Name",
  elo: 1500,
  description: "Short personality description",
  avatar: "\u{1F600}",
  tier: "hybrid",
  randomMoveChance: 0.03,
  blunderChance: 0.08,
  captureGreed: 0.4,
  aggressionBias: 0.4,
  maxDepth: 5,
  queenEarly: false,
  pawnPusher: false,
}
```

The bot will automatically appear in the selector UI and API.
