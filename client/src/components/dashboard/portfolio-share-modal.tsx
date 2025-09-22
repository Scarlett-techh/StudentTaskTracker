import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, ExternalLink, File, FolderOpen } from "lucide-react";

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
    proofText?: string;
    proofLink?: string;
  };
}

const PortfolioShareModal = ({ open, onOpenChange, task }: PortfolioShareModalProps) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [includeProof, setIncludeProof] = useState(true);

  // Fetch user portfolios when modal opens
  useEffect(() => {
    if (open) {
      fetchPortfolios();
    }
  }, [open]);

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolio');
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    }
  };

  // Get all proof files (support both single proofUrl and multiple proofFiles)
  const proofFiles = task.proofFiles && task.proofFiles.length > 0 
    ? task.proofFiles 
    : task.proofUrl 
      ? [task.proofUrl] 
      : [];

  // Share to portfolio mutation - updated to use the new endpoint
  const shareToPortfolioMutation = useMutation({
    mutationFn: async (portfolioIds: string[]) => {
      // Use the new share-task endpoint that handles all proof types
      const response = await apiRequest("POST", "/api/portfolio/share-task", {
        taskId: task.id,
        portfolioIds: portfolioIds,
        includeProof: includeProof,
        proofFiles: includeProof ? proofFiles : [],
        proofText: includeProof ? task.proofText || '' : '',
        proofLink: includeProof ? task.proofLink || '' : ''
      });

      if (!response) {
        throw new Error("No response from server");
      }

      return response;
    },
    onSuccess: (data) => {
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

  const handleShareToPortfolio = async () => {
    setIsSharing(true);

    // If no portfolios exist, create a default one first
    if (portfolios.length === 0) {
      try {
        // Create a default portfolio
        const response = await apiRequest("POST", "/api/portfolio", {
          title: "My Portfolio",
          description: "Default portfolio for my completed tasks",
          type: "general",
          subject: "General"
        });

        if (response) {
          // Use the newly created portfolio
          shareToPortfolioMutation.mutate([response.id]);
        } else {
          throw new Error("Failed to create default portfolio");
        }
      } catch (error: any) {
        console.error("Error creating default portfolio:", error);
        toast({
          title: "Error",
          description: "Failed to create a portfolio for your task. Please try again.",
          variant: "destructive"
        });
        setIsSharing(false);
      }
    } else if (selectedPortfolios.length === 0) {
      // If portfolios exist but none are selected, use the first one
      shareToPortfolioMutation.mutate([portfolios[0].id]);
    } else {
      // Use the selected portfolios
      shareToPortfolioMutation.mutate(selectedPortfolios);
    }
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

          {/* Include Proof Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-proof" 
              checked={includeProof} 
              onCheckedChange={(checked) => setIncludeProof(checked === true)}
            />
            <Label htmlFor="include-proof" className="text-sm">
              Include proof of work (files, links, notes)
            </Label>
          </div>

          {/* Proof Preview */}
          {includeProof && (proofFiles.length > 0 || task.proofText || task.proofLink) && (
            <div className="bg-gray-50 p-3 rounded-md border">
              <h4 className="text-sm font-medium mb-2">Proof to be included:</h4>

              {/* File Proofs */}
              {proofFiles.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <File className="h-4 w-4 mr-1" />
                    <span>{proofFiles.length} file{proofFiles.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}

              {/* Text Proof */}
              {task.proofText && (
                <div className="mb-2">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>Text note</span>
                  </div>
                </div>
              )}

              {/* Link Proof */}
              {task.proofLink && (
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    <span>Link</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Portfolio Selection - Only show if portfolios exist */}
          {portfolios.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Select portfolios (optional):</Label>
              {portfolios.map((portfolio) => (
                <div key={portfolio.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`portfolio-${portfolio.id}`}
                    checked={selectedPortfolios.includes(portfolio.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPortfolios([...selectedPortfolios, portfolio.id]);
                      } else {
                        setSelectedPortfolios(
                          selectedPortfolios.filter((id) => id !== portfolio.id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`portfolio-${portfolio.id}`} className="text-sm font-normal">
                    {portfolio.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
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
            <FolderOpen className="h-4 w-4 mr-2" />
            {isSharing ? "Adding..." : "Add to Portfolio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioShareModal;