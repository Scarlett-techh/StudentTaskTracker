import { sql } from 'drizzle-orm';
import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User schema - Updated for Replit Auth with backward compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(), // Keep existing integer ID
  // Replit Auth fields
  replitId: varchar("replit_id").unique(), // Replit user ID (string)
  email: text("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Legacy fields for backward compatibility
  username: text("username"),
  password: text("password"),
  name: text("name"),
  avatar: text("avatar"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // App-specific fields
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  streak: integer("streak").notNull().default(0),
  lastActiveDate: timestamp("last_active_date"),
  userType: text("user_type").notNull().default("student"), // "student" or "coach"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coach-Student relationship
export const coachStudents = pgTable("coach_students", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  studentId: integer("student_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Replit Auth user types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Legacy insert schema for backward compatibility
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  avatar: true,
  email: true,
});

// Task schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject"),
  resourceLink: text("resource_link"),
  category: text("category").notNull().default("brain"), // "brain", "body", or "space"
  status: text("status").notNull().default("pending"),
  dueDate: text("due_date"),
  dueTime: text("due_time"),
  userId: integer("user_id").notNull(),
  assignedByCoachId: integer("assigned_by_coach_id"), // null for self-created tasks
  isCoachTask: boolean("is_coach_task").notNull().default(false),
  order: integer("order").notNull().default(0),
  proofUrl: text("proof_url"), // Single proof file URL (for backward compatibility)
  proofFiles: text("proof_files").array(), // Array of proof file URLs
  proofPreviews: text("proof_previews").array(), // Array of preview URLs for immediate display
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  subject: true,
  resourceLink: true,
  category: true,
  status: true,
  dueDate: true,
  dueTime: true,
  userId: true,
  assignedByCoachId: true,
  isCoachTask: true,
  order: true,
});

// Note schema
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  subject: text("subject"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  content: true,
  subject: true,
  userId: true,
});

// Photo schema
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  fileData: text("file_data").notNull(),
  thumbnailData: text("thumbnail_data"),
  mimeType: text("mime_type").notNull(),
  subject: text("subject"),
  userId: integer("user_id").notNull(),
  taskId: integer("task_id"),
  noteId: integer("note_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  title: true,
  filename: true,
  fileData: true,
  thumbnailData: true,
  mimeType: true,
  subject: true,
  userId: true,
  taskId: true,
  noteId: true,
});

// Task Attachment schema (join table)
export const taskAttachments = pgTable("task_attachments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  photoId: integer("photo_id"),
  noteId: integer("note_id"),
  attachmentType: text("attachment_type").notNull(), // "photo" or "note"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskAttachmentSchema = createInsertSchema(taskAttachments).pick({
  taskId: true,
  photoId: true,
  noteId: true, 
  attachmentType: true,
});

// Subject schema
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  userId: integer("user_id").notNull(),
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
  color: true,
  userId: true,
});

// Achievements schema
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  pointsRequired: integer("points_required").notNull(),
  badgeImageUrl: text("badge_image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  title: true,
  description: true,
  icon: true,
  pointsRequired: true,
  badgeImageUrl: true,
});

// User achievements (junction table between users and achievements)
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  achievedAt: timestamp("achieved_at").notNull().defaultNow(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true,
});

// User points history (for tracking point transactions)
export const pointsHistory = pgTable("points_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  taskId: integer("task_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPointsHistorySchema = createInsertSchema(pointsHistory).pick({
  userId: true,
  amount: true,
  reason: true,
  taskId: true,
});

// Types - Updated for mixed compatibility
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type InsertTaskAttachment = z.infer<typeof insertTaskAttachmentSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type PointsHistory = typeof pointsHistory.$inferSelect;
export type InsertPointsHistory = z.infer<typeof insertPointsHistorySchema>;

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;

// Portfolio items table
export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'file', 'link', 'photo'
  subject: text("subject"),
  score: text("score"), // For test scores or grades
  sourceId: integer("source_id"), // Reference to original task/note if applicable
  featured: boolean("featured").notNull().default(false),
  filePath: text("file_path"), // Path to uploaded file
  link: text("link"), // URL for link type items
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).pick({
  userId: true,
  title: true,
  description: true,
  type: true,
  subject: true,
  score: true,
  sourceId: true,
  featured: true,
  filePath: true,
  link: true,
});

// Daily notification tracking
export const dailyNotifications = pgTable("daily_notifications", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  studentId: integer("student_id").notNull(),
  notificationDate: text("notification_date").notNull(), // YYYY-MM-DD format
  emailSent: boolean("email_sent").notNull().default(false),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCoachStudentSchema = createInsertSchema(coachStudents).pick({
  coachId: true,
  studentId: true,
});

export const insertDailyNotificationSchema = createInsertSchema(dailyNotifications).pick({
  coachId: true,
  studentId: true,
  notificationDate: true,
  emailSent: true,
  tasksCompleted: true,
  pointsEarned: true,
});

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  moodType: varchar("mood_type").notNull(), // happy, tired, bored, excited, stressed, focused, etc.
  intensity: integer("intensity").notNull(), // 1-5 scale
  note: text("note"), // optional note about their mood
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).pick({
  userId: true,
  moodType: true,
  intensity: true,
  note: true,
});

export type CoachStudent = typeof coachStudents.$inferSelect;
export type InsertCoachStudent = z.infer<typeof insertCoachStudentSchema>;

export type DailyNotification = typeof dailyNotifications.$inferSelect;
export type InsertDailyNotification = z.infer<typeof insertDailyNotificationSchema>;

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
