import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import ProgressCard from "@/components/dashboard/progress-card";
import TaskCard from "@/components/dashboard/task-card";
import NoteCard from "@/components/dashboard/note-card";
import PhotoThumbnail from "@/components/dashboard/photo-thumbnail";
import UserStats from "@/components/dashboard/user-stats";
import LearningWallet from "@/components/dashboard/learning-wallet-new";
import LearningRecommendations from "@/components/dashboard/learning-recommendations";
import { MoodTracker } from "@/components/dashboard/mood-tracker";
import TaskForm from "@/components/forms/task-form";
import PhotoUpload from "@/components/forms/photo-upload";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth"; // ✅ ADDED: Import useAuth

const Dashboard = () => {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [photoUploadDialogOpen, setPhotoUploadDialogOpen] = useState(false);
  const { apiClient } = useAuth(); // ✅ ADDED: Get apiClient

  // Get current date
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");

  // ✅ FIXED: Fetch tasks with proper API response handling
  const {
    data: tasksData = { tasks: [] },
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      try {
        const response = await apiClient("/tasks");
        return response;
      } catch (error) {
        console.error("❌ [DASHBOARD] Error fetching tasks:", error);
        return { tasks: [] };
      }
    },
  });

  // ✅ FIXED: Extract tasks array from response
  const tasks = Array.isArray(tasksData.tasks) ? tasksData.tasks : [];

  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/recommendations"],
  });

  const {
    data: photos = [],
    isLoading: isLoadingPhotos,
    refetch: refetchPhotos,
  } = useQuery({
    queryKey: ["/api/photos"],
  });

  // Get user and stats
  const { data: user = {} } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: userStats = { points: 0, level: 1, streak: 0 } } = useQuery({
    queryKey: ["/api/user-stats"],
  });

  // ✅ FIXED: Calculate task stats using the correct tasks array
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t: any) => t.status === "completed").length,
    inProgress: tasks.filter((t: any) => t.status === "in-progress").length,
    pending: tasks.filter((t: any) => t.status === "pending").length,
    upcoming: 4, // This would normally be calculated based on due dates
  };

  // ✅ FIXED: Generate personalized welcome message with proper tasks array
  const getPersonalizedMessage = () => {
    const now = new Date();
    const hour = now.getHours();
    const firstName = user?.name?.split(" ")[0] || user?.firstName || "Student";

    // Time-based greeting
    let greeting = "Hello";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 17) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    // Progress-based encouragement
    let progressMessage = "";
    if (taskStats.completed > 0) {
      progressMessage = `You've completed ${taskStats.completed} task${taskStats.completed > 1 ? "s" : ""} - great work!`;
    } else if (taskStats.inProgress > 0) {
      progressMessage = `You have ${taskStats.inProgress} task${taskStats.inProgress > 1 ? "s" : ""} in progress. Keep going!`;
    } else if (taskStats.total > 0) {
      progressMessage =
        "Ready to tackle your tasks? Let's make today productive!";
    } else {
      progressMessage =
        "Ready to start your learning journey? Create your first task!";
    }

    // ✅ FIXED: Subject diversity message with proper tasks array
    const subjects = [
      ...new Set(tasks.map((t: any) => t.subject).filter(Boolean)),
    ];
    let diversityMessage = "";
    if (subjects.length > 3) {
      diversityMessage = ` You're exploring ${subjects.length} different subjects - amazing variety!`;
    } else if (subjects.length > 1) {
      diversityMessage = ` You're working on ${subjects.join(" and ")} - nice balance!`;
    }

    // Streak and achievement message
    let motivationMessage = "";
    if (userStats?.streak && userStats.streak > 0) {
      motivationMessage = ` 🔥 ${userStats.streak} day learning streak!`;
    }
    if (userStats?.points && userStats.points > 0) {
      motivationMessage += ` You've earned ${userStats.points} points so far.`;
    }

    return {
      greeting: `${greeting}, ${firstName}!`,
      main: progressMessage,
      diversity: diversityMessage,
      motivation: motivationMessage,
    };
  };

  const welcomeMessage = getPersonalizedMessage();

  return (
    <>
      <Helmet>
        <title>Dashboard - Student Task Tracker</title>
        <meta
          name="description"
          content="View your daily progress, manage tasks, take notes, and organize your academic life all in one place."
        />
      </Helmet>

      <div className="space-y-6">
        {/* Personalized Welcome Message */}
        <div className="glass-card rounded-2xl text-gray-900 p-8 animate-slide-up shadow-glow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-full opacity-20 animate-pulse-soft"></div>
          <div className="flex justify-between items-start flex-col sm:flex-row space-y-4 sm:space-y-0 relative z-10">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3 gradient-heading">
                {welcomeMessage.greeting}
              </h1>
              <p className="text-gray-700 text-xl mb-2">
                {welcomeMessage.main}
              </p>
              {welcomeMessage.diversity && (
                <p className="text-gray-600 text-lg">
                  {welcomeMessage.diversity}
                </p>
              )}
              {welcomeMessage.motivation && (
                <p className="points-display text-2xl font-bold mt-2">
                  {welcomeMessage.motivation}
                </p>
              )}
              <p className="text-gray-500 text-base mt-4">{currentDate}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setNewTaskDialogOpen(true)}
                className="btn-gradient px-6 py-3 text-lg animate-pulse-soft"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                New Task
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="glass-card rounded-2xl p-8 shadow-accent">
          <h3 className="text-2xl font-bold gradient-heading mb-6">
            Today's Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ProgressCard
              label="Completed"
              value={taskStats.completed}
              total={taskStats.total}
              type="completed"
            />
            <ProgressCard
              label="In Progress"
              value={taskStats.inProgress}
              total={taskStats.total}
              type="in-progress"
            />
            <ProgressCard
              label="Pending"
              value={taskStats.pending}
              total={taskStats.total}
              type="pending"
            />
            <ProgressCard
              label="Upcoming"
              value={taskStats.upcoming}
              type="upcoming"
            />
          </div>
        </div>

        {/* Mood Tracker Section */}
        <MoodTracker />

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Today's Tasks
              </h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <span className="mr-1 text-sm">Filter</span>
                </Button>
                <Button variant="outline" size="sm">
                  <span className="mr-1 text-sm">Sort</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="p-6">
            {isLoadingTasks ? (
              <div className="text-center py-8">Loading tasks...</div>
            ) : tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.slice(0, 3).map((task: any) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onTaskUpdate={refetchTasks}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  ></path>
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No tasks for today
                </h3>
                <p className="text-gray-500 mt-1">
                  Add a new task to get started
                </p>
                <Button
                  onClick={() => setNewTaskDialogOpen(true)}
                  className="mt-4"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Learning Recommendations Section */}
        <div className="bg-white rounded-lg shadow">
          <LearningRecommendations />
        </div>

        {/* User Stats & Achievements Section */}
        <div className="space-y-6">
          <UserStats />
          <LearningWallet />
        </div>
      </div>

      {/* New Task Dialog */}
      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSuccess={() => {
              setNewTaskDialogOpen(false);
              refetchTasks();
            }}
            onCancel={() => setNewTaskDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog
        open={photoUploadDialogOpen}
        onOpenChange={setPhotoUploadDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          <PhotoUpload
            onSuccess={() => {
              setPhotoUploadDialogOpen(false);
              refetchPhotos();
            }}
            onCancel={() => setPhotoUploadDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
