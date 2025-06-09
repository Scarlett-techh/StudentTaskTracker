import {
  users, tasks, notes, photos, taskAttachments, subjects, 
  achievements, userAchievements, pointsHistory, coachStudents, dailyNotifications, moodEntries, portfolioItems,
  type User, type InsertUser,
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

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
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
    this.portfolioItems = new Map();
    this.portfolioItemCurrentId = 1;
    
    // Initialize default achievements
    this.initializeAchievements();
    
    // Create demo user
    this.createUser({
      username: 'emma',
      password: 'password123',
      name: 'Emma Wilson',
      avatar: '',
      email: 'emma.wilson@student.example.com',
    });
    
    // Create demo subjects
    this.createSubject({ name: 'Mathematics', color: '#3B82F6', userId: 1 });
    this.createSubject({ name: 'Science', color: '#8B5CF6', userId: 1 });
    this.createSubject({ name: 'English', color: '#10B981', userId: 1 });
    this.createSubject({ name: 'History', color: '#FBBF24', userId: 1 });
    // Add new requested subjects
    this.createSubject({ name: 'Physical Activity', color: '#EC4899', userId: 1 });
    this.createSubject({ name: 'Life Skills', color: '#F97316', userId: 1 });
    this.createSubject({ name: 'Interest / Passion', color: '#14B8A6', userId: 1 });
    this.createSubject({ name: 'Art', color: '#EF4444', userId: 1 });
    this.createSubject({ name: 'Game Design', color: '#8B5CF6', userId: 1 });
    this.createSubject({ name: 'Coding', color: '#059669', userId: 1 });
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
    const user: User = { 
      ...insertUser, 
      id,
      name: insertUser.name || null,
      avatar: insertUser.avatar || null,
      email: insertUser.email || null,
      resetToken: null,
      resetTokenExpiry: null,
      points: 0,
      level: 1,
      streak: 0,
      lastActiveDate: null,
      createdAt: new Date(),
      userType: insertUser.userType || 'student'
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updateData: Partial<InsertUser> & { resetToken?: string | null, resetTokenExpiry?: Date | null }): Promise<User | undefined> {
    const user = this.users.get(id);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...user,
      ...updateData,
      name: updateData.name !== undefined ? updateData.name : user.name,
      avatar: updateData.avatar !== undefined ? updateData.avatar : user.avatar,
      email: updateData.email !== undefined ? updateData.email : user.email,
      resetToken: updateData.resetToken !== undefined ? updateData.resetToken : user.resetToken,
      resetTokenExpiry: updateData.resetTokenExpiry !== undefined ? updateData.resetTokenExpiry : user.resetTokenExpiry
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
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
    const task: Task = {
      ...insertTask,
      id,
      createdAt,
      description: insertTask.description || null,
      subject: insertTask.subject || null,
      resourceLink: insertTask.resourceLink || null,
      status: insertTask.status || 'pending',
      dueDate: insertTask.dueDate || null,
      dueTime: insertTask.dueTime || null,
      order: insertTask.order !== undefined ? insertTask.order : 0
    };
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
    const note: Note = { 
      ...insertNote, 
      id, 
      createdAt, 
      updatedAt,
      content: insertNote.content || null,
      subject: insertNote.subject || null
    };
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
    const photo: Photo = { 
      ...insertPhoto, 
      id, 
      createdAt,
      subject: insertPhoto.subject || null,
      thumbnailData: insertPhoto.thumbnailData || null,
      taskId: insertPhoto.taskId || null,
      noteId: insertPhoto.noteId || null
    };
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
    const attachment: TaskAttachment = { 
      ...insertAttachment, 
      id, 
      createdAt,
      photoId: insertAttachment.photoId || null,
      noteId: insertAttachment.noteId || null 
    };
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
  
  // Gamification methods
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const userAchievements = Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId);
      
    return userAchievements.map(ua => {
      const achievement = this.achievements.get(ua.achievementId);
      return {
        ...ua,
        achievement: achievement as Achievement
      };
    });
  }
  
  async awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = this.userAchievementCurrentId++;
    
    const newUserAchievement: UserAchievement = {
      id,
      userId: userAchievement.userId,
      achievementId: userAchievement.achievementId,
      achievedAt: new Date()
    };
    
    this.userAchievements.set(id, newUserAchievement);
    return newUserAchievement;
  }
  
  async addPoints(pointsData: InsertPointsHistory): Promise<PointsHistory> {
    const id = this.pointsHistoryCurrentId++;
    
    const pointsRecord: PointsHistory = {
      id,
      userId: pointsData.userId,
      amount: pointsData.amount,
      reason: pointsData.reason,
      taskId: pointsData.taskId,
      createdAt: new Date()
    };
    
    this.pointsHistory.set(id, pointsRecord);
    
    // Update user's points total
    const user = await this.getUser(pointsData.userId);
    if (user) {
      const currentPoints = user.points || 0;
      const newPoints = currentPoints + pointsData.amount;
      
      // Calculate level (1 level per 100 points)
      const newLevel = Math.max(1, Math.floor(newPoints / 100) + 1);
      
      await this.updateUser(user.id, {
        points: newPoints,
        level: newLevel
      } as any);
    }
    
    return pointsRecord;
  }
  
  async getPointsHistory(userId: number): Promise<PointsHistory[]> {
    return Array.from(this.pointsHistory.values())
      .filter(record => record.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by most recent first
  }
  
  async updateUserStreak(userId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0); // Normalize to start of day
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // If last active was yesterday, increment streak
      if (lastActive.getTime() === yesterday.getTime()) {
        await this.updateUser(userId, {
          streak: (user.streak || 0) + 1,
          lastActiveDate: new Date()
        } as any);
      } 
      // If last active was before yesterday, reset streak to 1
      else if (lastActive.getTime() < yesterday.getTime()) {
        await this.updateUser(userId, {
          streak: 1,
          lastActiveDate: new Date()
        } as any);
      }
      // If last active was today, don't change streak but update timestamp
      else if (lastActive.getTime() !== today.getTime()) {
        await this.updateUser(userId, {
          lastActiveDate: new Date()
        } as any);
      }
    } else {
      // First time user is active, set streak to 1
      await this.updateUser(userId, {
        streak: 1,
        lastActiveDate: new Date()
      } as any);
    }
    
    return this.getUser(userId);
  }
  
  async getUserStats(userId: number): Promise<{ points: number, level: number, streak: number }> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return { points: 0, level: 1, streak: 0 };
    }
    
    return {
      points: user.points || 0,
      level: user.level || 1,
      streak: user.streak || 0
    };
  }
  
  // Method to add achievements to the system
  private async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementCurrentId++;
    
    const newAchievement: Achievement = {
      id,
      title: achievement.title,
      description: achievement.description || null,
      icon: achievement.icon || null,
      pointsRequired: achievement.pointsRequired,
      badgeImageUrl: achievement.badgeImageUrl || null,
      createdAt: new Date()
    };
    
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }
  
  // Method to initialize default achievements
  private async initializeAchievements(): Promise<void> {
    const defaultAchievements = [
      {
        title: "Task Master",
        description: "Complete 10 tasks",
        icon: "trophy",
        pointsRequired: 100,
        badgeImageUrl: "https://cdn-icons-png.flaticon.com/512/2583/2583344.png"
      },
      {
        title: "Note Taker",
        description: "Create 5 notes",
        icon: "notebook",
        pointsRequired: 50,
        badgeImageUrl: "https://cdn-icons-png.flaticon.com/512/3075/3075908.png"
      },
      {
        title: "Photographer",
        description: "Upload 3 photos",
        icon: "camera",
        pointsRequired: 30,
        badgeImageUrl: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png"
      },
      {
        title: "Streak Master",
        description: "Keep a 7-day streak",
        icon: "calendar",
        pointsRequired: 70,
        badgeImageUrl: "https://cdn-icons-png.flaticon.com/512/6358/6358101.png"
      },
      {
        title: "Subject Expert",
        description: "Complete 5 tasks in the same subject",
        icon: "book",
        pointsRequired: 50,
        badgeImageUrl: "https://cdn-icons-png.flaticon.com/512/2232/2232688.png"
      }
    ];
    
    for (const achievement of defaultAchievements) {
      await this.createAchievement(achievement);
    }
  }

  async getCoachesByEmail(email: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.email === email
    );
  }

  async getCoachStudents(coachId: number): Promise<User[]> {
    // Get all students who have tasks assigned by this coach
    const studentsWithCoachTasks = new Set<number>();
    
    Array.from(this.tasks.values()).forEach(task => {
      if (task.assignedByCoachId === coachId) {
        studentsWithCoachTasks.add(task.userId);
      }
    });

    return Array.from(this.users.values()).filter(user => 
      studentsWithCoachTasks.has(user.id)
    );
  }

  async getCoachStats(coachId: number): Promise<{ totalStudents: number, tasksAssigned: number, completedToday: number, pendingTasks: number }> {
    const coachTasks = Array.from(this.tasks.values()).filter(task => 
      task.assignedByCoachId === coachId
    );
    
    const studentsWithCoachTasks = new Set<number>();
    let completedToday = 0;
    let pendingTasks = 0;
    
    const today = new Date().toDateString();
    
    coachTasks.forEach(task => {
      studentsWithCoachTasks.add(task.userId);
      
      if (task.status === 'completed' && task.updatedAt && new Date(task.updatedAt).toDateString() === today) {
        completedToday++;
      }
      
      if (task.status === 'pending') {
        pendingTasks++;
      }
    });

    return {
      totalStudents: studentsWithCoachTasks.size,
      tasksAssigned: coachTasks.length,
      completedToday,
      pendingTasks
    };
  }

  // Mood tracking methods
  async getMoodEntries(userId: number): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values()).filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTodaysMood(userId: number): Promise<MoodEntry | undefined> {
    const today = new Date().toDateString();
    return Array.from(this.moodEntries.values())
      .find(entry => entry.userId === userId && new Date(entry.date).toDateString() === today);
  }

  async createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.moodEntryCurrentId++;
    const newMoodEntry: MoodEntry = {
      ...moodEntry,
      id,
      note: moodEntry.note || null,
      date: new Date(),
      createdAt: new Date(),
    };
    this.moodEntries.set(id, newMoodEntry);
    return newMoodEntry;
  }

  async getStudentsMoodsToday(studentIds: number[]): Promise<(MoodEntry & { studentName: string })[]> {
    const today = new Date().toDateString();
    const todaysMoods: (MoodEntry & { studentName: string })[] = [];
    
    for (const studentId of studentIds) {
      const mood = Array.from(this.moodEntries.values())
        .find(entry => entry.userId === studentId && new Date(entry.date).toDateString() === today);
      
      if (mood) {
        const student = this.users.get(studentId);
        todaysMoods.push({
          ...mood,
          studentName: student?.name || student?.username || 'Unknown Student'
        });
      }
    }
    
    return todaysMoods;
  }

  // Portfolio methods
  async getPortfolioItems(userId: number): Promise<PortfolioItem[]> {
    return Array.from(this.portfolioItems.values()).filter(item => item.userId === userId);
  }

  async createPortfolioItem(insertPortfolioItem: InsertPortfolioItem): Promise<PortfolioItem> {
    const id = this.portfolioItemCurrentId++;
    const portfolioItem: PortfolioItem = {
      id,
      title: insertPortfolioItem.title,
      description: insertPortfolioItem.description || null,
      type: insertPortfolioItem.type,
      subject: insertPortfolioItem.subject || null,
      score: insertPortfolioItem.score || null,
      sourceId: insertPortfolioItem.sourceId || null,
      featured: insertPortfolioItem.featured || false,
      filePath: insertPortfolioItem.filePath || null,
      link: insertPortfolioItem.link || null,
      userId: insertPortfolioItem.userId,
      createdAt: new Date()
    };
    this.portfolioItems.set(id, portfolioItem);
    return portfolioItem;
  }

  async updatePortfolioItem(id: number, portfolioItemUpdate: Partial<InsertPortfolioItem>): Promise<PortfolioItem | undefined> {
    const existingItem = this.portfolioItems.get(id);
    if (!existingItem) return undefined;

    const updatedItem: PortfolioItem = {
      ...existingItem,
      ...portfolioItemUpdate
    };
    this.portfolioItems.set(id, updatedItem);
    return updatedItem;
  }

  async getPortfolioItem(id: number): Promise<PortfolioItem | undefined> {
    return this.portfolioItems.get(id);
  }

  async deletePortfolioItem(id: number): Promise<boolean> {
    return this.portfolioItems.delete(id);
  }
}

export const storage = new DatabaseStorage();
