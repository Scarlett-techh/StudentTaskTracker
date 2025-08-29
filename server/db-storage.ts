import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import {
  users,
  tasks,
  notes,
  photos,
  taskAttachments,
  subjects,
  achievements,
  userAchievements,
  pointsHistory,
  moodEntries,
  portfolioItems,
  type User,
  type Task,
  type Note,
  type Photo,
  type TaskAttachment,
  type Subject,
  type Achievement,
  type UserAchievement,
  type PointsHistory,
  type MoodEntry,
  type PortfolioItem,
  type InsertUser,
  type UpsertUser,
  type InsertTask,
  type InsertNote,
  type InsertPhoto,
  type InsertTaskAttachment,
  type InsertSubject,
  type InsertAchievement,
  type InsertUserAchievement,
  type InsertPointsHistory,
  type InsertMoodEntry,
  type InsertPortfolioItem,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeAchievements();
  }

  // =======================
  // Achievements seeding
  // =======================
  private async initializeAchievements() {
    try {
      const existing = await db.select().from(achievements).limit(1);
      if (existing.length > 0) return; // already seeded

      const defaultAchievements: InsertAchievement[] = [
        { name: "First Task Completed", description: "Complete your first task" },
        { name: "One Week Streak", description: "Stay active for 7 days straight" },
        { name: "Level Up!", description: "Reach level 2" },
      ];

      await db.insert(achievements).values(defaultAchievements);
      console.log("✅ Default achievements seeded into database");
    } catch (err) {
      console.error("Error seeding achievements:", err);
    }
  }

  // =======================
  // User methods
  // =======================
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userData: InsertUser = {
      ...insertUser,
      userType: insertUser.userType || "student",
      coachId: insertUser.coachId || null,
    };
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(
    id: number,
    updateData: Partial<InsertUser> & {
      resetToken?: string | null;
      resetTokenExpiry?: Date | null;
    }
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updateData,
        userType: updateData.userType || undefined,
        coachId: updateData.coachId !== undefined ? updateData.coachId : undefined,
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByReplitId(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        userType: userData.userType || "student",
        coachId: userData.coachId || null,
      })
      .onConflictDoUpdate({
        target: users.replitId,
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
  }

  // =======================
  // Task methods
  // =======================
  async getTasks(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(tasks.order);
  }

  async getTasksByStatus(userId: number, status: string): Promise<Task[]> {
    return await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, status)));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(taskUpdate).where(eq(tasks.id, id)).returning();
    return task;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async updateTaskOrder(taskList: { id: number; order: number }[]): Promise<boolean> {
    try {
      for (const task of taskList) {
        await db.update(tasks).set({ order: task.order }).where(eq(tasks.id, task.id));
      }
      return true;
    } catch {
      return false;
    }
  }

  // =======================
  // Note methods
  // =======================
  async getNotes(userId: number): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(insertNote).returning();
    return note;
  }

  async updateNote(id: number, noteUpdate: Partial<InsertNote>): Promise<Note | undefined> {
    const [note] = await db.update(notes).set(noteUpdate).where(eq(notes.id, id)).returning();
    return note;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return result.rowCount > 0;
  }

  // =======================
  // Default Subjects
  // =======================
  async initializeDefaultSubjectsForUser(userId: number): Promise<void> {
    try {
      const existingSubjects = await db.select().from(subjects).where(eq(subjects.userId, userId)).limit(1);
      if (existingSubjects.length > 0) return;

      const defaultSubjects = [
        { name: "Mathematics", color: "#3B82F6", userId },
        { name: "Science", color: "#10B981", userId },
        { name: "English", color: "#F59E0B", userId },
        { name: "History", color: "#8B5CF6", userId },
        { name: "Art", color: "#EF4444", userId },
        { name: "Music", color: "#EC4899", userId },
        { name: "Physical Education", color: "#06B6D4", userId },
        { name: "Computer Science", color: "#6B7280", userId },
        { name: "Geography", color: "#84CC16", userId },
        { name: "Languages", color: "#F97316", userId },
      ];

      await db.insert(subjects).values(defaultSubjects);
    } catch (error) {
      console.log("Default subjects seeding skipped or failed:", error);
    }
  }
}