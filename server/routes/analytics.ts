// server/routes/analytics.ts
import express from "express";
import { db } from "../db";
import { tasks as tasksTable, users as usersTable } from "@shared/schema";
import { eq, and, sql, count, desc } from "drizzle-orm";

const router = express.Router();

// Session-based authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.user) {
    console.log("❌ [ANALYTICS AUTH] No user in session - returning 401");
    return res.status(401).json({
      error: "Unauthorized - Please log in again",
      code: "NO_SESSION",
    });
  }
  req.user = req.session.user;
  next();
};

// Analytics storage methods
const analyticsStorage = {
  // Get comprehensive analytics for a user
  async getUserAnalytics(userId: number) {
    try {
      console.time(`getUserAnalytics-${userId}`);

      // Get all user tasks
      const userTasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.userId, userId))
        .orderBy(tasksTable.createdAt);

      // Calculate basic stats
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const inProgressTasks = userTasks.filter(
        (task) => task.status === "in-progress",
      ).length;
      const pendingTasks = userTasks.filter(
        (task) => task.status === "pending" || !task.status,
      ).length;
      const completionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate subject performance
      const subjectPerformance = userTasks.reduce((acc: any[], task: any) => {
        const subject = task.subject || "Uncategorized";
        const existing = acc.find((item) => item.name === subject);
        if (existing) {
          existing.total++;
          if (task.status === "completed") existing.completed++;
        } else {
          acc.push({
            name: subject,
            total: 1,
            completed: task.status === "completed" ? 1 : 0,
          });
        }
        return acc;
      }, []);

      // Calculate progress over time (last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const recentCompletedTasks = userTasks.filter(
        (task) =>
          task.status === "completed" &&
          task.updatedAt &&
          new Date(task.updatedAt) >= fourWeeksAgo,
      );

      // Group by week
      const weeklyProgress = Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7 * (4 - i));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekTasks = recentCompletedTasks.filter((task) => {
          if (!task.updatedAt) return false;
          const taskDate = new Date(task.updatedAt);
          return taskDate >= weekStart && taskDate < weekEnd;
        });

        return {
          date: `Week ${i + 1}`,
          tasks: weekTasks.length,
        };
      });

      // Calculate streak (consecutive days with completed tasks)
      let streak = 0;
      const today = new Date();
      let currentDate = new Date(today);

      // Check up to 30 days back
      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const hasCompletedTask = userTasks.some(
          (task) =>
            task.status === "completed" &&
            task.updatedAt &&
            task.updatedAt.toISOString().split("T")[0] === dateStr,
        );

        if (hasCompletedTask) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate level and points based on completed tasks
      const level = Math.floor(completedTasks / 5) + 1;
      const points = completedTasks * 10;

      // Calculate average completion time
      const completedTasksWithTime = userTasks.filter(
        (task) =>
          task.status === "completed" && task.createdAt && task.updatedAt,
      );

      let averageCompletionTime = 0;
      if (completedTasksWithTime.length > 0) {
        const totalTime = completedTasksWithTime.reduce((sum, task) => {
          const created = new Date(task.createdAt).getTime();
          const updated = new Date(task.updatedAt).getTime();
          return sum + (updated - created);
        }, 0);
        averageCompletionTime = totalTime / completedTasksWithTime.length;
      }

      // Calculate task distribution by status for pie chart
      const taskDistribution = [
        { name: "Completed", value: completedTasks, color: "#22c55e" },
        { name: "In Progress", value: inProgressTasks, color: "#f59e0b" },
        { name: "Pending", value: pendingTasks, color: "#ef4444" },
      ];

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = userTasks
        .filter(
          (task) => task.updatedAt && new Date(task.updatedAt) >= sevenDaysAgo,
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 10)
        .map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          subject: task.subject,
          updatedAt: task.updatedAt,
          type: task.status === "completed" ? "completed" : "updated",
        }));

      const analyticsData = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        streak,
        level,
        points,
        subjectPerformance,
        progressOverTime: weeklyProgress,
        taskDistribution,
        averageCompletionTime,
        recentActivity,
        lastUpdated: new Date().toISOString(),
      };

      console.timeEnd(`getUserAnalytics-${userId}`);
      console.log(`📊 [ANALYTICS] Generated analytics for user ${userId}:`, {
        totalTasks,
        completedTasks,
        completionRate: `${completionRate.toFixed(1)}%`,
        streak,
        level,
      });

      return analyticsData;
    } catch (error) {
      console.error("❌ [ANALYTICS] Error generating user analytics:", error);
      throw error;
    }
  },

  // Get detailed subject analytics
  async getSubjectAnalytics(userId: number) {
    try {
      const userTasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.userId, userId));

      const subjectStats = userTasks.reduce((acc: any, task) => {
        const subject = task.subject || "Uncategorized";
        if (!acc[subject]) {
          acc[subject] = {
            name: subject,
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            completionRate: 0,
            averageTime: 0,
          };
        }

        acc[subject].total++;
        if (task.status === "completed") {
          acc[subject].completed++;
        } else if (task.status === "in-progress") {
          acc[subject].inProgress++;
        } else {
          acc[subject].pending++;
        }

        return acc;
      }, {});

      // Calculate completion rates
      Object.values(subjectStats).forEach((subject: any) => {
        subject.completionRate =
          subject.total > 0 ? (subject.completed / subject.total) * 100 : 0;
      });

      return Object.values(subjectStats);
    } catch (error) {
      console.error("❌ [ANALYTICS] Error getting subject analytics:", error);
      throw error;
    }
  },

  // Get progress trends over time
  async getProgressTrends(userId: number, days: number = 30) {
    try {
      const userTasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.userId, userId));

      const trends = [];
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayTasks = userTasks.filter((task) => {
          if (!task.createdAt) return false;
          const taskDate = task.createdAt.toISOString().split("T")[0];
          return taskDate === dateStr;
        });

        const completedTasks = userTasks.filter(
          (task) =>
            task.status === "completed" &&
            task.updatedAt &&
            task.updatedAt.toISOString().split("T")[0] === dateStr,
        );

        trends.push({
          date: dateStr,
          created: dayTasks.length,
          completed: completedTasks.length,
        });
      }

      return trends;
    } catch (error) {
      console.error("❌ [ANALYTICS] Error getting progress trends:", error);
      throw error;
    }
  },
};

