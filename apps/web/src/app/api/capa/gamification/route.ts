import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================
// CAPA SYSTEM 15: GAMIFICATION & LEADERBOARDS
// ============================================
// Gamify quality improvement activities
// Badges, achievements, points, leaderboards
// Team competitions, individual recognition
// Drive engagement and continuous improvement

// Award Points Schema
const awardPointsSchema = z.object({
  userId: z.string(),
  activityType: z.enum([
    "CAPA_CREATED",
    "CAPA_CLOSED",
    "ROOT_CAUSE_IDENTIFIED",
    "EFFECTIVENESS_VERIFIED",
    "TRAINING_COMPLETED",
    "NCR_RESOLVED",
    "ZERO_DEFECTS_MONTH",
    "COST_SAVINGS",
    "CUSTOMER_SATISFACTION",
    "PROCESS_IMPROVEMENT",
  ]),
  points: z.number().positive(),
  relatedEntityId: z.string().optional(),
  notes: z.string().optional(),
});

// Badge Award Schema
const badgeAwardSchema = z.object({
  userId: z.string(),
  badgeType: z.string(),
  reason: z.string(),
});

// ============================================
// BADGE DEFINITIONS
// ============================================

const BADGE_LIBRARY = {
  // CAPA Completion Badges
  FIRST_CAPA: {
    name: "First CAPA",
    description: "Closed your first CAPA",
    icon: "🎯",
    rarity: "COMMON",
    points: 10,
  },
  CAPA_CHAMPION_10: {
    name: "CAPA Champion",
    description: "Closed 10 CAPAs",
    icon: "⭐",
    rarity: "UNCOMMON",
    points: 50,
  },
  CAPA_MASTER_50: {
    name: "CAPA Master",
    description: "Closed 50 CAPAs",
    icon: "🏆",
    rarity: "RARE",
    points: 250,
  },
  CAPA_LEGEND_100: {
    name: "CAPA Legend",
    description: "Closed 100 CAPAs",
    icon: "👑",
    rarity: "LEGENDARY",
    points: 1000,
  },

  // Speed Badges
  SPEED_DEMON: {
    name: "Speed Demon",
    description: "Closed CAPA in under 7 days",
    icon: "⚡",
    rarity: "UNCOMMON",
    points: 30,
  },
  LIGHTNING_FAST: {
    name: "Lightning Fast",
    description: "Closed CAPA in under 3 days",
    icon: "⚡⚡",
    rarity: "RARE",
    points: 75,
  },

  // Quality Badges
  ZERO_DEFECTS: {
    name: "Zero Defects",
    description: "Full month with no NCRs",
    icon: "💎",
    rarity: "RARE",
    points: 100,
  },
  PERFECT_RECORD: {
    name: "Perfect Record",
    description: "100% CAPA effectiveness for 10+ CAPAs",
    icon: "✨",
    rarity: "RARE",
    points: 150,
  },

  // Root Cause Analysis
  ROOT_CAUSE_DETECTIVE: {
    name: "Root Cause Detective",
    description: "Identified 10 root causes using 5-Whys",
    icon: "🔍",
    rarity: "UNCOMMON",
    points: 40,
  },
  FISHBONE_EXPERT: {
    name: "Fishbone Expert",
    description: "Used Ishikawa diagram for complex analysis",
    icon: "🐟",
    rarity: "UNCOMMON",
    points: 40,
  },

  // Training & Development
  KNOWLEDGE_SEEKER: {
    name: "Knowledge Seeker",
    description: "Completed 5 CAPA-related trainings",
    icon: "📚",
    rarity: "COMMON",
    points: 25,
  },
  TRAINING_MASTER: {
    name: "Training Master",
    description: "Completed 20 trainings with 100% scores",
    icon: "🎓",
    rarity: "RARE",
    points: 100,
  },

  // Cost Savings
  COST_CUTTER: {
    name: "Cost Cutter",
    description: "CAPA saved $10K+ in quality costs",
    icon: "💰",
    rarity: "UNCOMMON",
    points: 50,
  },
  SAVINGS_CHAMPION: {
    name: "Savings Champion",
    description: "Total savings exceeded $100K",
    icon: "💵",
    rarity: "LEGENDARY",
    points: 500,
  },

  // Team Player
  TEAM_PLAYER: {
    name: "Team Player",
    description: "Contributed to 5 team CAPAs",
    icon: "🤝",
    rarity: "COMMON",
    points: 20,
  },
  COLLABORATION_KING: {
    name: "Collaboration King",
    description: "Led 10 cross-functional CAPA teams",
    icon: "👥",
    rarity: "RARE",
    points: 150,
  },

  // Special Achievements
  EARLY_BIRD: {
    name: "Early Bird",
    description: "First to log in today",
    icon: "🌅",
    rarity: "COMMON",
    points: 5,
  },
  NIGHT_OWL: {
    name: "Night Owl",
    description: "Closed CAPA after 10 PM",
    icon: "🦉",
    rarity: "UNCOMMON",
    points: 15,
  },
  WEEKEND_WARRIOR: {
    name: "Weekend Warrior",
    description: "Worked on CAPA during weekend",
    icon: "💪",
    rarity: "UNCOMMON",
    points: 20,
  },
};

