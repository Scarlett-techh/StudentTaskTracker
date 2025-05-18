import {
  users, tasks, notes, photos, taskAttachments, subjects,
  type User, type InsertUser,
  type Task, type InsertTask,
  type Note, type InsertNote,
  type Photo, type InsertPhoto,
  type TaskAttachment, type InsertTaskAttachment,
  type Subject, type InsertSubject
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private notes: Map<number, Note>;
  private photos: Map<number, Photo>;
  private taskAttachments: Map<number, TaskAttachment>;
  private subjects: Map<number, Subject>;
  
  private userCurrentId: number;
  private taskCurrentId: number;
  private noteCurrentId: number;
  private photoCurrentId: number;
  private taskAttachmentCurrentId: number;
  private subjectCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.notes = new Map();
    this.photos = new Map();
    this.taskAttachments = new Map();
    this.subjects = new Map();
    
    this.userCurrentId = 1;
    this.taskCurrentId = 1;
    this.noteCurrentId = 1;
    this.photoCurrentId = 1;
    this.taskAttachmentCurrentId = 1;
    this.subjectCurrentId = 1;
    
    // Create demo user
    this.createUser({
      username: 'emma',
      password: 'password123',
      name: 'Emma Wilson',
      avatar: '',
    });
    
    // Create demo subjects
    this.createSubject({ name: 'Mathematics', color: '#3B82F6', userId: 1 });
    this.createSubject({ name: 'Science', color: '#8B5CF6', userId: 1 });
    this.createSubject({ name: 'English', color: '#10B981', userId: 1 });
    this.createSubject({ name: 'History', color: '#FBBF24', userId: 1 });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.userId === userId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getTasksByStatus(userId: number, status: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.userId === userId && task.status === status)
      .sort((a, b) => a.order - b.order);
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskCurrentId++;
    const createdAt = new Date();
    const task: Task = { ...insertTask, id, createdAt };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  async updateTaskOrder(tasks: { id: number, order: number }[]): Promise<boolean> {
    try {
      for (const { id, order } of tasks) {
        const task = this.tasks.get(id);
        if (task) {
          this.tasks.set(id, { ...task, order });
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Note methods
  async getNotes(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const note: Note = { ...insertNote, id, createdAt, updatedAt };
    this.notes.set(id, note);
    return note;
  }
  
  async updateNote(id: number, noteUpdate: Partial<InsertNote>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedAt = new Date();
    const updatedNote = { ...note, ...noteUpdate, updatedAt };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  
  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }
  
  // Photo methods
  async getPhotos(userId: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }
  
  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.photoCurrentId++;
    const createdAt = new Date();
    const photo: Photo = { ...insertPhoto, id, createdAt };
    this.photos.set(id, photo);
    return photo;
  }
  
  async updatePhoto(id: number, photoUpdate: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;
    
    const updatedPhoto = { ...photo, ...photoUpdate };
    this.photos.set(id, updatedPhoto);
    return updatedPhoto;
  }
  
  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }
  
  // TaskAttachment methods
  async getTaskAttachments(taskId: number): Promise<TaskAttachment[]> {
    return Array.from(this.taskAttachments.values())
      .filter(attachment => attachment.taskId === taskId);
  }
  
  async createTaskAttachment(insertAttachment: InsertTaskAttachment): Promise<TaskAttachment> {
    const id = this.taskAttachmentCurrentId++;
    const createdAt = new Date();
    const attachment: TaskAttachment = { ...insertAttachment, id, createdAt };
    this.taskAttachments.set(id, attachment);
    return attachment;
  }
  
  async deleteTaskAttachment(id: number): Promise<boolean> {
    return this.taskAttachments.delete(id);
  }
  
  // Subject methods
  async getSubjects(userId: number): Promise<Subject[]> {
    return Array.from(this.subjects.values())
      .filter(subject => subject.userId === userId);
  }
  
  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.subjectCurrentId++;
    const subject: Subject = { ...insertSubject, id };
    this.subjects.set(id, subject);
    return subject;
  }
  
  async updateSubject(id: number, subjectUpdate: Partial<InsertSubject>): Promise<Subject | undefined> {
    const subject = this.subjects.get(id);
    if (!subject) return undefined;
    
    const updatedSubject = { ...subject, ...subjectUpdate };
    this.subjects.set(id, updatedSubject);
    return updatedSubject;
  }
  
  async deleteSubject(id: number): Promise<boolean> {
    return this.subjects.delete(id);
  }
}

export const storage = new MemStorage();
