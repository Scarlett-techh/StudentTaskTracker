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
  Paperclip,
  ExternalLink,
  CheckSquare,
  Image as ImageIcon,
  FileText
} from "lucide-react";

import TaskAttachmentSimple from "./task-attachment-simple";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TaskForm from "@/components/forms/task-form";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import CompletionModal from "./completion-modal";
import PortfolioShareModal from "./portfolio-share-modal";

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    description?: string;
    status: string;
    category?: string;
    subject?: string;
    resourceLink?: string;
    dueDate?: string;
    dueTime?: string;
    order: number;
    isCoachTask?: boolean;
    assignedByCoachId?: number;
    proofUrl?: string;
    proofFiles?: string[]; // Add support for multiple proof files
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
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false);
  const [currentProofIndex, setCurrentProofIndex] = useState(0);

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

  // Get all proof files (support both single proofUrl and multiple proofFiles)
  const proofFiles = task.proofFiles && task.proofFiles.length > 0 
    ? task.proofFiles 
    : task.proofUrl 
      ? [task.proofUrl] 
      : [];

  // Check if we have any image proofs
  const hasImageProofs = proofFiles.some(file => 
    file && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  );

  // Get the first image proof for background (if available)
  const firstImageProof = proofFiles.find(file => 
    file && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  );

  // Get the correct URL for a proof file
  const getProofUrl = (fileUrl: string) => {
    if (!fileUrl) return null;

    // If it's already a full URL or data URL, use it directly
    if (fileUrl.startsWith('http') || fileUrl.startsWith('data:') || fileUrl.startsWith('/')) {
      return fileUrl;
    }

    // Otherwise, assume it's a relative path from the server
    return `/${fileUrl}`;
  };

  const backgroundProofUrl = firstImageProof ? getProofUrl(firstImageProof) : null;

  // Task status toggle mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return apiRequest("PATCH", `/api/tasks/${task.id}`, { status: newStatus });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points-history"] });

      if (onTaskUpdate) onTaskUpdate();

      // Show special toast when completing a task (earning points)
      if (variables === 'completed') {
        // Base points + category bonus
        const basePoints = 10;
        const categoryBonus = task.category ? 5 : 0;
        const totalPoints = basePoints + categoryBonus;

        toast({
          title: "Task completed! 🎉",
          description: `You earned ${totalPoints} points for completing this task!`,
          variant: "default",
        });
      } else {
        toast({
          title: "Task updated",
          description: "Task status has been updated successfully.",
        });
      }
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
    // Open completion modal instead of directly toggling status
    if (task.status !== 'completed') {
      setCompletionDialogOpen(true);
    } else {
      // If already completed, allow marking as pending
      toggleStatusMutation.mutate('pending');
    }
  };

  const handleCompleteWithProof = async (proofUrls: string[]) => {
    try {
      // Update task with proof and mark as completed
      await apiRequest("PATCH", `/api/tasks/${task.id}`, { 
        status: 'completed',
        proofFiles: proofUrls // Store as array for multiple files
      });

      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      if (onTaskUpdate) onTaskUpdate();

      toast({
        title: "Task completed! 🎉",
        description: proofUrls.length > 0 
          ? `Your task has been marked as completed with ${proofUrls.length} proof file(s).` 
          : "Your task has been marked as completed.",
      });
    } catch (error: any) {
      toast({
        title: "Error completing task",
        description: error.message,
        variant: "destructive",
      });
    }
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

  // Navigation for proof preview
  const handleNextProof = () => {
    setCurrentProofIndex((prev) => (prev + 1) % proofFiles.length);
  };

  const handlePrevProof = () => {
    setCurrentProofIndex((prev) => (prev - 1 + proofFiles.length) % proofFiles.length);
  };

  return (
    <>
      <div 
        className={cn(
          "task-card group border-l-4 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all card-shadow relative overflow-hidden",
          task.status === 'completed' 
            ? "border-l-emerald-400" 
            : task.status === 'in-progress'
              ? "border-l-indigo-400"
              : "border-l-amber-400"
        )}
        data-task-id={task.id}
        style={backgroundProofUrl && task.status === 'completed' ? {
          backgroundImage: `url(${backgroundProofUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : {
          background: task.status === 'completed' 
            ? "linear-gradient(to right, rgba(209, 250, 229, 0.5), white)" 
            : task.status === 'in-progress'
              ? "white"
              : "white"
        }}
      >
        {/* Background overlay for better readability - stronger overlay for image backgrounds */}
        {backgroundProofUrl && task.status === 'completed' ? (
          <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />
        ) : task.status === 'completed' ? (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 to-white/80 z-0" />
        ) : null}

        <div className="relative z-10">
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
                    {/* Enhanced completion button */}
                    {task.status !== 'completed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompletionDialogOpen(true)}
                        className={cn(
                          "h-8 w-8 p-0 rounded-full transition-all duration-300 hover:scale-110",
                          "bg-white border-2 border-amber-400 hover:bg-amber-50"
                        )}
                      >
                        <CheckSquare className="h-4 w-4 text-amber-600" />
                      </Button>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 
                      className={cn(
                        "text-sm sm:text-base font-medium",
                        task.status === 'completed' && backgroundProofUrl
                          ? "text-white font-semibold drop-shadow-md" 
                          : task.status === 'completed'
                            ? "line-through text-gray-800 font-semibold"
                            : "text-gray-900 font-semibold",
                        task.isCoachTask && "cursor-pointer hover:text-blue-600 transition-colors"
                      )}
                      onClick={task.isCoachTask ? () => setEditDialogOpen(true) : undefined}
                    >
                      {task.title}
                    </h4>
                    <div className="mt-1 flex items-center flex-wrap gap-2">
                      {task.subject && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "shadow-sm border-transparent font-medium",
                            task.status === 'completed' && backgroundProofUrl
                              ? "bg-white/90 text-gray-800" 
                              : task.subject === 'Mathematics' && "bg-blue-100 text-blue-800",
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
                      {task.isCoachTask && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            task.status === 'completed' && backgroundProofUrl
                              ? "bg-white/90 text-blue-800" 
                              : "bg-blue-50 text-blue-700 border-blue-200 font-medium"
                          )}
                        >
                          Coach Assignment
                        </Badge>
                      )}
                      <Badge 
                        variant={currentStatus.variant}
                        className={cn(
                          "flex items-center shadow-sm",
                          task.status === 'completed' && backgroundProofUrl
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                            : task.status === 'completed' && "bg-emerald-500 hover:bg-emerald-600",  
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
                    task.status === 'completed' && backgroundProofUrl
                      ? "text-white drop-shadow-md" 
                      : task.status === 'completed' 
                        ? "line-through text-gray-600" 
                        : "text-gray-600"
                  )}>
                    {task.description}
                  </div>
                )}

                {/* Show proof if task is completed and has proof */}
                {task.status === 'completed' && proofFiles.length > 0 && (
                  <div className="mt-2 pl-8">
                    <div className={cn(
                      "flex items-center text-sm rounded-lg p-2 border",
                      backgroundProofUrl
                        ? "bg-white/90 text-emerald-800 border-emerald-300"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    )}>
                      <Paperclip className="h-4 w-4 mr-2" />
                      <span>{proofFiles.length} proof file{proofFiles.length !== 1 ? 's' : ''} attached</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-6 px-2 text-xs"
                        onClick={() => setProofPreviewOpen(true)}
                      >
                        View All
                      </Button>
                    </div>

                    {/* Image preview for first image */}
                    {backgroundProofUrl && (
                      <div className="mt-2">
                        <img 
                          src={backgroundProofUrl} 
                          alt="Proof preview" 
                          className="h-20 w-auto object-contain rounded border border-gray-200 cursor-pointer"
                          onClick={() => setProofPreviewOpen(true)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {task.resourceLink && (
                  <div className="mt-2 pl-8">
                    <a 
                      href={task.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium hover:shadow-sm",
                        task.status === 'completed' && backgroundProofUrl
                          ? "bg-white/90 text-blue-700 hover:bg-white border-blue-200 hover:text-blue-800"
                          : "bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border-blue-200"
                      )}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Resource Link
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end ml-4">
              <div className="flex space-x-1">
                {task.status === 'completed' && (
                  <button 
                    className={cn(
                      "transition-all hover:scale-110 p-1 rounded-full",
                      backgroundProofUrl
                        ? "text-white/80 hover:text-white hover:bg-white/20"
                        : "text-gray-400 hover:text-blue-600 hover:bg-blue-100"
                    )}
                    onClick={() => setShareDialogOpen(true)}
                    title="Share completed task"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}
                <button 
                  className={cn(
                    "transition-all hover:scale-110 p-1 rounded-full",
                    backgroundProofUrl
                      ? "text-white/80 hover:text-white hover:bg-white/20"
                      : "text-gray-400 hover:text-primary hover:bg-primary/10"
                  )}
                  onClick={handleEditClick}
                  title="Edit task"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  className={cn(
                    "transition-all hover:scale-110 p-1 rounded-full",
                    backgroundProofUrl
                      ? "text-white/80 hover:text-white hover:bg-white/20"
                      : "text-gray-400 hover:text-red-600 hover:bg-red-100"
                  )}
                  onClick={() => setDeleteDialogOpen(true)}
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {(task.dueDate || task.dueTime) && (
                <div className="mt-auto pt-3">
                  <div className={cn(
                    "text-xs px-2 py-1 rounded-full flex items-center shadow-sm",
                    backgroundProofUrl
                      ? "bg-white/90 text-gray-700"
                      : "bg-gray-100 text-gray-700"
                  )}>
                    <Clock className="h-3 w-3 mr-1" />
                    {task.dueTime ? `Due at ${formatDueTime()}` : 'Due today'}
                  </div>
                </div>
              )}
            </div>
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

      {/* Portfolio Share Modal */}
      <PortfolioShareModal
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        task={task}
      />

      {/* Completion Modal - Updated to support multiple files */}
      <CompletionModal
        open={completionDialogOpen}
        onOpenChange={setCompletionDialogOpen}
        task={task}
        onComplete={handleCompleteWithProof}
      />

      {/* Proof Preview Dialog - Updated to support multiple files */}
      <Dialog open={proofPreviewOpen} onOpenChange={setProofPreviewOpen}>
        <DialogContent className="bg-white border-0 rounded-xl shadow-lg max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-heading">
              Proof Preview ({currentProofIndex + 1} of {proofFiles.length})
            </DialogTitle>
          </DialogHeader>

          {proofFiles.length > 0 && (
            <>
              <div className="flex justify-center relative">
                {proofFiles.length > 1 && (
                  <>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10"
                      onClick={handlePrevProof}
                    >
                      ←
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10"
                      onClick={handleNextProof}
                    >
                      →
                    </Button>
                  </>
                )}

                {/\.(jpg|jpeg|png|gif|webp)$/i.test(proofFiles[currentProofIndex]) ? (
                  <img 
                    src={getProofUrl(proofFiles[currentProofIndex]) || ''} 
                    alt={`Proof ${currentProofIndex + 1}`} 
                    className="max-h-96 w-auto object-contain rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg">
                    <FileText className="h-24 w-24 text-gray-400 mb-4" />
                    <p className="text-gray-600">Document preview not available</p>
                    <Button 
                      variant="default" 
                      className="mt-4"
                      onClick={() => window.open(getProofUrl(proofFiles[currentProofIndex]), '_blank')}
                    >
                      Open Document
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-center mt-4">
                {proofFiles.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 w-2 rounded-full mx-1 ${
                      index === currentProofIndex ? 'bg-primary' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentProofIndex(index)}
                    aria-label={`Go to proof ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <DialogFooter className="gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setProofPreviewOpen(false)}
              className="btn-bounce border-gray-300 hover:bg-gray-100"
            >
              Close
            </Button>
            <Button 
              onClick={() => window.open(getProofUrl(proofFiles[currentProofIndex]), '_blank')}
              className="btn-bounce bg-primary hover:bg-primary/90"
            >
              Open in New Tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCard;