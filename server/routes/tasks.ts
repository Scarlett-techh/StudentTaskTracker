// server/routes/tasks.ts
import express from "express";
import multer from "multer";
import { db } from "../db";
import { tasks as tasksTable, users as usersTable } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// ✅ FIXED: Simplified storage methods using only known tables
const storage = {
  // Get tasks by user ID
  async getTasksByUserId(userId: number) {
    try {
      const userTasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.userId, userId));
      return userTasks;
    } catch (error) {
      console.error("Error getting tasks by user ID:", error);
      throw error;
    }
  },

  // Get single task
  async getTask(taskId: number) {
    try {
      const [task] = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.id, taskId));
      return task;
    } catch (error) {
      console.error("Error getting task:", error);
      throw error;
    }
  },

  // Create task
  async createTask(taskData: any) {
    try {
      const [task] = await db.insert(tasksTable).values(taskData).returning();
      return task;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  // Update task
  async updateTask(taskId: number, updateData: any) {
    try {
      const [task] = await db
        .update(tasksTable)
        .set(updateData)
        .where(eq(tasksTable.id, taskId))
        .returning();
      return task;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  // Delete task
  async deleteTask(taskId: number) {
    try {
      const [task] = await db
        .delete(tasksTable)
        .where(eq(tasksTable.id, taskId))
        .returning();
      return task;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  // Add points to user
  async addPoints(pointData: {
    userId: number;
    amount: number;
    reason: string;
    taskId?: number;
  }) {
    try {
      // Get current user
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, pointData.userId));
      if (!user) throw new Error("User not found");

      // Update user points
      const newPoints = (user.points || 0) + pointData.amount;
      const [updatedUser] = await db
        .update(usersTable)
        .set({ points: newPoints })
        .where(eq(usersTable.id, pointData.userId))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error("Error adding points:", error);
      throw error;
    }
  },
};

// Session-based authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  console.log("🔐 [TASKS AUTH] Checking session for user:", req.session?.user);

  if (!req.session.user) {
    console.log("❌ [TASKS AUTH] No user in session - returning 401");
    return res.status(401).json({
      error: "Unauthorized - Please log in again",
      code: "NO_SESSION",
    });
  }

  console.log("✅ [TASKS AUTH] User authenticated:", req.session.user.id);
  req.user = req.session.user;
  next();
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Get all tasks for current user
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    console.log("📋 [TASKS] Fetching tasks for user:", userId);

    const userTasks = await storage.getTasksByUserId(userId);

    res.json({
      success: true,
      tasks: userTasks || [],
    });
  } catch (error: any) {
    console.error("❌ [TASKS] Error fetching tasks:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch tasks",
      code: "TASKS_FETCH_ERROR",
    });
  }
});

// Create new task
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const { title, description, subject, resourceLink, status, dueDate } =
      req.body;

    console.log("➕ [TASKS] Creating task for user:", userId, req.body);

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        error: "Title is required",
        code: "MISSING_TITLE",
      });
    }

    const newTask = await storage.createTask({
      userId,
      title,
      description: description || "",
      subject: subject || "general",
      resourceLink: resourceLink || "",
      status: status || "pending",
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ [TASKS] Task created successfully:", newTask.id);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error: any) {
    console.error("❌ [TASKS] Error creating task:", error);
    res.status(500).json({
      error: error.message || "Failed to create task",
      code: "TASK_CREATE_ERROR",
    });
  }
});

// Update task (including completion with proof)
router.patch("/:taskId", requireAuth, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.session.user.id;

    console.log("✏️ [TASKS] Updating task:", taskId, "for user:", userId);

    const { status, proofFiles, proofText, proofLink } = req.body;

    console.log("Updating task:", {
      taskId,
      status,
      proofFiles,
      proofText,
      proofLink,
    });

    // Verify user owns this task
    const existingTask = await storage.getTask(parseInt(taskId));
    if (!existingTask || existingTask.userId !== userId) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update task data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update status if provided
    if (status) {
      updateData.status = status;
    }

    // Add proof files if provided
    if (proofFiles && Array.isArray(proofFiles)) {
      updateData.proofFiles = proofFiles;
    }

    // Add text proof if provided
    if (proofText) {
      updateData.proofText = proofText;
    }

    // Add link proof if provided
    if (proofLink) {
      updateData.proofLink = proofLink;
    }

    console.log("Update data:", updateData);

    const updatedTask = await storage.updateTask(parseInt(taskId), updateData);

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Award points for task completion if status changed to completed
    if (status === "completed" && existingTask.status !== "completed") {
      await storage.addPoints({
        userId: userId,
        amount: 10,
        reason: "Task completed",
        taskId: parseInt(taskId),
      });
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error: any) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: error.message || "Failed to update task" });
  }
});

// Mark task as complete with proof of work
router.put(
  "/:taskId/complete",
  requireAuth,
  upload.array("proofFiles"),
  async (req: any, res) => {
    try {
      const { taskId } = req.params;
      const userId = req.session.user.id;

      console.log("✅ [TASKS] Completing task:", taskId, "for user:", userId);

      const uploadedFiles = req.files as Express.Multer.File[];
      const { proofText, proofLink } = req.body;

      // Verify user owns this task
      const existingTask = await storage.getTask(parseInt(taskId));
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Update task status to completed and include all proof types
      const updateData: any = {
        status: "completed",
        updatedAt: new Date(),
      };

      // Add proof files if any were uploaded
      if (uploadedFiles && uploadedFiles.length > 0) {
        updateData.proofFiles = uploadedFiles.map(
          (file) =>
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        );
      }

      // Add text proof if provided
      if (proofText) {
        updateData.proofText = proofText;
      }

      // Add link proof if provided
      if (proofLink) {
        updateData.proofLink = proofLink;
      }

      const updatedTask = await storage.updateTask(
        parseInt(taskId),
        updateData,
      );

      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Award points for task completion
      if (existingTask.status !== "completed") {
        await storage.addPoints({
          userId: userId,
          amount: 10,
          reason: "Task completed",
          taskId: parseInt(taskId),
        });
      }

      res.json({
        success: true,
        message: "Task completed successfully",
      });
    } catch (error: any) {
      console.error("Error completing task:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to complete task" });
    }
  },
);

// Get task proof files
router.get("/:taskId/files", requireAuth, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.session.user.id;

    console.log("📁 [TASKS] Fetching files for task:", taskId, "user:", userId);

    // Verify user owns this task
    const task = await storage.getTask(parseInt(taskId));
    if (!task || task.userId !== userId) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Get all proof data (files, text, links)
    const proofData = {
      proofFiles: task.proofFiles || [],
      proofText: task.proofText || "",
      proofLink: task.proofLink || "",
    };

    res.json(proofData);
  } catch (error: any) {
    console.error("Error fetching task files:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch task files" });
  }
});

// Delete task endpoint
router.delete("/:taskId", requireAuth, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.session.user.id;

    console.log("🗑️ [TASKS] Deleting task:", taskId, "for user:", userId);

    // Verify user owns this task
    const task = await storage.getTask(parseInt(taskId));
    if (!task || task.userId !== userId) {
      return res.status(404).json({ message: "Task not found" });
    }

    const deleted = await storage.deleteTask(parseInt(taskId));

    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: error.message || "Failed to delete task" });
  }
});

// Reorder tasks endpoint
router.patch("/reorder", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const { tasks: tasksWithNewOrder } = req.body;

    console.log(
      "🔄 [TASKS] Reordering tasks for user:",
      userId,
      tasksWithNewOrder,
    );

    // Update each task's order
    for (const taskOrder of tasksWithNewOrder) {
      await storage.updateTask(taskOrder.id, { order: taskOrder.order });
    }

    res.json({
      success: true,
      message: "Tasks reordered successfully",
    });
  } catch (error: any) {
    console.error("Error reordering tasks:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to reorder tasks" });
  }
});

export default router;
