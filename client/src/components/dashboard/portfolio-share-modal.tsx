import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, ExternalLink, File, FolderOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

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
  onSuccess?: () => void;
}

const PortfolioShareModal = ({
  open,
  onOpenChange,
  task,
  onSuccess,
}: PortfolioShareModalProps) => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth(); // Get auth state
  const [isSharing, setIsSharing] = useState(false);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [includeProof, setIncludeProof] = useState(true);

  // Fetch user portfolios when modal opens
  useEffect(() => {
    if (open && isAuthenticated) {
      fetchPortfolios();
    }
  }, [open, isAuthenticated]);

  const fetchPortfolios = async () => {
    try {
      const response = await fetch("/api/portfolio");
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
      } else {
        console.error("Failed to fetch portfolios:", response.status);
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error);
    }
  };

  // Get all proof files (support both single proofUrl and multiple proofFiles)
  const proofFiles =
    task.proofFiles && task.proofFiles.length > 0
      ? task.proofFiles
      : task.proofUrl
        ? [task.proofUrl]
        : [];

  // FIXED: Enhanced portfolio sharing with better auth handling
  const shareToPortfolioMutation = useMutation({
    mutationFn: async (portfolioData: any) => {
      console.log("🔄 Sharing task to portfolio with data:", {
        taskId: task.id,
        portfolioIds: portfolioData.portfolioIds || [],
        includeProof: portfolioData.includeProof,
        proofFilesCount: portfolioData.proofFiles?.length || 0,
        hasProofText: !!task.proofText,
        hasProofLink: !!task.proofLink,
      });

      // Check authentication first
      if (!isAuthenticated) {
        throw new Error("User is not authenticated. Please log in again.");
      }

      // Use the fixed share-task endpoint
      const response = await apiRequest("POST", "/api/portfolio/share-task", {
        taskId: task.id,
        portfolioIds: portfolioData.portfolioIds || [],
        includeProof: portfolioData.includeProof,
        proofFiles: portfolioData.includeProof ? portfolioData.proofFiles : [],
        proofText: portfolioData.includeProof ? task.proofText || "" : "",
        proofLink: portfolioData.includeProof ? task.proofLink || "" : "",
      });

      if (!response) {
        throw new Error("No response from server");
      }

      // Check if the response indicates success
      if (!response.success) {
        throw new Error(
          response.message || "Failed to share task to portfolio",
        );
      }

      return response;
    },
    onSuccess: (data) => {
      console.log("✅ Successfully shared to portfolio:", data);

      // Invalidate portfolio queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/items"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioItems"] });

      toast({
        title: "🎉 Added to Portfolio!",
        description:
          data.message ||
          `Task has been added to ${data.items?.length || 1} portfolio(s) successfully.`,
        variant: "default",
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("❌ Portfolio sharing error:", error);

      // Parse the 401 error message
      let errorMessage = "Failed to add task to portfolio. ";

      if (
        error.message?.includes("401") ||
        error.message?.includes("Unauthorized")
      ) {
        errorMessage =
          "Authentication failed. Please log out and log in again, then try sharing.";
      } else if (error.message?.includes("No response")) {
        errorMessage +=
          "Server is not responding. Please check your connection.";
      } else if (error.message?.includes("Not authenticated")) {
        errorMessage = "Please log in again to share to your portfolio.";
      } else if (error.message?.includes("Task not found")) {
        errorMessage += "The task was not found. Please refresh and try again.";
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please try again later.";
      }

      toast({
        title: "Error adding to portfolio",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSharing(false);
    },
  });

  const handleShareToPortfolio = async () => {
    // Double-check authentication before proceeding
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in again to share to your portfolio.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);

    try {
      const shareData = {
        includeProof: includeProof,
        proofFiles: includeProof ? proofFiles : [],
        portfolioIds: selectedPortfolios.length > 0 ? selectedPortfolios : [],
      };

      console.log("🔄 Starting portfolio share with:", shareData);
      shareToPortfolioMutation.mutate(shareData);
    } catch (error) {
      console.error("Error in handleShareToPortfolio:", error);
      setIsSharing(false);
    }
  };

  // If no portfolios exist, we'll create one automatically when sharing
  const hasPortfolios = portfolios.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Portfolio</DialogTitle>
          <DialogDescription>
            Add this completed task to your portfolio to showcase your
            achievements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Preview */}
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
          {includeProof &&
            (proofFiles.length > 0 || task.proofText || task.proofLink) && (
              <div className="bg-gray-50 p-3 rounded-md border">
                <h4 className="text-sm font-medium mb-2">
                  Proof to be included:
                </h4>

                {/* File Proofs */}
                {proofFiles.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <File className="h-4 w-4 mr-1" />
                      <span>
                        {proofFiles.length} file
                        {proofFiles.length !== 1 ? "s" : ""}
                      </span>
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
          {hasPortfolios && (
            <div className="space-y-2">
              <Label className="text-sm">Select portfolios (optional):</Label>
              {portfolios.map((portfolio) => (
                <div key={portfolio.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`portfolio-${portfolio.id}`}
                    checked={selectedPortfolios.includes(portfolio.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPortfolios([
                          ...selectedPortfolios,
                          portfolio.id,
                        ]);
                      } else {
                        setSelectedPortfolios(
                          selectedPortfolios.filter(
                            (id) => id !== portfolio.id,
                          ),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`portfolio-${portfolio.id}`}
                    className="text-sm font-normal"
                  >
                    {portfolio.title || portfolio.name}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Info message if no portfolios exist */}
          {!hasPortfolios && (
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <p className="text-sm text-amber-800">
                No portfolios found. A new portfolio item will be created
                automatically.
              </p>
            </div>
          )}

          {/* Authentication status */}
          {!isAuthenticated && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <p className="text-sm text-red-800">
                ⚠️ You are not authenticated. Please log in again to share to
                your portfolio.
              </p>
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
            disabled={isSharing || !isAuthenticated}
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
