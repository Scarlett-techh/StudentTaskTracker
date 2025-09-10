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
          sourceId: task.id
        });
        return [response];
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      
      toast({
        title: "Added to Portfolio",
        description: `${data.length} item(s) have been added to your portfolio.`,
      });
      onOpenChange(false);
      setIsSharing(false);
    },
    onError: (error) => {
      console.error('Portfolio share error:', error);
      toast({
        title: "Error",
        description: "Failed to add to portfolio. Please try again.",
        variant: "destructive",
      });
      setIsSharing(false);
    }
  });

  const handleShareToPortfolio = () => {
    setIsSharing(true);
    shareToPortfolioMutation.mutate();
  };

  // Get proof files for preview
  const proofFiles = task.proofFiles && task.proofFiles.length > 0 
    ? task.proofFiles 
    : task.proofUrl 
      ? [task.proofUrl] 
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Portfolio</DialogTitle>
          <DialogDescription>
            Showcase your completed work "{task.title}" in your portfolio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show preview if we have proof files */}
          {proofFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview:</p>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-hidden">
                {proofFiles.slice(0, 4).map((file, index) => (
                  <div key={index} className="bg-gray-100 rounded p-2 flex items-center justify-center">
                    {file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img 
                        src={file} 
                        alt={`Proof ${index + 1}`}
                        className="max-w-full max-h-16 object-contain rounded"
                      />
                    ) : (
                      <div className="text-xs text-gray-500 text-center">
                        File {index + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {proofFiles.length > 4 && (
                <p className="text-xs text-gray-500">
                  +{proofFiles.length - 4} more files
                </p>
              )}
            </div>
          )}

          <div className="text-sm text-gray-600">
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

export default PortfolioShareModal;