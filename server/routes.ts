import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertNoteSchema, insertPhotoSchema, insertTaskAttachmentSchema, insertSubjectSchema, insertMoodEntrySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { generateRecommendations } from "./recommendation-engine";
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
      
      // Make a copy of the request body for potential AI modification
      const requestBody = { ...req.body };
      
      // If subject is not explicitly set, use manual keyword-based categorization
      if (!requestBody.subject) {
        const { keywordBasedCategorization } = await import('./ai-categorization');
        const suggestedSubject = keywordBasedCategorization(requestBody.title, requestBody.description);
        if (suggestedSubject) {
          console.log(`Manual categorization assigned task "${requestBody.title}" as: ${suggestedSubject}`);
          requestBody.subject = suggestedSubject;
        }
      }
      
      const taskData = insertTaskSchema.parse({
        ...requestBody,
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
      
      // Make a copy of the request body for potential AI modification
      const requestBody = { ...req.body };
      
      // If title is being updated but subject isn't explicitly set, consider recategorizing
      if (requestBody.title && !requestBody.subject && (!existingTask.subject || req.query.recategorize === 'true')) {
        const { keywordBasedCategorization } = await import('./ai-categorization');
        const description = requestBody.description !== undefined ? requestBody.description : existingTask.description;
        const suggestedSubject = keywordBasedCategorization(requestBody.title, description);
        if (suggestedSubject) {
          console.log(`Manual recategorization assigned task "${requestBody.title}" as: ${suggestedSubject}`);
          requestBody.subject = suggestedSubject;
        }
      }
      
      // Validate the update data
      const updateData = insertTaskSchema.partial().parse(requestBody);
      
      // Check if task is being marked as completed
      const statusChangingToCompleted = existingTask.status !== "completed" && updateData.status === "completed";
      
      const updatedTask = await storage.updateTask(taskId, updateData);
      
      // If task is being marked as completed and we have a valid updated task, award points
      if (statusChangingToCompleted && updatedTask) {
        const userId = updatedTask.userId;
        
        // Award points based on subject
        let pointsToAward = 10; // Base points for completing any task
        
        // Give bonus points based on subject if we have one
        if (updatedTask.subject) {
          // Assign bonus points for different subjects
          const subjectBonusPoints: Record<string, number> = {
            'Mathematics': 5,
            'Science': 5,
            'English': 5, 
            'History': 5,
            'Art': 5,
            'Physical Activity': 5,
            'Life Skills': 5,
            'Interest / Passion': 10 // Extra bonus for pursuing personal interests
          };
          
          // Award bonus if the subject exists in our list
          const bonus = subjectBonusPoints[updatedTask.subject] || 0;
          pointsToAward += bonus;
        }
        
        // Award points 
        await storage.addPoints({
          userId,
          amount: pointsToAward,
          reason: `Completed task: ${updatedTask.title || 'Unnamed task'}`,
          taskId: updatedTask.id
        });
        
        // Update user streak
        await storage.updateUserStreak(userId);
        
        // Get user's current stats
        const completedTaskCount = (await storage.getTasksByStatus(userId, "completed")).length;
        
        // Check for eligible achievements
        if (completedTaskCount >= 10) {
          // Find the Task Master achievement
          const achievements = await storage.getAchievements();
          const taskMasterAchievement = achievements.find(a => a.title === "Task Master");
          
          if (taskMasterAchievement) {
            // Check if user already has this achievement
            const userAchievements = await storage.getUserAchievements(userId);
            const alreadyHasAchievement = userAchievements.some(ua => ua.achievementId === taskMasterAchievement.id);
            
            // If not, award it
            if (!alreadyHasAchievement) {
              await storage.awardAchievement({
                userId,
                achievementId: taskMasterAchievement.id
              });
            }
          }
        }
      }
      
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
      
      console.log("Request body:", req.body);
      
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
      const { password, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Update user profile and avatar
  app.patch("/api/user", upload.single('avatar'), async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const { name, email } = req.body;
      
      // Prepare update data
      const updateData: any = {};
      
      if (name) {
        updateData.name = name;
      }
      
      if (email) {
        updateData.email = email;
      }
      
      // If there's a file upload, process it
      if (req.file) {
        // Convert the file to a base64 string for storage
        const base64File = req.file.buffer.toString('base64');
        // Store with the mime type for proper rendering later
        updateData.avatar = `data:${req.file.mimetype};base64,${base64File}`;
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password or reset tokens
      const { password, resetToken, resetTokenExpiry, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Request password reset
  app.post("/api/password-reset/request", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Import email functions
      const { createPasswordResetToken, sendPasswordResetEmail } = await import('./email');
      
      // Create password reset token
      const resetToken = await createPasswordResetToken(email);
      
      if (!resetToken) {
        // Don't reveal if the email exists or not for security reasons
        return res.json({ success: true, message: "If an account with that email exists, a password reset link has been sent." });
      }
      
      // Create reset URL - in production this would be your actual domain
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
      
      // Send password reset email
      await sendPasswordResetEmail(email, resetUrl);
      
      // Return success message
      return res.json({ success: true, message: "If an account with that email exists, a password reset link has been sent." });
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Reset password with token
  app.post("/api/password-reset/reset", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      // Import verification function
      const { verifyPasswordResetToken } = await import('./email');
      
      // Verify the token and get the user ID
      const userId = await verifyPasswordResetToken(token);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Update user's password and clear reset token
      await storage.updateUser(userId, {
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null
      });
      
      // Return success message
      return res.json({ success: true, message: "Password has been reset successfully" });
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // === Gamification Routes ===
  
  // Get user achievements
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Get user's earned achievements
  app.get("/api/user-achievements", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Get user stats (points, level, streak)
  app.get("/api/user-stats", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Get personalized learning recommendations based on completed tasks
  app.get("/api/recommendations", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const recommendations = await generateRecommendations(userId);
      res.json(recommendations);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Get user points history
  app.get("/api/points-history", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const pointsHistory = await storage.getPointsHistory(userId);
      res.json(pointsHistory);
    } catch (err: any) {
      handleError(err, res);
    }
  });
  
  // Update user streak (called when user logs in or completes a task)
  app.post("/api/update-streak", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const user = await storage.updateUserStreak(userId);
      res.json({ success: true, streak: user?.streak || 0 });
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // == Mood Tracking Routes ==
  
  // Get all mood entries for a user
  app.get("/api/mood-entries", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const moodEntries = await storage.getMoodEntries(userId);
      res.json(moodEntries);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // Get today's mood entry for a user
  app.get("/api/mood-entries/today", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const todaysMood = await storage.getTodaysMood(userId);
      res.json(todaysMood || null);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // Create a new mood entry
  app.post("/api/mood-entries", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for demo
      const moodData = insertMoodEntrySchema.parse({
        ...req.body,
        userId
      });
      
      const moodEntry = await storage.createMoodEntry(moodData);
      res.status(201).json(moodEntry);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // Get students' moods for coaches
  app.get("/api/coach/students-moods", async (req: Request, res: Response) => {
    try {
      const coachId = 1; // Hardcoded for demo
      const students = await storage.getCoachStudents(coachId);
      const studentIds = students.map(student => student.id);
      const studentsMoods = await storage.getStudentsMoodsToday(studentIds);
      res.json(studentsMoods);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // Coach routes
  app.post("/api/coach/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // For demo, create a coach account
      let coach = await storage.getUserByUsername(username);
      if (!coach) {
        coach = await storage.createUser({
          username,
          password,
          name: "Learning Coach",
          email: `${username}@coach.example.com`,
        });
      }
      
      res.json({ success: true, coach: { id: coach.id, name: coach.name, username: coach.username } });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/coach/assign-task", async (req: Request, res: Response) => {
    try {
      const { selectedStudents, title, description, subject, resourceLink, dueDate, dueTime } = req.body;
      
      if (!selectedStudents || !Array.isArray(selectedStudents) || selectedStudents.length === 0) {
        return res.status(400).json({ error: "Please select at least one student" });
      }
      
      // Get coach ID (in a real app, this would come from session)
      const coachId = 2; // Using coach ID 2 for the demo coach account
      
      const createdTasks = [];
      
      // Create task for each selected student
      for (const studentEmail of selectedStudents) {
        // Find student by email
        const student = await storage.getUserByEmail(studentEmail);
        if (student) {
          // Create coach task
          const task = await storage.createTask({
            title,
            description: description || null,
            subject: subject || null,
            resourceLink: resourceLink || null,
            category: "brain", // Default category since it's required by the schema
            status: "pending",
            dueDate: dueDate || null,
            dueTime: dueTime || null,
            userId: student.id,
            assignedByCoachId: coachId,
            isCoachTask: true,
            order: 0,
          });
          createdTasks.push(task);
        }
      }
      
      res.json({ 
        message: `Task assigned to ${createdTasks.length} student(s)`,
        tasks: createdTasks 
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/coach/students", async (req: Request, res: Response) => {
    try {
      const coachId = 2; // Using coach ID 2 for the demo coach account
      const students = await storage.getCoachStudents(coachId);
      res.json(students);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/coach/stats", async (req: Request, res: Response) => {
    try {
      const coachId = 2; // Using coach ID 2 for the demo coach account
      const stats = await storage.getCoachStats(coachId);
      res.json(stats);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Portfolio routes
  app.get("/api/portfolio", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID for demo
      const portfolioItems = await storage.getPortfolioItems(userId);
      res.json(portfolioItems);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  app.post("/api/portfolio", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID for demo
      const portfolioData = {
        ...req.body,
        userId
      };
      const portfolioItem = await storage.createPortfolioItem(portfolioData);
      res.status(201).json(portfolioItem);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  app.patch("/api/portfolio/:id", async (req: Request, res: Response) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const updatedItem = await storage.updatePortfolioItem(portfolioId, req.body);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      
      res.json(updatedItem);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  app.delete("/api/portfolio/:id", async (req: Request, res: Response) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const deleted = await storage.deletePortfolioItem(portfolioId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      
      res.json({ message: "Portfolio item deleted successfully" });
    } catch (err: any) {
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
