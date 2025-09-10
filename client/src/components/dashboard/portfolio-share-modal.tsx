import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PortfolioShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: number;
    title: string;
    description?: string;
    subject?: string;
    proofUrl?: string;
    proofFiles?: string[];
  };
}

const PortfolioShareModal = ({ open, onOpenChange, task }: PortfolioShareModalProps) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  // Share to portfolio mutation
  const shareToPortfolioMutation = useMutation({
    mutationFn: async () => {
      // Get proof files (support both single proofUrl and multiple proofFiles)
      const proofFiles = task.proofFiles && task.proofFiles.length > 0 
        ? task.proofFiles 
        : task.proofUrl 
          ? [task.proofUrl] 
          : [];

      if (proofFiles.length > 0) {
        // Create separate portfolio items for each proof file to better showcase images
        const uploadPromises = proofFiles.map(async (proofFile, index) => {
          return apiRequest("POST", "/api/portfolio", {
            title: index === 0 ? task.title : `${task.title} (${index + 1})`,
            description: task.description || "",
            subject: task.subject || "General",
            type: proofFile.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "photo" : "file",
            sourceId: task.id,
            filePath: proofFile,
            featured: index === 0 // Only feature the first one
          });
        });
        
        const responses = await Promise.all(uploadPromises);
        return responses;
      } else {
        // Create single portfolio item without proof
        const response = await apiRequest("POST", "/api/portfolio", {
          title: task.title,
          description: task.description || "",
          subject: task.subject || "General",
          type: "task",
          sourceId: task.id,
          featured: false
        });

        if (!response) {
          throw new Error("No response from server");
        }

        return [response];
      }
    },
    onSuccess: (data) => {
      // Invalidate both portfolio queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioItems"] });

      const itemCount = Array.isArray(data) ? data.length : 1;
      toast({
        title: "Added to Portfolio",
        description: itemCount === 1 
          ? "Task has been added to your portfolio successfully."
          : `Task has been added to your portfolio as ${itemCount} items successfully.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Portfolio sharing error:", error);
      toast({
        title: "Error adding to portfolio",
        description: error.message || "Failed to add task to portfolio. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSharing(false);
    }
  });

  const handleShareToPortfolio = () => {
    setIsSharing(true);
    shareToPortfolioMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Portfolio</DialogTitle>
          <DialogDescription>
            Add this completed task to your portfolio to showcase your achievements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-blue-800 mb-2">{task.description}</p>
            )}
            {task.subject && (
              <span className="inline-block px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
                {task.subject}
              </span>
            )}
          </div>

          <div className="pt-2 text-sm text-gray-500">
            <p>Adding this to your portfolio will allow you to showcase your work to coaches and peers.</p>
            {(task.proofFiles && task.proofFiles.length > 1) || (task.proofUrl && task.proofFiles && task.proofFiles.length > 0) ? (
              <p className="mt-1 text-xs text-blue-600">
                Multiple proof files will be added as separate portfolio items for better display.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleShareToPortfolio}
            disabled={isSharing}
            className="bg-primary hover:bg-primary/90"
          >
            {isSharing ? "Adding..." : "Add to Portfolio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioShareModal;import { useState, FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, Image as ImageIcon, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PortfolioShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
}

const PortfolioShareModal: FC<PortfolioShareModalProps> = ({ 
  open, 
  onOpenChange, 
  task 
}) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  // Get proof files
  const proofFiles = task.proofFiles && task.proofFiles.length > 0 
    ? task.proofFiles 
    : task.proofUrl 
      ? [task.proofUrl] 
      : [];

  // Get preview URLs if available
  const proofPreviews = task.proofPreviews || [];

  // Get the first image proof for preview
  const firstImageProof = proofPreviews.length > 0 
    ? proofPreviews[0] 
    : proofFiles.find(file => file && /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

  // Add to portfolio mutation
  const addToPortfolioMutation = useMutation({
    mutationFn: async () => {
      // Create portfolio item from task
      const portfolioData = {
        title: task.title,
        description: task.description,
        subject: task.subject,
        type: "task",
        proofFiles: task.proofFiles || (task.proofUrl ? [task.proofUrl] : []),
        proofPreviews: task.proofPreviews || [],
        completedAt: new Date().toISOString(),
        taskId: task.id
      };

      return apiRequest("POST", "/api/portfolio", portfolioData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Added to portfolio!",
        description: "Your completed task has been added to your portfolio.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error adding to portfolio",
        description: error.message || "Failed to add task to portfolio. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsAdding(false);
    }
  });

  const handleAddToPortfolio = () => {
    setIsAdding(true);
    addToPortfolioMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-0 rounded-xl shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Add to Portfolio
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Add this completed task to your portfolio to showcase your achievements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-blue-800 mt-1">{task.description}</p>
            )}
          </div>

          {firstImageProof && (
            <div className="bg-gray-100 rounded-lg p-3 flex justify-center">
              <img 
                src={firstImageProof} 
                alt="Task proof preview" 
                className="h-32 w-auto object-contain rounded"
              />
            </div>
          )}

          {proofFiles.length > 0 && !firstImageProof && (
            <div className="bg-gray-100 rounded-lg p-3 flex justify-center">
              <FileText className="h-24 w-24 text-gray-400" />
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>Adding this to your portfolio will allow you to showcase your work to coaches and peers.</p>
            {proofFiles.length > 0 && (
              <p className="mt-2 font-medium">
                {proofFiles.length} proof file{proofFiles.length !== 1 ? 's' : ''} will be included.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="btn-bounce border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddToPortfolio}
            disabled={isAdding}
            className="btn-bounce bg-emerald-600 hover:bg-emerald-700"
          >
            {isAdding ? "Adding..." : "Add to Portfolio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioShareModal;