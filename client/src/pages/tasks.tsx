import { useState, useEffect } from "react";
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
  const [isManualRefetch, setIsManualRefetch] = useState(false);
  const { toast } = useToast();
  const { apiClient } = useAuth();

  // ✅ IMPROVED: Tasks query with better caching and immediate display
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      try {
        console.log("📋 [TASKS] Fetching tasks...");
        const response = await apiClient("/tasks");
        const tasksData = response.tasks || [];
        console.log(
          "✅ [TASKS] Tasks fetched successfully:",
          tasksData.length,
          "tasks",
        );
        return tasksData;
      } catch (error) {
        console.error("❌ [TASKS] Error fetching tasks:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (
        error?.message?.includes("Not authenticated") ||
        error?.message?.includes("Unauthorized") ||
        error?.message?.includes("401")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    staleTime: 1000 * 60 * 5, // 5 minutes - consider data fresh longer
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache longer
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsManualRefetch(true);
    try {
      await refetch();
      toast({
        title: "Tasks refreshed!",
        description: "Your task list has been updated.",
      });
    } catch (error) {
      console.error("Failed to refresh tasks:", error);
    } finally {
      setIsManualRefetch(false);
    }
  };

  // Auto-refresh when component mounts or auth changes
  useEffect(() => {
    // Prefetch tasks when component mounts
    const prefetchTasks = async () => {
      try {
        await refetch();
      } catch (error) {
        console.error("Failed to prefetch tasks:", error);
      }
    };

    prefetchTasks();
  }, []);

  // Filter out undefined tasks to prevent rendering errors
  const filteredTasks = Array.isArray(tasks)
    ? tasks.filter((task) => task !== undefined && task !== null)
    : [];

  // Open task creation dialog
  const openNewTaskDialog = () => {
    setNewTaskDialogOpen(true);
  };

  // Handle task updates - automatically refetches data
  const handleTaskUpdate = () => {
    console.log("🔄 [TASKS] Task updated, auto-refreshing...");
    refetch();
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
              onClick={handleManualRefresh}
              disabled={isManualRefetch || isFetching}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCwIcon
                className={`h-4 w-4 ${isManualRefetch || isFetching ? "animate-spin" : ""}`}
              />
              {isManualRefetch || isFetching ? "Refreshing..." : "Refresh"}
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

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="h-8 w-24 bg-muted rounded mb-4"></div>
              <div className="space-y-3 w-full max-w-2xl">
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </div>
            <div className="text-gray-500 mt-4">Loading your tasks...</div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
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
                onClick={handleManualRefresh}
                disabled={isManualRefetch}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
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

        {/* Empty State */}
        {!isLoading && !error && filteredTasks.length === 0 && (
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
        )}

        {/* Tasks List */}
        {!isLoading && !error && filteredTasks.length > 0 && (
          <div className="bg-white rounded-xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-medium text-gray-900">
                    Task List
                    {(isManualRefetch || isFetching) && (
                      <span className="ml-2 text-sm text-gray-500">
                        (Updating...)
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredTasks.length} task
                    {filteredTasks.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
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
                {filteredTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="task-card transition-all duration-200 hover:shadow-md"
                  >
                    <TaskCard
                      task={task}
                      onTaskUpdate={handleTaskUpdate}
                      isDraggable={false}
                    />
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
              // Auto-refresh tasks after successful creation
              handleTaskUpdate();
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
