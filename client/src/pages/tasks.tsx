import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import TaskCard from "@/components/dashboard/task-card";
import TaskForm from "@/components/forms/task-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";

// Add interface for Task
interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  subject?: string;
  status: "pending" | "in-progress" | "completed";
  // Add other properties as needed
}

const Tasks = () => {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const { toast } = useToast();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Fetch tasks with error handling
  const { data: tasks = [], isLoading, error, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
    retry: 2,
  });

  // Show error if tasks query fails
  if (error) {
    toast({
      title: "Error loading tasks",
      description: "Please try again later",
      variant: "destructive",
    });
  }

  // Fetch task attachments for all tasks
  const { data: allAttachments = [] } = useQuery({
    queryKey: ["/api/tasks/attachments"],
    enabled: Array.isArray(tasks) && tasks.length > 0,
  });

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
    if (dragItem.current === null || dragOverItem.current === null || !Array.isArray(tasks)) return;

    // Make a copy of the tasks array
    const _tasks = [...tasks];

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

    // Update the tasks order in the backend
    try {
      await apiRequest("PATCH", "/api/tasks/reorder", { tasks: tasksWithNewOrder });

      // Invalidate all task-related queries
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && 
          query.queryKey.some(key => 
            typeof key === 'string' && key.includes('task')
          )
      });
    } catch (error: any) {
      toast({
        title: "Error reordering tasks",
        description: error.message,
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
          <Button onClick={openNewTaskDialog} className="btn-bounce bg-primary hover:bg-primary/90 text-white shadow-lg">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-24 bg-muted rounded mb-4"></div>
              <div className="h-32 w-full max-w-md bg-muted rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl card-shadow p-8 text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-4">Error Loading Tasks</h3>
            <Button onClick={() => refetch()} className="btn-bounce bg-primary hover:bg-primary/90 text-white shadow-md">
              Try Again
            </Button>
          </div>
        ) : !Array.isArray(tasks) || tasks.length === 0 ? (
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
            <h3 className="mt-2 text-xl font-medium text-gray-900">No tasks yet</h3>
            <p className="text-gray-500 mt-2">Let's add some tasks to track your progress!</p>
            <Button 
              onClick={openNewTaskDialog}
              className="mt-6 btn-bounce bg-primary hover:bg-primary/90 text-white shadow-md"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Your First Task
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium text-gray-900">Task List</h3>
                <Button 
                  size="sm" 
                  onClick={openNewTaskDialog}
                  className="btn-bounce bg-primary hover:bg-primary/90 text-white shadow-md"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {tasks.map((task: Task, index: number) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="task-card"
                  >
                    <TaskCard 
                      task={task} 
                      onTaskUpdate={() => {
                        refetch();
                        // Invalidate all task-related queries
                        queryClient.invalidateQueries({ 
                          predicate: (query) => 
                            Array.isArray(query.queryKey) && 
                            query.queryKey.some(key => 
                              typeof key === 'string' && key.includes('task')
                            )
                        });
                      }}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task to track your work.
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            onSuccess={() => {
              setNewTaskDialogOpen(false);
              refetch();
              // Invalidate all task-related queries
              queryClient.invalidateQueries({ 
                predicate: (query) => 
                  Array.isArray(query.queryKey) && 
                  query.queryKey.some(key => 
                    typeof key === 'string' && key.includes('task')
                  )
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