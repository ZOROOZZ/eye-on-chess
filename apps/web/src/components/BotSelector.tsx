"use client";

import {
  getEloBand,
  ELO_BAND_COLORS,
  BOT_CATEGORY_LABELS,
  type BotPersonality,
  type BotCategory,
} from "@eyeonchess/chess";

/**
 * Props for the {@link BotSelector} component.
 */
interface BotSelectorProps {
  /** The currently selected bot personality, or `null` if none. */
  selected: BotPersonality | null;
  /** Callback fired when the user clicks a bot card. */
  onSelect: (bot: BotPersonality) => void;
  /** The list of bot personalities to display. */
  bots: BotPersonality[];
}

const CATEGORY_ORDER: BotCategory[] = [
  "beginner",
  "novice",
  "intermediate",
  "advanced",
  "expert",
  "master",
  "grandmaster",
];

/**
 * A scrollable grid of bot personality cards grouped by skill category.
 *
 * Each category (Beginner, Novice, etc.) has a header with Elo range,
 * followed by bot cards showing avatar, name, Elo badge, and description.
 * The selected bot receives a colored ring matching its Elo band.
 */
export default function BotSelector({ selected, onSelect, bots }: BotSelectorProps) {
  // Group bots by category
  const grouped = new Map<BotCategory, BotPersonality[]>();
  for (const cat of CATEGORY_ORDER) {
    const catBots = bots.filter((b) => b.category === cat);
    if (catBots.length > 0) grouped.set(cat, catBots);
  }

  return (
    <div className="max-h-[480px] overflow-y-auto pr-1 space-y-4">
      {CATEGORY_ORDER.map((cat) => {
        const catBots = grouped.get(cat);
        if (!catBots) return null;
        const label = BOT_CATEGORY_LABELS[cat];
        const bandColor = ELO_BAND_COLORS[getEloBand(catBots[0].elo)];

        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-900/95 backdrop-blur py-1 z-10">
              <span className={`text-sm font-bold ${bandColor.text}`}>{label.name}</span>
              <span className="text-xs text-gray-500">{label.eloRange}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {catBots.map((bot) => {
                const band = getEloBand(bot.elo);
                const colors = ELO_BAND_COLORS[band];
                const isSelected = selected?.id === bot.id;

                return (
                  <button
                    key={bot.id}
                    onClick={() => onSelect(bot)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg text-left transition-all
                      ${isSelected ? `ring-2 ${colors.ring} bg-gray-800` : "bg-gray-800/60 hover:bg-gray-700/80"}
                    `}
                  >
                    <span className="text-3xl flex-shrink-0" role="img" aria-label={bot.name}>
                      {bot.avatar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-white truncate">{bot.name}</span>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.bg} text-white`}
                        >
                          {bot.elo}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{bot.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
