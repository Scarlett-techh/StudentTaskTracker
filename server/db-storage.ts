import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
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
  type InsertUser,
  type InsertTask,
  type InsertNote,
  type InsertPhoto,
  type InsertTaskAttachment,
  type InsertSubject,
  type InsertAchievement,
  type InsertUserAchievement,
  type InsertPointsHistory,
  type InsertMoodEntry,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize achievements when the storage is created
    this.initializeAchievements();
  }

  // User methods
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser> & { resetToken?: string | null, resetTokenExpiry?: Date | null }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Task methods
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
    const [task] = await db
      .update(tasks)
      .set(taskUpdate)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async updateTaskOrder(taskList: { id: number, order: number }[]): Promise<boolean> {
    try {
      for (const task of taskList) {
        await db.update(tasks).set({ order: task.order }).where(eq(tasks.id, task.id));
      }
      return true;
    } catch {
      return false;
    }
  }

  // Note methods
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
    const [note] = await db
      .update(notes)
      .set(noteUpdate)
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return result.rowCount > 0;
  }

  // Photo methods
  async getPhotos(userId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.userId, userId)).orderBy(desc(photos.createdAt));
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo;
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db.insert(photos).values(insertPhoto).returning();
    return photo;
  }

  async updatePhoto(id: number, photoUpdate: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const [photo] = await db
      .update(photos)
      .set(photoUpdate)
      .where(eq(photos.id, id))
      .returning();
    return photo;
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db.delete(photos).where(eq(photos.id, id));
    return result.rowCount > 0;
  }

  // TaskAttachment methods
  async getTaskAttachments(taskId: number): Promise<TaskAttachment[]> {
    return await db.select().from(taskAttachments).where(eq(taskAttachments.taskId, taskId));
  }

  async createTaskAttachment(insertAttachment: InsertTaskAttachment): Promise<TaskAttachment> {
    const [attachment] = await db.insert(taskAttachments).values(insertAttachment).returning();
    return attachment;
  }

  async deleteTaskAttachment(id: number): Promise<boolean> {
    const result = await db.delete(taskAttachments).where(eq(taskAttachments.id, id));
    return result.rowCount > 0;
  }

  // Subject methods
  async getSubjects(userId: number): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.userId, userId));
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    return subject;
  }

  async updateSubject(id: number, subjectUpdate: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [subject] = await db
      .update(subjects)
      .set(subjectUpdate)
      .where(eq(subjects.id, id))
      .returning();
    return subject;
  }

  async deleteSubject(id: number): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.id, id));
    return result.rowCount > 0;
  }

  // Gamification methods
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const result = await db
      .select()
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    return result.map(row => ({
      ...row.user_achievements,
      achievement: row.achievements!
    }));
  }

  async awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [newUserAchievement] = await db.insert(userAchievements).values(userAchievement).returning();
    return newUserAchievement;
  }

  async addPoints(pointsData: InsertPointsHistory): Promise<PointsHistory> {
    const [pointsRecord] = await db.insert(pointsHistory).values(pointsData).returning();
    return pointsRecord;
  }

  async getPointsHistory(userId: number): Promise<PointsHistory[]> {
    return await db.select().from(pointsHistory).where(eq(pointsHistory.userId, userId)).orderBy(desc(pointsHistory.createdAt));
  }

  async updateUserStreak(userId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastStreakDate = user.lastStreakDate ? new Date(user.lastStreakDate) : null;
    
    let newStreak = 1;
    if (lastStreakDate) {
      const daysDiff = Math.floor((today.getTime() - lastStreakDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        newStreak = user.streak + 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      } else {
        newStreak = user.streak;
      }
    }

    return await this.updateUser(userId, {
      streak: newStreak,
      lastStreakDate: today
    });
  }

  async getUserStats(userId: number): Promise<{ points: number, level: number, streak: number }> {
    const user = await this.getUser(userId);
    const pointsHistoryRecords = await this.getPointsHistory(userId);
    
    const totalPoints = pointsHistoryRecords.reduce((sum, record) => sum + record.amount, 0);
    const level = Math.floor(totalPoints / 100) + 1;
    const streak = user?.streak || 0;

    return { points: totalPoints, level, streak };
  }

  // Coach-Student methods
  async getCoachesByEmail(email: string): Promise<User[]> {
    return await db.select().from(users).where(and(eq(users.email, email), eq(users.userType, 'coach')));
  }

  async getCoachStudents(coachId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.coachId, coachId));
  }

  async getCoachStats(coachId: number): Promise<{ totalStudents: number, tasksAssigned: number, completedToday: number, pendingTasks: number }> {
    const students = await this.getCoachStudents(coachId);
    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) {
      return { totalStudents: 0, tasksAssigned: 0, completedToday: 0, pendingTasks: 0 };
    }

    const allTasks = await db.select().from(tasks).where(sql`user_id IN (${studentIds.join(',')})`);
    const coachTasks = allTasks.filter(task => task.isCoachTask);
    
    const today = new Date().toISOString().split('T')[0];
    const completedToday = allTasks.filter(task => 
      task.status === 'completed' && 
      task.updatedAt && 
      task.updatedAt.toISOString().split('T')[0] === today
    ).length;

    const pendingTasks = allTasks.filter(task => task.status === 'pending').length;

    return {
      totalStudents: students.length,
      tasksAssigned: coachTasks.length,
      completedToday,
      pendingTasks
    };
  }

  // Mood tracking methods
  async getMoodEntries(userId: number): Promise<MoodEntry[]> {
    return await db.select().from(moodEntries).where(eq(moodEntries.userId, userId)).orderBy(desc(moodEntries.createdAt));
  }

  async getTodaysMood(userId: number): Promise<MoodEntry | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [mood] = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          sql`DATE(created_at) = DATE('now')`
        )
      );
    return mood;
  }

  async createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [newMoodEntry] = await db.insert(moodEntries).values(moodEntry).returning();
    return newMoodEntry;
  }

  async getStudentsMoodsToday(studentIds: number[]): Promise<(MoodEntry & { studentName: string })[]> {
    if (studentIds.length === 0) return [];

    const result = await db
      .select({
        ...moodEntries,
        studentName: users.name
      })
      .from(moodEntries)
      .leftJoin(users, eq(moodEntries.userId, users.id))
      .where(
        and(
          sql`user_id IN (${studentIds.join(',')})`,
          sql`DATE(mood_entries.created_at) = DATE('now')`
        )
      );

    return result.map(row => ({
      ...row,
      studentName: row.studentName || 'Unknown Student'
    }));
  }

  private async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  private async initializeAchievements(): Promise<void> {
    try {
      const existingAchievements = await this.getAchievements();
      if (existingAchievements.length > 0) return;

      const defaultAchievements: InsertAchievement[] = [
        {
          title: "First Task",
          description: "Complete your first task",
          icon: "CheckCircle",
          pointsRequired: 0
        },
        {
          title: "Task Master",
          description: "Complete 10 tasks",
          icon: "Trophy",
          pointsRequired: 100
        },
        {
          title: "Streak Champion",
          description: "Maintain a 7-day learning streak",
          icon: "Fire",
          pointsRequired: 0
        },
        {
          title: "Explorer",
          description: "Try 3 different subjects",
          icon: "Compass",
          pointsRequired: 0
        },
        {
          title: "Dedicated Learner",
          description: "Earn 500 points",
          icon: "Star",
          pointsRequired: 500
        }
      ];

      for (const achievement of defaultAchievements) {
        await this.createAchievement(achievement);
      }
    } catch (error) {
      console.log("Achievements already initialized or error occurred:", error);
    }
  }
}