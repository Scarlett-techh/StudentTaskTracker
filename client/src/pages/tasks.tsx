import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import TaskCard from "@/components/dashboard/task-card";
import TaskForm from "@/components/forms/task-form";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";

const Tasks = () => {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const { toast } = useToast();
  const { apiClient } = useAuth();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // ✅ FIXED: Enhanced tasks query with proper error handling
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      try {
        console.log("📋 [TASKS] Fetching tasks...");
        const response = await apiClient("/tasks");
        console.log(
          "✅ [TASKS] Tasks fetched successfully:",
          response.tasks?.length || 0,
          "tasks",
        );
        return response.tasks || [];
      } catch (error) {
        console.error("❌ [TASKS] Error fetching tasks:", error);
        // Don't show toast here to avoid duplicate errors with the error boundary
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (
        error.message.includes("Not authenticated") ||
        error.message.includes("Unauthorized")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
  });

  // Fetch task attachments for all tasks
  const { data: allAttachments = [] } = useQuery({
    queryKey: ["/api/tasks/attachments"],
    enabled: Array.isArray(tasks) && tasks.length > 0,
  });

  // Filter out undefined tasks to prevent rendering errors
  const filteredTasks = Array.isArray(tasks)
    ? tasks.filter((task) => task !== undefined && task !== null)
    : [];

  // Open task creation dialog
  const openNewTaskDialog = () => {
    setNewTaskDialogOpen(true);
  };

  // Handle drag-and-drop reordering
  const handleDragStart = (position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (position: number) => {
    dragOverItem.current = position;
  };

  const handleDrop = async () => {
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      !Array.isArray(filteredTasks)
    )
      return;

    // Make a copy of the tasks array
    const _tasks = [...filteredTasks];

    // Get the dragged item
    const draggedItemContent = _tasks[dragItem.current];

    // Remove the dragged item
    _tasks.splice(dragItem.current, 1);

    // Add the dragged item at the new position
    _tasks.splice(dragOverItem.current, 0, draggedItemContent);

    // Reset refs
    dragItem.current = null;
    dragOverItem.current = null;

    // Update the order property for each task
    const tasksWithNewOrder = _tasks.map((task, index) => ({
      id: task.id,
      order: index,
    }));

    // ✅ FIXED: Update the tasks order using apiClient
    try {
      console.log("🔄 [TASKS] Reordering tasks:", tasksWithNewOrder);
      await apiClient("/tasks/reorder", {
        method: "PATCH",
        body: JSON.stringify({ tasks: tasksWithNewOrder }),
      });

      // Refetch tasks to get the updated order
      await refetch();

      toast({
        title: "Tasks reordered",
        description: "Your tasks have been successfully reordered.",
      });
    } catch (error: any) {
      console.error("❌ [TASKS] Error reordering tasks:", error);
      toast({
        title: "Error reordering tasks",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Tasks refreshed",
        description: "Your tasks have been updated.",
      });
    } catch (error) {
      console.error("❌ [TASKS] Error refreshing tasks:", error);
      toast({
        title: "Error refreshing tasks",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Tasks - Student Task Tracker</title>
        <meta
          name="description"
          content="Manage and organize your academic tasks. Track progress, set due dates, and prioritize your work."
        />
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-heading">My Tasks</h2>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCwIcon
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={openNewTaskDialog}
              className="btn-bounce bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 font-semibold text-lg mb-2">
              Failed to load tasks
            </div>
            <div className="text-red-500 text-sm mb-4">
              {error.message || "Please check your connection and try again."}
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Try Again
              </Button>
              <Button
                onClick={openNewTaskDialog}
                className="bg-primary hover:bg-primary/90"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Task Anyway
              </Button>
            </div>
          </div>
        )}

        {isLoading && !error ? (
          <div className="text-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-24 bg-muted rounded mb-4"></div>
              <div className="h-32 w-full max-w-md bg-muted rounded"></div>
            </div>
            <div className="text-gray-500 mt-4">Loading your tasks...</div>
          </div>
        ) : filteredTasks.length === 0 && !error ? (
          <div className="bg-white rounded-xl card-shadow p-8 text-center">
            <div className="mb-4 p-4 rounded-full bg-primary/10 inline-flex">
              <svg
                className="h-12 w-12 text-primary"
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
            </div>
            <h3 className="mt-2 text-xl font-medium text-gray-900">
              No tasks yet
            </h3>
            <p className="text-gray-500 mt-2">
              Let's add some tasks to track your progress!
            </p>
            <Button
              onClick={openNewTaskDialog}
              className="mt-6 btn-bounce bg-primary hover:bg-primary/90 text-white shadow-md flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Create Your First Task
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-medium text-gray-900">
                    Task List
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredTasks.length} task
                    {filteredTasks.length !== 1 ? "s" : ""} • Drag to reorder
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCwIcon
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={openNewTaskDialog}
                    className="btn-bounce bg-primary hover:bg-primary/90 text-white shadow-md flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {filteredTasks.map((task: any, index: number) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="task-card cursor-move transition-all duration-200 hover:shadow-md"
                  >
                    <TaskCard task={task} onTaskUpdate={refetch} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Task Dialog */}
      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task to track your work. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            onSuccess={() => {
              setNewTaskDialogOpen(false);
              // The query will automatically refetch due to invalidation in TaskForm
              toast({
                title: "Task created successfully!",
                description: "Your new task has been added to your list.",
              });
            }}
            onCancel={() => {
              setNewTaskDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Tasks;
