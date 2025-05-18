import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  avatar: true,
});

// Task schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject"),
  status: text("status").notNull().default("pending"),
  dueDate: text("due_date"),
  dueTime: text("due_time"),
  userId: integer("user_id").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  subject: true,
  status: true,
  dueDate: true,
  dueTime: true,
  userId: true,
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

// Types
export type User = typeof users.$inferSelect;
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
