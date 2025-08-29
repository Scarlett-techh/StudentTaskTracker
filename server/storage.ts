import {
  users, tasks, notes, photos, taskAttachments, subjects, 
  achievements, userAchievements, pointsHistory, coachStudents, dailyNotifications, moodEntries, portfolioItems,
  type User, type InsertUser, type UpsertUser,
  type Task, type InsertTask,
  type Note, type InsertNote,
  type Photo, type InsertPhoto,
  type TaskAttachment, type InsertTaskAttachment,
  type Subject, type InsertSubject,
  type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement,
  type PointsHistory, type InsertPointsHistory,
  type CoachStudent, type InsertCoachStudent,
  type DailyNotification, type InsertDailyNotification,
  type MoodEntry, type InsertMoodEntry,
  type PortfolioItem, type InsertPortfolioItem
} from "@shared/schema";
import { DatabaseStorage } from "./db-storage";
import bcrypt from "bcryptjs"; // ✅ switched to bcryptjs

export interface IStorage {
  // User methods - Legacy
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Replit Auth methods
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Task methods
  getTasks(userId: number): Promise<Task[]>;
  getTasksByStatus(userId: number, status: string): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  updateTaskOrder(tasks: { id: number, order: number }[]): Promise<boolean>;

  // Note methods
  getNotes(userId: number): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;

  // Photo methods
  getPhotos(userId: number): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;

  // TaskAttachment methods
  getTaskAttachments(taskId: number): Promise<TaskAttachment[]>;
  createTaskAttachment(attachment: InsertTaskAttachment): Promise<TaskAttachment>;
  deleteTaskAttachment(id: number): Promise<boolean>;

  // Subject methods
  getSubjects(userId: number): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;
  initializeDefaultSubjectsForUser(userId: number): Promise<void>;

  // Gamification methods
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  addPoints(pointsHistory: InsertPointsHistory): Promise<PointsHistory>;
  getPointsHistory(userId: number): Promise<PointsHistory[]>;
  updateUserStreak(userId: number): Promise<User | undefined>;
  getUserStats(userId: number): Promise<{ points: number, level: number, streak: number }>;

  // Coach-Student methods
  getCoachesByEmail(email: string): Promise<User[]>;
  getCoachStudents(coachId: number): Promise<User[]>;
  getCoachStats(coachId: number): Promise<{ totalStudents: number, tasksAssigned: number, completedToday: number, pendingTasks: number }>;

  // Mood tracking methods
  getMoodEntries(userId: number): Promise<MoodEntry[]>;
  getTodaysMood(userId: number): Promise<MoodEntry | undefined>;
  createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry>;
  getStudentsMoodsToday(studentIds: number[]): Promise<(MoodEntry & { studentName: string })[]>;

  // Portfolio methods
  getPortfolioItems(userId: number): Promise<PortfolioItem[]>;
  getPortfolioItem(id: number): Promise<PortfolioItem | undefined>;
  createPortfolioItem(portfolioItem: InsertPortfolioItem): Promise<PortfolioItem>;
  updatePortfolioItem(id: number, portfolioItem: Partial<InsertPortfolioItem>): Promise<PortfolioItem | undefined>;
  deletePortfolioItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private notes: Map<number, Note>;
  private photos: Map<number, Photo>;
  private taskAttachments: Map<number, TaskAttachment>;
  private subjects: Map<number, Subject>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private pointsHistory: Map<number, PointsHistory>;
  private moodEntries: Map<number, MoodEntry>;
  private portfolioItems: Map<number, PortfolioItem>;

  private userCurrentId: number;
  private taskCurrentId: number;
  private noteCurrentId: number;
  private photoCurrentId: number;
  private taskAttachmentCurrentId: number;
  private subjectCurrentId: number;
  private achievementCurrentId: number;
  private userAchievementCurrentId: number;
  private pointsHistoryCurrentId: number;
  private moodEntryCurrentId: number;
  private portfolioItemCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.notes = new Map();
    this.photos = new Map();
    this.taskAttachments = new Map();
    this.subjects = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.pointsHistory = new Map();
    this.moodEntries = new Map();
    this.portfolioItems = new Map();

