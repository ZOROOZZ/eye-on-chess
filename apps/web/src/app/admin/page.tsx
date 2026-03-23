"use client";

import { useEffect, useState } from "react";
import { adminRequest } from "../../lib/adminApi";
import { Skeleton } from "../../components/Skeleton";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  activeGames: number;
  completedGames: number;
  gamesToday: number;
  analysisQueueDepth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminRequest("get", "/api/v1/admin/dashboard")
      .then((data) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-red-400">Failed to load dashboard.</p>;
  }

  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
    { label: "Active Users", value: stats.activeUsers, color: "text-green-400" },
    { label: "Total Games", value: stats.totalGames, color: "text-purple-400" },
    { label: "Active Games", value: stats.activeGames, color: "text-yellow-400" },
    { label: "Completed", value: stats.completedGames, color: "text-gray-300" },
    { label: "Games Today", value: stats.gamesToday, color: "text-cyan-400" },
    { label: "Analysis Queue", value: stats.analysisQueueDepth, color: "text-orange-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-gray-900 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
