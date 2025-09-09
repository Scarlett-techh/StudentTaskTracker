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
  };
}

const PortfolioShareModal = ({ open, onOpenChange, task }: PortfolioShareModalProps) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  // Share to portfolio mutation
  const shareToPortfolioMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/portfolio", {
        title: task.title,
        description: task.description || "",
        subject: task.subject || "General",
        type: "task",
        sourceId: task.id,
        proofUrl: task.proofUrl || "",
        featured: false
      });

      // Handle potential undefined response
      if (!response) {
        throw new Error("No response from server");
      }

      return response;
    },
    onSuccess: () => {
      // Invalidate both portfolio queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioItems"] });

      toast({
        title: "Added to Portfolio",
        description: "Task has been added to your portfolio successfully.",
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

export default PortfolioShareModal;