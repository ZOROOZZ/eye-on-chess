"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/auth";
import { Skeleton } from "../../components/Skeleton";

interface RatingPoint {
  date: string;
  rating: number;
}

interface OpeningEntry {
  name: string;
  eco: string;
  wins: number;
  losses: number;
  draws: number;
  count: number;
}

interface StatsData {
  rating: { current: number; history: RatingPoint[] };
  record: {
    wins: number;
    losses: number;
    draws: number;
    vsHuman: { wins: number; losses: number; draws: number };
    vsBot: { wins: number; losses: number; draws: number };
  };
  openings: OpeningEntry[];
  accuracy: {
    average: number | null;
    best: { value: number; gameId: string } | null;
    worst: { value: number; gameId: string } | null;
    gamesAnalyzed: number;
  };
  streaks: {
    current: { type: "win" | "loss" | "none"; count: number };
    bestWin: number;
  };
  activity: { date: string; count: number }[];
  totalGames: number;
}

// ── SVG Rating Chart ────────────────────────────────────
function RatingChart({ history }: { history: RatingPoint[] }) {
  if (history.length < 2) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center h-48 text-gray-500 text-sm">
        Play more rated games to see your rating chart
      </div>
    );
  }

  const W = 600;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 30, left: 45 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const ratings = history.map((p) => p.rating);
  const minR = Math.min(...ratings) - 20;
  const maxR = Math.max(...ratings) + 20;
  const rangeR = maxR - minR || 1;

  const points = history.map((p, i) => {
    const x = PAD.left + (i / (history.length - 1)) * plotW;
    const y = PAD.top + plotH - ((p.rating - minR) / rangeR) * plotH;
    return { x, y, ...p };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD.top + plotH} L ${points[0].x} ${PAD.top + plotH} Z`;

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) =>
    Math.round(minR + (rangeR * i) / (yTicks - 1))
  );

  // X-axis labels (first, middle, last)
  const xLabels = [
    history[0],
    history[Math.floor(history.length / 2)],
    history[history.length - 1],
  ];
  const xPositions = [0, Math.floor(history.length / 2), history.length - 1];

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">Rating History</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Grid lines */}
        {yTickValues.map((v) => {
          const y = PAD.top + plotH - ((v - minR) / rangeR) * plotH;
          return (
            <g key={v}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="#374151"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 5}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-500"
                fontSize="10"
              >
                {v}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill="url(#ratingGradient)" opacity="0.3" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" />
        {/* End dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill="#3b82f6"
        />
        {/* X labels */}
        {xLabels.map((p, i) => {
          const idx = xPositions[i];
          const x = PAD.left + (idx / (history.length - 1)) * plotW;
          return (
            <text
              key={i}
              x={x}
              y={H - 5}
              textAnchor="middle"
              className="fill-gray-500"
              fontSize="10"
            >
              {p.date.slice(5)}
            </text>
          );
        })}
        <defs>
          <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ── Record Bar ──────────────────────────────────────────
function RecordBar({
  label,
  wins,
  losses,
  draws,
}: {
  label: string;
  wins: number;
  losses: number;
  draws: number;
}) {
  const total = wins + losses + draws;
  if (total === 0) {
    return (
      <div className="text-sm">
        <span className="text-gray-400">{label}:</span>{" "}
        <span className="text-gray-500">No games</span>
      </div>
    );
  }
  const wPct = (wins / total) * 100;
  const dPct = (draws / total) * 100;
  const lPct = (losses / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-gray-400 text-xs">
          <span className="text-green-400">{wins}W</span>{" "}
          <span className="text-gray-400">{draws}D</span>{" "}
          <span className="text-red-400">{losses}L</span>
        </span>
      </div>
      <div className="flex h-3 rounded overflow-hidden bg-gray-700">
        {wPct > 0 && <div className="bg-green-500 transition-all" style={{ width: `${wPct}%` }} />}
        {dPct > 0 && <div className="bg-gray-500 transition-all" style={{ width: `${dPct}%` }} />}
        {lPct > 0 && <div className="bg-red-500 transition-all" style={{ width: `${lPct}%` }} />}
      </div>
    </div>
  );
}

// ── Openings Table ──────────────────────────────────────
function OpeningsTable({ openings }: { openings: OpeningEntry[] }) {
  if (openings.length === 0) {
    return <p className="text-gray-500 text-sm">No opening data yet</p>;
  }
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Top Openings</h3>
      <div className="space-y-2">
        {openings.map((o) => {
          const total = o.count;
          const winRate = total > 0 ? Math.round((o.wins / total) * 100) : 0;
          return (
            <div key={o.eco} className="flex items-center justify-between text-sm">
              <div className="min-w-0 flex-1">
                <span className="text-gray-400 font-mono text-xs mr-2">{o.eco}</span>
                <span className="text-gray-200 truncate">{o.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-gray-400 text-xs">{total} games</span>
                <span
                  className={`text-xs font-medium ${winRate >= 50 ? "text-green-400" : "text-red-400"}`}
                >
                  {winRate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Accuracy Card ───────────────────────────────────────
function AccuracyCard({ accuracy }: { accuracy: StatsData["accuracy"] }) {
  if (accuracy.gamesAnalyzed === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Accuracy</h3>
        <p className="text-gray-500 text-sm">No analyzed games yet</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Accuracy</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-400">{accuracy.average}%</div>
          <div className="text-xs text-gray-500">Average</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">{accuracy.best?.value}%</div>
          <div className="text-xs text-gray-500">Best</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-400">{accuracy.worst?.value}%</div>
          <div className="text-xs text-gray-500">Worst</div>
        </div>
      </div>
      <div className="text-xs text-gray-500 text-center mt-2">
        {accuracy.gamesAnalyzed} games analyzed
      </div>
    </div>
  );
}

// ── Streak Badge ────────────────────────────────────────
function StreakBadge({ streaks }: { streaks: StatsData["streaks"] }) {
  const { current, bestWin } = streaks;
  const streakColor =
    current.type === "win"
      ? "text-green-400"
      : current.type === "loss"
        ? "text-red-400"
        : "text-gray-400";
  const streakLabel =
    current.type === "win"
      ? `${current.count} win streak`
      : current.type === "loss"
        ? `${current.count} loss streak`
        : "No active streak";

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Streaks</h3>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-lg font-bold ${streakColor}`}>{streakLabel}</div>
          <div className="text-xs text-gray-500">Current</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-yellow-400">{bestWin}</div>
          <div className="text-xs text-gray-500">Best Win Streak</div>
        </div>
      </div>
    </div>
  );
}

