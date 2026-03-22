"use client";

import { useEffect, useState } from "react";

interface PlayerClockProps {
  timeMs: number;
  isActive: boolean;
  isRunning: boolean;
}

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Renders a chess clock display with optimistic client-side countdown.
 * Shows time in mm:ss format, turns red when below 30 seconds, and
 * dims when inactive.
 *
 * @param props - {@link PlayerClockProps}
 * @returns The formatted clock element.
 */
export default function PlayerClock({ timeMs, isActive, isRunning }: PlayerClockProps) {
  const [display, setDisplay] = useState(timeMs);

  useEffect(() => {
    setDisplay(timeMs);
  }, [timeMs]);

  // Optimistic countdown
  useEffect(() => {
    if (!isActive || !isRunning) return;

    const start = Date.now();
    const startTime = timeMs;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setDisplay(Math.max(0, startTime - elapsed));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, isRunning, timeMs]);

  const isLow = display < 30_000;

  return (
    <div
      className={`font-mono text-2xl font-bold px-4 py-2 rounded ${
        isActive
          ? isLow
            ? "bg-red-900 text-red-300"
            : "bg-gray-700 text-white"
          : "bg-gray-800 text-gray-500"
      }`}
    >
      {formatClock(display)}
    </div>
  );
}
