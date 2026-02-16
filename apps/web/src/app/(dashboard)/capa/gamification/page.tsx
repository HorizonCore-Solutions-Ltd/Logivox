"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// ============================================
// CAPA SYSTEM 15: GAMIFICATION DASHBOARD
// ============================================
// Quality leaderboards, badges, achievements
// Drive engagement through friendly competition

interface LeaderboardEntry {
  rank: number;
  userId?: string;
  userName?: string;
  userEmail?: string;
  department?: string;
  totalPoints: number;
  activitiesCount?: number;
  averagePointsPerMember?: number;
  memberCount?: number;
}

interface Badge {
  id: string;
  badgeType: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  rarity: string;
  reason: string;
  awardedAt: string;
}

export default function GamificationPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardType, setLeaderboardType] = useState<
    "INDIVIDUAL" | "DEPARTMENT"
  >("INDIVIDUAL");
  const [timeframe, setTimeframe] = useState("THIS_MONTH");
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType, timeframe]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserStats();
    }
  }, [session]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        leaderboardType,
        timeframe,
      });

      const response = await fetch(`/api/capa/gamification?${params}`);
      const data = await response.json();

      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(
        `/api/capa/gamification?userId=${session?.user?.id}`,
      );
      const data = await response.json();

      setUserStats(data);
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "LEGENDARY":
        return "from-yellow-400 to-orange-500";
      case "RARE":
        return "from-purple-400 to-pink-500";
      case "UNCOMMON":
        return "from-blue-400 to-cyan-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "LEGENDARY":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "RARE":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "UNCOMMON":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🏆 Quality Leaderboards</h1>
          <p className="text-gray-600 mt-1">
            Compete, earn badges, and celebrate quality excellence
          </p>
        </div>
      </div>

      {/* User Stats Card */}
      {userStats && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm opacity-90">Your Rank</div>
              <div className="text-4xl font-bold mt-1">#{userStats.rank}</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Total Points</div>
              <div className="text-4xl font-bold mt-1">
                {userStats.totalPoints.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-90">Badges Earned</div>
              <div className="text-4xl font-bold mt-1">
                {userStats.totalBadges}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-90">Level</div>
              <div className="text-4xl font-bold mt-1">
                {userStats.totalPoints >= 1000
                  ? "Master"
                  : userStats.totalPoints >= 500
                    ? "Expert"
                    : userStats.totalPoints >= 100
                      ? "Advanced"
                      : "Novice"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge Collection */}
      {userStats?.user?.qualityBadges &&
        userStats.user.qualityBadges.length > 0 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">🎖️ Your Badge Collection</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {userStats.user.qualityBadges.map((badge: Badge) => (
                <div
                  key={badge.id}
                  className={`relative bg-gradient-to-br ${getRarityColor(badge.rarity)} p-4 rounded-lg shadow-lg text-white text-center transform hover:scale-105 transition-transform cursor-pointer`}
                  title={badge.badgeDescription}
                >
                  <div className="text-4xl mb-2">{badge.badgeIcon}</div>
                  <div className="text-xs font-bold">{badge.badgeName}</div>
                  <div
                    className={`absolute top-1 right-1 px-2 py-0.5 rounded text-xs font-bold border ${getRarityBadgeColor(badge.rarity)}`}
                  >
                    {badge.rarity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Leaderboard Controls */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          {/* Leaderboard Type */}
          <div className="flex gap-2">
            <button
              onClick={() => setLeaderboardType("INDIVIDUAL")}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                leaderboardType === "INDIVIDUAL"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              👤 Individual
            </button>
            <button
              onClick={() => setLeaderboardType("DEPARTMENT")}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                leaderboardType === "DEPARTMENT"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🏢 Department
            </button>
          </div>

          {/* Timeframe */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border rounded px-4 py-2"
          >
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="ALL_TIME">All Time</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-bold">
                {leaderboardType === "INDIVIDUAL" ? "User" : "Department"}
              </th>
              {leaderboardType === "INDIVIDUAL" && (
                <th className="px-6 py-4 text-left text-sm font-bold">
                  Department
                </th>
              )}
              <th className="px-6 py-4 text-center text-sm font-bold">
                Points
              </th>
              {leaderboardType === "INDIVIDUAL" ? (
                <th className="px-6 py-4 text-center text-sm font-bold">
                  Activities
                </th>
              ) : (
                <>
                  <th className="px-6 py-4 text-center text-sm font-bold">
                    Members
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold">
                    Avg/Member
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={leaderboardType === "INDIVIDUAL" ? 5 : 6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Loading leaderboard...
                </td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td
                  colSpan={leaderboardType === "INDIVIDUAL" ? 5 : 6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No data available for this timeframe
                </td>
              </tr>
            ) : (
              leaderboard.map((entry) => (
                <tr
                  key={entry.userId || entry.department}
                  className={`hover:bg-gray-50 ${
                    entry.userId === session?.user?.id
                      ? "bg-blue-50 font-bold"
                      : ""
                  }`}
                >
                  {/* Rank */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {entry.rank === 1 && <span className="text-2xl">🥇</span>}
                      {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                      {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                      <span
                        className={`text-lg ${entry.rank <= 3 ? "font-bold" : ""}`}
                      >
                        #{entry.rank}
                      </span>
                    </div>
                  </td>

                  {/* Name/Department */}
                  <td className="px-6 py-4">
                    {leaderboardType === "INDIVIDUAL" ? (
                      <div>
                        <div className="font-medium">{entry.userName}</div>
                        <div className="text-xs text-gray-500">
                          {entry.userEmail}
                        </div>
                      </div>
                    ) : (
                      <div className="font-medium text-lg">
                        {entry.department}
                      </div>
                    )}
                  </td>

                  {/* Department (Individual only) */}
                  {leaderboardType === "INDIVIDUAL" && (
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {entry.department || "N/A"}
                      </span>
                    </td>
                  )}

                  {/* Total Points */}
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`text-2xl font-bold ${
                        entry.rank === 1
                          ? "text-yellow-600"
                          : entry.rank === 2
                            ? "text-gray-500"
                            : entry.rank === 3
                              ? "text-orange-600"
                              : "text-blue-600"
                      }`}
                    >
                      {entry.totalPoints.toLocaleString()}
                    </div>
                  </td>

                  {/* Activities or Team Stats */}
                  {leaderboardType === "INDIVIDUAL" ? (
                    <td className="px-6 py-4 text-center text-gray-600">
                      {entry.activitiesCount}
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {entry.memberCount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-blue-600 font-bold">
                          {entry.averagePointsPerMember?.toLocaleString()}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Points Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">📊 How to Earn Points</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded p-3">
            <div className="font-bold text-blue-900">Create CAPA</div>
            <div className="text-2xl font-bold text-blue-600">5 pts</div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-bold text-blue-900">Close CAPA</div>
            <div className="text-2xl font-bold text-blue-600">25 pts</div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-bold text-blue-900">Verify Effectiveness</div>
            <div className="text-2xl font-bold text-blue-600">30 pts</div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-bold text-blue-900">Complete Training</div>
            <div className="text-2xl font-bold text-blue-600">10 pts</div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-bold text-blue-900">Root Cause Analysis</div>
            <div className="text-2xl font-bold text-blue-600">15 pts</div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-bold text-blue-900">Zero Defects Month</div>
            <div className="text-2xl font-bold text-blue-600">100 pts</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-blue-300">
          <div className="font-bold text-blue-900 mb-2">⚡ Speed Bonuses:</div>
          <div className="space-y-1 text-sm text-blue-800">
            <div>
              • Close CAPA in &lt;3 days:{" "}
              <span className="font-bold">+50 pts</span>
            </div>
            <div>
              • Close CAPA in &lt;7 days:{" "}
              <span className="font-bold">+25 pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Gallery */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">🎖️ Badge Gallery</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            {
              icon: "🎯",
              name: "First CAPA",
              rarity: "COMMON",
              desc: "Closed first CAPA",
            },
            {
              icon: "⭐",
              name: "Champion",
              rarity: "UNCOMMON",
              desc: "Closed 10 CAPAs",
            },
            {
              icon: "🏆",
              name: "Master",
              rarity: "RARE",
              desc: "Closed 50 CAPAs",
            },
            {
              icon: "👑",
              name: "Legend",
              rarity: "LEGENDARY",
              desc: "Closed 100 CAPAs",
            },
            {
              icon: "⚡",
              name: "Speed Demon",
              rarity: "UNCOMMON",
              desc: "Closed in &lt;7 days",
            },
            {
              icon: "💎",
              name: "Zero Defects",
              rarity: "RARE",
              desc: "Month with no NCRs",
            },
            {
              icon: "🔍",
              name: "Detective",
              rarity: "UNCOMMON",
              desc: "10 root causes found",
            },
            {
              icon: "📚",
              name: "Knowledge Seeker",
              rarity: "COMMON",
              desc: "5 trainings done",
            },
            {
              icon: "💰",
              name: "Cost Cutter",
              rarity: "UNCOMMON",
              desc: "Saved $10K+",
            },
            {
              icon: "🤝",
              name: "Team Player",
              rarity: "COMMON",
              desc: "5 team CAPAs",
            },
            {
              icon: "🦉",
              name: "Night Owl",
              rarity: "UNCOMMON",
              desc: "Worked after 10PM",
            },
            {
              icon: "💪",
              name: "Weekend Warrior",
              rarity: "UNCOMMON",
              desc: "Weekend work",
            },
          ].map((badge, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${getRarityColor(badge.rarity)} p-4 rounded-lg text-white text-center shadow-md opacity-60 hover:opacity-100 transition-opacity`}
              title={badge.desc}
            >
              <div className="text-3xl mb-1">{badge.icon}</div>
              <div className="text-xs font-bold">{badge.name}</div>
              <div
                className={`mt-2 px-2 py-0.5 rounded text-xs font-bold ${getRarityBadgeColor(badge.rarity)}`}
              >
                {badge.rarity}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