// ── Activity Bar Chart ──────────────────────────────────
function ActivityChart({ activity }: { activity: StatsData["activity"] }) {
  if (activity.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Activity (30 days)</h3>
        <p className="text-gray-500 text-sm">No recent games</p>
      </div>
    );
  }

  const maxCount = Math.max(...activity.map((a) => a.count));

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Activity (30 days)</h3>
      <div className="flex items-end gap-1 h-24">
        {activity.map((a) => {
          const height = maxCount > 0 ? (a.count / maxCount) * 100 : 0;
          return (
            <div key={a.date} className="flex-1 group relative">
              <div
                className="bg-blue-500 hover:bg-blue-400 rounded-t transition-colors w-full"
                style={{ height: `${height}%`, minHeight: a.count > 0 ? "4px" : "0" }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                {a.date.slice(5)}: {a.count} games
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stats Page ──────────────────────────────────────────
export default function StatsPage() {
  const router = useRouter();
  const { user, isLoading, fetchMe } = useAuthStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) fetchMe();
  }, [user, fetchMe]);
  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .get("/api/stats")
      .then(({ data }) => setStats(data))
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, [user]);

  if (isLoading || !user) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-12">
      <div className="max-w-2xl w-full space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Stats</h1>
          {stats && (
            <p className="text-gray-400 text-sm mt-1">
              {stats.totalGames} games played &middot; Rating: {stats.rating.current}
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-52 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
            <Skeleton className="h-36 rounded-lg" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-12">{error}</div>
        ) : stats ? (
          <>
            {/* Rating Chart */}
            <RatingChart history={stats.rating.history} />

            {/* Win/Loss/Draw Records */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">Record</h3>
              <RecordBar label="Overall" {...stats.record} />
              <RecordBar label="vs Humans" {...stats.record.vsHuman} />
              <RecordBar label="vs Bots" {...stats.record.vsBot} />
            </div>

            {/* Two-column grid for accuracy + streaks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AccuracyCard accuracy={stats.accuracy} />
              <StreakBadge streaks={stats.streaks} />
            </div>

            {/* Openings */}
            <OpeningsTable openings={stats.openings} />

            {/* Activity */}
            <ActivityChart activity={stats.activity} />
          </>
        ) : null}

        <div className="text-center">
          <Link href="/play" className="text-gray-400 hover:text-white text-sm">
            &larr; Back to Play
          </Link>
        </div>
      </div>
    </main>
  );
}