// ✅ GET /api/analytics - Main analytics endpoint
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    console.log("📊 [ANALYTICS] Fetching analytics for user:", userId);

    const analyticsData = await analyticsStorage.getUserAnalytics(userId);

    res.json({
      success: true,
      data: analyticsData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [ANALYTICS] Error fetching analytics:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch analytics",
      code: "ANALYTICS_FETCH_ERROR",
    });
  }
});

// ✅ GET /api/analytics/subjects - Detailed subject analytics
router.get("/subjects", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    console.log("📊 [ANALYTICS] Fetching subject analytics for user:", userId);

    const subjectAnalytics = await analyticsStorage.getSubjectAnalytics(userId);

    res.json({
      success: true,
      data: subjectAnalytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [ANALYTICS] Error fetching subject analytics:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch subject analytics",
      code: "SUBJECT_ANALYTICS_ERROR",
    });
  }
});

// ✅ GET /api/analytics/trends - Progress trends over time
router.get("/trends", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const { days = "30" } = req.query;

    console.log(
      "📊 [ANALYTICS] Fetching progress trends for user:",
      userId,
      "days:",
      days,
    );

    const trends = await analyticsStorage.getProgressTrends(
      userId,
      parseInt(days as string),
    );

    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [ANALYTICS] Error fetching progress trends:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch progress trends",
      code: "TRENDS_ANALYTICS_ERROR",
    });
  }
});

// ✅ GET /api/analytics/overview - Quick overview (for dashboards)
router.get("/overview", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    console.log("📊 [ANALYTICS] Fetching overview for user:", userId);

    const analyticsData = await analyticsStorage.getUserAnalytics(userId);

    // Return only essential overview data
    const overview = {
      totalTasks: analyticsData.totalTasks,
      completedTasks: analyticsData.completedTasks,
      completionRate: analyticsData.completionRate,
      streak: analyticsData.streak,
      level: analyticsData.level,
      points: analyticsData.points,
      recentActivity: analyticsData.recentActivity.slice(0, 5),
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [ANALYTICS] Error fetching overview:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch overview",
      code: "OVERVIEW_ANALYTICS_ERROR",
    });
  }
});

export default router;
