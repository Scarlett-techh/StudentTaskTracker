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

const Tasks = () => {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const { toast } = useToast();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Fetch tasks
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/tasks"],
  });
  
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
      
      // Refetch tasks to get the updated order
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
          <Button onClick={openNewTaskDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading tasks...</div>
        ) : !Array.isArray(tasks) || tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
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
            <h3 className="mt-2 text-lg font-medium text-gray-900">No tasks yet</h3>
            <p className="text-gray-500 mt-1">Add a new task to get started</p>
            <Button 
              onClick={openNewTaskDialog}
              className="mt-4"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Task List</h3>
                <Button 
                  size="sm" 
                  onClick={openNewTaskDialog}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {tasks.map((task: any, index: number) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <TaskCard 
                      task={task} 
                      onTaskUpdate={refetch}
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