// ============================================
// POINTS SYSTEM
// ============================================

const POINT_VALUES = {
  CAPA_CREATED: 5,
  CAPA_CLOSED: 25,
  ROOT_CAUSE_IDENTIFIED: 15,
  EFFECTIVENESS_VERIFIED: 30,
  TRAINING_COMPLETED: 10,
  NCR_RESOLVED: 20,
  ZERO_DEFECTS_MONTH: 100,
  COST_SAVINGS: 50, // Base, multiplied by savings amount
  CUSTOMER_SATISFACTION: 40,
  PROCESS_IMPROVEMENT: 35,
};

// ============================================
// GET: Retrieve leaderboards, badges, achievements
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leaderboardType = searchParams.get("leaderboardType"); // INDIVIDUAL, TEAM, DEPARTMENT
    const timeframe = searchParams.get("timeframe") || "ALL_TIME"; // THIS_WEEK, THIS_MONTH, THIS_QUARTER, ALL_TIME
    const userId = searchParams.get("userId");
    const badgeId = searchParams.get("badgeId");

    // Get specific badge
    if (badgeId) {
      const badge = await prisma.qualityBadge.findUnique({
        where: { id: badgeId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({ badge });
    }

    // Get user's achievements
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          qualityPoints: {
            orderBy: { awardedAt: "desc" },
            take: 20,
          },
          qualityBadges: {
            orderBy: { awardedAt: "desc" },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Calculate total points
      const totalPoints = await prisma.qualityPoint.aggregate({
        where: { userId },
        _sum: { points: true },
      });

      // Get user's rank
      const usersWithPoints = await prisma.qualityPoint.groupBy({
        by: ["userId"],
        _sum: { points: true },
        orderBy: { _sum: { points: "desc" } },
      });

      const userRank =
        usersWithPoints.findIndex((u) => u.userId === userId) + 1;

      return NextResponse.json({
        user,
        totalPoints: totalPoints._sum.points || 0,
        rank: userRank,
        totalBadges: user.qualityBadges.length,
        recentActivity: user.qualityPoints,
      });
    }

    // Calculate timeframe filter
    let startDate: Date | undefined;
    if (timeframe === "THIS_WEEK") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === "THIS_MONTH") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeframe === "THIS_QUARTER") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
    }

    // Build leaderboard
    const pointsWhere: any = {
      user: {
        organizationId: session.user.organizationId,
      },
    };

    if (startDate) {
      pointsWhere.awardedAt = { gte: startDate };
    }

    // Individual Leaderboard
    if (leaderboardType === "INDIVIDUAL" || !leaderboardType) {
      const leaderboard = await prisma.qualityPoint.groupBy({
        by: ["userId"],
        where: pointsWhere,
        _sum: { points: true },
        _count: { id: true },
        orderBy: { _sum: { points: "desc" } },
        take: 50,
      });

      // Fetch user details
      const userIds = leaderboard.map((l) => l.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      });

      const enrichedLeaderboard = leaderboard.map((entry, index) => {
        const user = users.find((u) => u.id === entry.userId);
        return {
          rank: index + 1,
          userId: entry.userId,
          userName: user?.name || "Unknown",
          userEmail: user?.email,
          department: user?.department,
          totalPoints: entry._sum.points || 0,
          activitiesCount: entry._count.id,
        };
      });

      return NextResponse.json({
        leaderboardType: "INDIVIDUAL",
        timeframe,
        leaderboard: enrichedLeaderboard,
      });
    }

    // Team/Department Leaderboard
    if (leaderboardType === "TEAM" || leaderboardType === "DEPARTMENT") {
      const users = await prisma.user.findMany({
        where: { organizationId: session.user.organizationId },
        select: {
          id: true,
          department: true,
          qualityPoints: {
            where: startDate ? { awardedAt: { gte: startDate } } : undefined,
          },
        },
      });

      // Group by department
      const departmentScores: Record<
        string,
        { points: number; members: number }
      > = {};

      users.forEach((user) => {
        const dept = user.department || "Unassigned";
        if (!departmentScores[dept]) {
          departmentScores[dept] = { points: 0, members: 0 };
        }
        departmentScores[dept].points += user.qualityPoints.reduce(
          (sum, p) => sum + p.points,
          0,
        );
        departmentScores[dept].members++;
      });

      const departmentLeaderboard = Object.entries(departmentScores)
        .map(([department, data]) => ({
          department,
          totalPoints: data.points,
          averagePointsPerMember: Math.round(data.points / data.members),
          memberCount: data.members,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((entry, index) => ({
          rank: index + 1,
          ...entry,
        }));

      return NextResponse.json({
        leaderboardType: "DEPARTMENT",
        timeframe,
        leaderboard: departmentLeaderboard,
      });
    }

    return NextResponse.json(
      { error: "Invalid leaderboard type" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Gamification GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve gamification data" },
      { status: 500 },
    );
  }
}

// ============================================
// POST: Award points, badges, achievements
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // ==========================================
    // ACTION: AWARD_POINTS
    // ==========================================
    if (action === "AWARD_POINTS") {
      const data = awardPointsSchema.parse(body);

      // Create point award
      const pointAward = await prisma.qualityPoint.create({
        data: {
          userId: data.userId,
          activityType: data.activityType,
          points: data.points,
          relatedEntityId: data.relatedEntityId,
          notes: data.notes,
          awardedBy: session.user.id,
          awardedAt: new Date(),
        },
      });

      // Check for badge eligibility
      const newBadges = await checkAndAwardBadges(
        data.userId,
        data.activityType,
      );

      return NextResponse.json({
        success: true,
        pointAward,
        newBadges,
        message: `Awarded ${data.points} points for ${data.activityType}`,
      });
    }

    // ==========================================
    // ACTION: AWARD_BADGE
    // ==========================================
    if (action === "AWARD_BADGE") {
      const data = badgeAwardSchema.parse(body);

      // Check if badge already awarded
      const existing = await prisma.qualityBadge.findFirst({
        where: {
          userId: data.userId,
          badgeType: data.badgeType,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Badge already awarded to user" },
          { status: 400 },
        );
      }

      // Get badge info
      const badgeInfo =
        BADGE_LIBRARY[data.badgeType as keyof typeof BADGE_LIBRARY];
      if (!badgeInfo) {
        return NextResponse.json(
          { error: "Invalid badge type" },
          { status: 400 },
        );
      }

      // Award badge
      const badge = await prisma.qualityBadge.create({
        data: {
          userId: data.userId,
          badgeType: data.badgeType,
          badgeName: badgeInfo.name,
          badgeDescription: badgeInfo.description,
          badgeIcon: badgeInfo.icon,
          rarity: badgeInfo.rarity,
          reason: data.reason,
          awardedBy: session.user.id,
          awardedAt: new Date(),
        },
      });

      // Award bonus points for badge
      await prisma.qualityPoint.create({
        data: {
          userId: data.userId,
          activityType: "PROCESS_IMPROVEMENT",
          points: badgeInfo.points,
          notes: `Bonus points for earning ${badgeInfo.name} badge`,
          awardedBy: session.user.id,
          awardedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        badge,
        bonusPoints: badgeInfo.points,
        message: `Awarded ${badgeInfo.name} badge!`,
      });
    }

    // ==========================================
    // ACTION: AUTO_AWARD_CAPA_POINTS
    // ==========================================
    if (action === "AUTO_AWARD_CAPA_POINTS") {
      const { capaId, eventType } = body;

      if (!capaId || !eventType) {
        return NextResponse.json(
          { error: "Missing capaId or eventType" },
          { status: 400 },
        );
      }

      // Get CAPA details
      const capa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: capaId,
          organizationId: session.user.organizationId,
        },
      });

      if (!capa) {
        return NextResponse.json({ error: "CAPA not found" }, { status: 404 });
      }

      let points = 0;
      let activityType: any = "PROCESS_IMPROVEMENT";
      let targetUserId = capa.assignedTo || capa.createdBy;

      // Determine points based on event
      if (eventType === "CREATED") {
        points = POINT_VALUES.CAPA_CREATED;
        activityType = "CAPA_CREATED";
        targetUserId = capa.createdBy;
      } else if (eventType === "CLOSED") {
        points = POINT_VALUES.CAPA_CLOSED;
        activityType = "CAPA_CLOSED";

        // Bonus for speed
        const createdAt = new Date(capa.createdAt);
        const closedAt = capa.closedDate
          ? new Date(capa.closedDate)
          : new Date();
        const daysToClose = Math.floor(
          (closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysToClose <= 3) {
          points += 50; // Lightning fast bonus
        } else if (daysToClose <= 7) {
          points += 25; // Speed demon bonus
        }
      } else if (eventType === "EFFECTIVENESS_VERIFIED") {
        points = POINT_VALUES.EFFECTIVENESS_VERIFIED;
        activityType = "EFFECTIVENESS_VERIFIED";
      }

      // Award points
      const pointAward = await prisma.qualityPoint.create({
        data: {
          userId: targetUserId,
          activityType,
          points,
          relatedEntityId: capaId,
          notes: `CAPA ${capa.capaNumber}: ${eventType}`,
          awardedBy: session.user.id,
          awardedAt: new Date(),
        },
      });

      // Check badges
      const newBadges = await checkAndAwardBadges(targetUserId, activityType);

      return NextResponse.json({
        success: true,
        pointAward,
        newBadges,
        points,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Gamification POST error:", error);
    return NextResponse.json(
      { error: "Failed to process gamification action" },
      { status: 500 },
    );
  }
}

// ============================================
// Helper: Check and award badges
// ============================================

async function checkAndAwardBadges(userId: string, activityType: string) {
  const newBadges = [];

  try {
    // Get user's CAPA history
    const closedCAPAs = await prisma.correctivePreventiveAction.count({
      where: {
        assignedTo: userId,
        status: "CLOSED",
      },
    });

    // CAPA milestone badges
    if (closedCAPAs === 1) {
      const badge = await awardBadgeIfNotExists(
        userId,
        "FIRST_CAPA",
        "Closed first CAPA",
      );
      if (badge) newBadges.push(badge);
    } else if (closedCAPAs === 10) {
      const badge = await awardBadgeIfNotExists(
        userId,
        "CAPA_CHAMPION_10",
        "Closed 10 CAPAs",
      );
      if (badge) newBadges.push(badge);
    } else if (closedCAPAs === 50) {
      const badge = await awardBadgeIfNotExists(
        userId,
        "CAPA_MASTER_50",
        "Closed 50 CAPAs",
      );
      if (badge) newBadges.push(badge);
    } else if (closedCAPAs === 100) {
      const badge = await awardBadgeIfNotExists(
        userId,
        "CAPA_LEGEND_100",
        "Closed 100 CAPAs",
      );
      if (badge) newBadges.push(badge);
    }

    // Training badges
    if (activityType === "TRAINING_COMPLETED") {
      const trainingsCompleted = await prisma.capaTrainingCompletion.count({
        where: {
          enrollment: {
            userId,
            status: "VERIFIED",
          },
        },
      });

      if (trainingsCompleted === 5) {
        const badge = await awardBadgeIfNotExists(
          userId,
          "KNOWLEDGE_SEEKER",
          "Completed 5 trainings",
        );
        if (badge) newBadges.push(badge);
      } else if (trainingsCompleted === 20) {
        const badge = await awardBadgeIfNotExists(
          userId,
          "TRAINING_MASTER",
          "Completed 20 trainings",
        );
        if (badge) newBadges.push(badge);
      }
    }
  } catch (error) {
    console.error("Badge check error:", error);
  }

  return newBadges;
}

async function awardBadgeIfNotExists(
  userId: string,
  badgeType: string,
  reason: string,
) {
  const existing = await prisma.qualityBadge.findFirst({
    where: { userId, badgeType },
  });

  if (existing) return null;

  const badgeInfo = BADGE_LIBRARY[badgeType as keyof typeof BADGE_LIBRARY];
  if (!badgeInfo) return null;

  return await prisma.qualityBadge.create({
    data: {
      userId,
      badgeType,
      badgeName: badgeInfo.name,
      badgeDescription: badgeInfo.description,
      badgeIcon: badgeInfo.icon,
      rarity: badgeInfo.rarity,
      reason,
      awardedBy: userId, // Self-awarded for milestones
      awardedAt: new Date(),
    },
  });
}