    this.userCurrentId = 1;
    this.taskCurrentId = 1;
    this.noteCurrentId = 1;
    this.photoCurrentId = 1;
    this.taskAttachmentCurrentId = 1;
    this.subjectCurrentId = 1;
    this.achievementCurrentId = 1;
    this.userAchievementCurrentId = 1;
    this.pointsHistoryCurrentId = 1;
    this.moodEntryCurrentId = 1;
    this.portfolioItemCurrentId = 1;

    // Initialize default achievements
    this.initializeAchievements();

    // ✅ Step 2: Demo user with hashed password (using bcryptjs)
    const demoPasswordHash = bcrypt.hashSync("password123", 10);
    this.createUser({
      username: "emma",
      password_hash: demoPasswordHash,
      name: "Emma Wilson",
      avatar: "",
      email: "emma.wilson@student.example.com",
    });

    // Create demo subjects
    this.createSubject({ name: 'Mathematics', color: '#3B82F6', userId: 1 });
    this.createSubject({ name: 'Science', color: '#8B5CF6', userId: 1 });
    this.createSubject({ name: 'English', color: '#10B981', userId: 1 });
    this.createSubject({ name: 'History', color: '#FBBF24', userId: 1 });
    this.createSubject({ name: 'Physical Activity', color: '#EC4899', userId: 1 });
    this.createSubject({ name: 'Life Skills', color: '#F97316', userId: 1 });
    this.createSubject({ name: 'Interest / Passion', color: '#14B8A6', userId: 1 });
    this.createSubject({ name: 'Art', color: '#EF4444', userId: 1 });
    this.createSubject({ name: 'Game Design', color: '#8B5CF6', userId: 1 });
    this.createSubject({ name: 'Coding', color: '#059669', userId: 1 });
  }

  // ✅ Step 3: Updated createUser
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      name: insertUser.name || null,
      avatar: insertUser.avatar || null,
      email: insertUser.email || null,
      password_hash: insertUser.password_hash || null,
      resetToken: null,
      resetTokenExpiry: null,
      points: 0,
      level: 1,
      streak: 0,
      lastActiveDate: null,
      createdAt: new Date(),
      userType: insertUser.userType || "student",
    };
    this.users.set(id, user);
    return user;
  }

  // ✅ Step 4: Updated updateUser
  async updateUser(
    id: number, 
    updateData: Partial<InsertUser> & { resetToken?: string | null, resetTokenExpiry?: Date | null }
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updateData,
      name: updateData.name !== undefined ? updateData.name : user.name,
      avatar: updateData.avatar !== undefined ? updateData.avatar : user.avatar,
      email: updateData.email !== undefined ? updateData.email : user.email,
      password_hash: updateData.password_hash !== undefined ? updateData.password_hash : user.password_hash,
      resetToken: updateData.resetToken !== undefined ? updateData.resetToken : user.resetToken,
      resetTokenExpiry: updateData.resetTokenExpiry !== undefined ? updateData.resetTokenExpiry : user.resetTokenExpiry
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token
    );
  }

  // ✅ Step 5: Updated upsertUser
  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.replitId) {
      const existing = await this.getUserByReplitId(userData.replitId);
      if (existing) {
        const updated = await this.updateUser(existing.id, userData as any);
        return updated!;
      }
    }

    const insertData: InsertUser = {
      username: userData.username || null,
      password_hash: userData.password_hash || null,
      name: userData.name || userData.firstName || null,
      avatar: userData.avatar || userData.profileImageUrl || null,
      email: userData.email || null,
    };
    return await this.createUser(insertData);
  }

  // ... ✅ KEEP all your other methods here (tasks, notes, photos, achievements, mood, portfolio, etc.)
}

export const storage = new DatabaseStorage();