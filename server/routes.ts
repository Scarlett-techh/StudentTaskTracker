import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertNoteSchema, insertPhotoSchema, insertTaskAttachmentSchema, insertSubjectSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Configure multer for memory storage (we'll store files as base64)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Debug middleware for file uploads
const logRequest = (req: any, res: any, next: any) => {
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  console.log("Request file:", req.file);
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  function handleError(err: any, res: Response) {
    console.error("API Error:", err);
    
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    
    res.status(500).json({ message: err.message || "Internal server error" });
  }
  
  // Define routes
  
  // == Task Routes ==
  
  // Get all tasks for a user
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      // In a real app, we would get the userId from authentication
      const userId = 1; // Hardcoded for demo
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Get tasks by status
  app.get("/api/tasks/status/:status", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const status = req.params.status;
      const tasks = await storage.getTasksByStatus(userId, status);
      res.json(tasks);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Get a specific task
  app.get("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Create a new task
  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      
      // Get the maximum order to place the task at the end
      const existingTasks = await storage.getTasks(userId);
      const maxOrder = existingTasks.length > 0 
        ? Math.max(...existingTasks.map(t => t.order))
        : -1;
      
      const taskData = insertTaskSchema.parse({
        ...req.body,
        userId,
        order: maxOrder + 1
      });
      
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Update a task
  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Validate the update data
      const updateData = insertTaskSchema.partial().parse(req.body);
      
      const updatedTask = await storage.updateTask(taskId, updateData);
      res.json(updatedTask);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Delete a task
  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const deleted = await storage.deleteTask(taskId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).end();
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Update task order (for drag and drop)
  app.patch("/api/tasks/reorder", async (req: Request, res: Response) => {
    try {
      const tasks = req.body.tasks;
      
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ message: "Tasks must be an array" });
      }
      
      const success = await storage.updateTaskOrder(tasks);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to update task order" });
      }
      
      res.status(200).json({ message: "Task order updated" });
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // == Note Routes ==
  
  // Get all notes for a user
  app.get("/api/notes", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const notes = await storage.getNotes(userId);
      res.json(notes);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Get a specific note
  app.get("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const noteId = parseInt(req.params.id);
      const note = await storage.getNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Create a new note
  app.post("/api/notes", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      
      const noteData = insertNoteSchema.parse({
        ...req.body,
        userId
      });
      
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Update a note
  app.patch("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const noteId = parseInt(req.params.id);
      const existingNote = await storage.getNote(noteId);
      
      if (!existingNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Validate the update data
      const updateData = insertNoteSchema.partial().parse(req.body);
      
      const updatedNote = await storage.updateNote(noteId, updateData);
      res.json(updatedNote);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Delete a note
  app.delete("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const noteId = parseInt(req.params.id);
      const deleted = await storage.deleteNote(noteId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.status(204).end();
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // == Photo Routes ==
  
  // Get all photos for a user
  app.get("/api/photos", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const photos = await storage.getPhotos(userId);
      res.json(photos);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Get a specific photo
  app.get("/api/photos/:id", async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id);
      const photo = await storage.getPhoto(photoId);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.json(photo);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Upload a new photo
  app.post("/api/photos", logRequest, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file as Express.Multer.File;
      console.log("File received:", {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer ? "Buffer present" : "No buffer"
      });
      
      const fileData = file.buffer.toString('base64');
      
      // In a real app, we would resize the image to create a thumbnail
      const thumbnailData = fileData; // Using same data for demo
      
      const photoData = insertPhotoSchema.parse({
        title: req.body.title || 'Untitled',
        filename: file.originalname,
        fileData,
        thumbnailData,
        mimeType: file.mimetype,
        subject: req.body.subject || null,
        userId,
        taskId: req.body.taskId ? parseInt(req.body.taskId) : undefined,
        noteId: req.body.noteId ? parseInt(req.body.noteId) : undefined
      });
      
      const photo = await storage.createPhoto(photoData);
      
      // If this photo is for a task, create the attachment
      if (req.body.taskId) {
        await storage.createTaskAttachment({
          taskId: parseInt(req.body.taskId),
          photoId: photo.id,
          attachmentType: 'photo'
        });
      }
      
      res.status(201).json(photo);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Delete a photo
  app.delete("/api/photos/:id", async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id);
      const deleted = await storage.deletePhoto(photoId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.status(204).end();
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // == Task Attachment Routes ==
  
  // Get attachments for a task
  app.get("/api/tasks/:id/attachments", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const attachments = await storage.getTaskAttachments(taskId);
      res.json(attachments);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Add attachment to task
  app.post("/api/tasks/:id/attachments", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      const attachmentData = insertTaskAttachmentSchema.parse({
        ...req.body,
        taskId
      });
      
      const attachment = await storage.createTaskAttachment(attachmentData);
      res.status(201).json(attachment);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Remove attachment from task
  app.delete("/api/task-attachments/:id", async (req: Request, res: Response) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const deleted = await storage.deleteTaskAttachment(attachmentId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Attachment not found" });
      }
      
      res.status(204).end();
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // == Subject Routes ==
  
  // Get all subjects for a user
  app.get("/api/subjects", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const subjects = await storage.getSubjects(userId);
      res.json(subjects);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Create a new subject
  app.post("/api/subjects", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      
      const subjectData = insertSubjectSchema.parse({
        ...req.body,
        userId
      });
      
      const subject = await storage.createSubject(subjectData);
      res.status(201).json(subject);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Update a subject
  app.patch("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subjectId = parseInt(req.params.id);
      
      // Validate the update data
      const updateData = insertSubjectSchema.partial().parse(req.body);
      
      const updatedSubject = await storage.updateSubject(subjectId, updateData);
      
      if (!updatedSubject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      res.json(updatedSubject);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Delete a subject
  app.delete("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subjectId = parseInt(req.params.id);
      const deleted = await storage.deleteSubject(subjectId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      res.status(204).end();
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Get current user (for demo purposes)
  app.get("/api/user", async (_req: Request, res: Response) => {
    try {
      const user = await storage.getUser(1);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
