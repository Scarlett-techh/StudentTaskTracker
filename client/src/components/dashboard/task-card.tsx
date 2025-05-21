import { useState, FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Menu as MenuIcon,
  Share2,
  Paperclip
} from "lucide-react";
import ShareTaskModal from "./share-task-modal";
import TaskAttachmentSimple from "./task-attachment-simple";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TaskForm from "@/components/forms/task-form";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    description?: string;
    status: string;
    category?: string;
    subject?: string;
    dueDate?: string;
    dueTime?: string;
    order: number;
  };
  onTaskUpdate?: () => void;
  isDraggable?: boolean;
}

const TaskCard: FC<TaskCardProps> = ({ 
  task, 
  onTaskUpdate,
  isDraggable = true
}) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);

  // Status badge configuration
  const statusConfig = {
    pending: {
      icon: <Clock className="mr-1 h-3 w-3" />,
      label: "Pending",
      variant: "secondary" as const
    },
    "in-progress": {
      icon: <AlertCircle className="mr-1 h-3 w-3" />,
      label: "In Progress",
      variant: "outline" as const
    },
    completed: {
      icon: <CheckCircle className="mr-1 h-3 w-3" />,
      label: "Completed",
      variant: "default" as const
    }
  };
  
  const currentStatus = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;

  // Task status toggle mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return apiRequest("PATCH", `/api/tasks/${task.id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      if (onTaskUpdate) onTaskUpdate();
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      if (onTaskUpdate) onTaskUpdate();
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleStatusToggle = () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    toggleStatusMutation.mutate(newStatus);
  };

  const handleDeleteTask = () => {
    deleteTaskMutation.mutate();
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    if (onTaskUpdate) onTaskUpdate();
  };

  // Format due time for display
  const formatDueTime = () => {
    if (!task.dueTime) return null;
    
    try {
      // Parse the time string (assuming format like "13:00")
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) return task.dueTime;
      
      const date = new Date();
      date.setHours(hours, minutes);
      
      return format(date, 'h:mm a');
    } catch (error) {
      return task.dueTime;
    }
  };

  return (
    <>
      <div 
        className={cn(
          "task-card group bg-white border-l-4 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all card-shadow",
          task.status === 'completed' 
            ? "border-l-emerald-400 bg-gradient-to-r from-emerald-50/50 to-white" 
            : task.status === 'in-progress'
              ? "border-l-indigo-400 bg-white"
              : "border-l-amber-400 bg-white"
        )}
        data-task-id={task.id}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            {isDraggable && (
              <div className="drag-handle mr-3 text-gray-400 hover:text-gray-600 hidden group-hover:flex items-center cursor-grab">
                <MenuIcon className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center">
                <div className="mr-3">
                  <Checkbox 
                    id={`task-${task.id}`}
                    checked={task.status === 'completed'}
                    onCheckedChange={handleStatusToggle}
                    className={cn(
                      task.status === 'completed' ? "border-emerald-500 bg-emerald-500" : "",
                      "transition-all duration-300 hover:scale-110"
                    )}
                  />
                </div>
                <div>
                  <h4 className={cn(
                    "text-sm sm:text-base font-medium",
                    task.status === 'completed' 
                      ? "line-through text-gray-500" 
                      : "text-gray-900 font-semibold"
                  )}>
                    {task.title}
                  </h4>
                  <div className="mt-1 flex items-center flex-wrap gap-2">
                    {task.subject && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "shadow-sm border-transparent font-medium",
                          task.subject === 'Mathematics' && "bg-blue-100 text-blue-800",
                          task.subject === 'Science' && "bg-purple-100 text-purple-800",
                          task.subject === 'English' && "bg-green-100 text-green-800",
                          task.subject === 'History' && "bg-amber-100 text-amber-800",
                          task.subject === 'Physical Activity' && "bg-pink-100 text-pink-800",
                          task.subject === 'Life Skills' && "bg-orange-100 text-orange-800",
                          task.subject === 'Interest / Passion' && "bg-teal-100 text-teal-800"
                        )}
                      >
                        {task.subject}
                      </Badge>
                    )}
                    <Badge 
                      variant={currentStatus.variant}
                      className={cn(
                        "flex items-center shadow-sm",
                        task.status === 'completed' && "bg-emerald-500 hover:bg-emerald-600",  
                        task.status === 'in-progress' && "bg-indigo-500 hover:bg-indigo-600",
                        task.status === 'pending' && "bg-amber-500 hover:bg-amber-600" 
                      )}
                    >
                      {currentStatus.icon}
                      {currentStatus.label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {task.description && (
                <div className={cn(
                  "mt-2 pl-8 text-sm",
                  task.status === 'completed' 
                    ? "line-through text-gray-500" 
                    : "text-gray-600"
                )}>
                  {task.description}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end ml-4">
            <div className="flex space-x-1">
              {task.status === 'completed' && (
                <button 
                  className="text-gray-400 hover:text-blue-600 transition-all hover:scale-110 p-1 rounded-full hover:bg-blue-100"
                  onClick={() => setShareDialogOpen(true)}
                  title="Share completed task"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              )}
              <button 
                className="text-gray-400 hover:text-primary transition-all hover:scale-110 p-1 rounded-full hover:bg-primary/10"
                onClick={() => setAttachmentDialogOpen(true)}
                title="Manage attachments"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button 
                className="text-gray-400 hover:text-secondary transition-all hover:scale-110 p-1 rounded-full hover:bg-secondary/10"
                onClick={handleEditClick}
                title="Edit task"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button 
                className="text-gray-400 hover:text-red-600 transition-all hover:scale-110 p-1 rounded-full hover:bg-red-100"
                onClick={() => setDeleteDialogOpen(true)}
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {(task.dueDate || task.dueTime) && (
              <div className="mt-auto pt-3">
                <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center shadow-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  {task.dueTime ? `Due at ${formatDueTime()}` : 'Due today'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white border-0 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Delete Task</DialogTitle>
            <DialogDescription className="text-gray-600">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 p-4 rounded-lg my-2 border border-red-100">
            <p className="text-sm text-red-800">Are you sure you want to delete this task?</p>
          </div>
          
          <DialogFooter className="gap-2 mt-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="btn-bounce border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTask}
              disabled={deleteTaskMutation.isPending}
              className="btn-bounce"
            >
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white border-0 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-heading">Edit Task</DialogTitle>
            <DialogDescription className="text-gray-600">
              Make changes to your task here.
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            task={{
              ...task,
              status: task.status as "pending" | "in-progress" | "completed",
            }}
            onSuccess={handleEditSuccess} 
            onCancel={handleEditClose} 
          />
        </DialogContent>
      </Dialog>

      {/* Share Task Dialog */}
      <ShareTaskModal
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        task={{
          title: task.title,
          description: task.description,
          category: 'task'
        }}
      />
      
      {/* Task Attachment Dialog */}
      <TaskAttachmentSimple
        open={attachmentDialogOpen}
        onOpenChange={setAttachmentDialogOpen}
        taskId={task.id}
      />
    </>
  );
};

export default TaskCard;