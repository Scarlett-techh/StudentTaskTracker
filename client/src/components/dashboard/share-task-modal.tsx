// client/src/components/dashboard/share-task-modal.tsx (FIXED VERSION)
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Check,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Link,
  FolderOpen,
  FileText,
  ExternalLink,
  File,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface ShareTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    title: string;
    description?: string;
    category: string;
    subject?: string;
    proofFiles?: string[];
    proofText?: string;
    proofLink?: string;
  };
}

const ShareTaskModal = ({ open, onOpenChange, task }: ShareTaskModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [includeProof, setIncludeProof] = useState(true);
  const [isSharingToPortfolio, setIsSharingToPortfolio] = useState(false);

  // ✅ FIXED: Get all proof files (support both single proofUrl and multiple proofFiles)
  const proofFiles = Array.isArray(task.proofFiles)
    ? task.proofFiles.filter((file) => file && file.trim() !== "")
    : [];

  // Generate share message
  const shareMessage = `I just completed "${task.title}"${
    task.subject ? ` in ${task.subject}` : ""
  }! #TaskCompleted`;

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);

    toast({
      title: "Copied!",
      description: "Share message copied to clipboard",
    });
  };

  // Share URLs
  const getTwitterShareUrl = () => {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
  };

  const getFacebookShareUrl = () => {
    return `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareMessage)}`;
  };

  const getLinkedInShareUrl = () => {
    return `https://www.linkedin.com/sharing/share-offsite/?summary=${encodeURIComponent(shareMessage)}`;
  };

  const getEmailShareUrl = () => {
    return `mailto:?subject=Task Completed&body=${encodeURIComponent(shareMessage)}`;
  };

  // Handle direct share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Task Completed",
          text: shareMessage,
        });
        toast({
          title: "Shared!",
          description: "Content shared successfully",
        });
      } catch (error) {
        console.error("Error sharing:", error);
        // Fallback if Web Share API fails
        handleCopy();
        toast({
          title: "Copied instead",
          description: "Share text was copied to clipboard",
        });
      }
    } else {
      // Fallback if Web Share API is not available
      handleCopy();
    }
  };

  // ✅ FIXED: Handle sharing to portfolio - Ensure title is always provided
  const handleShareToPortfolio = async () => {
    setIsSharingToPortfolio(true);

    try {
      // ✅ FIXED: Ensure title is never empty
      const portfolioTitle = task.title?.trim() || `Completed Task ${task.id}`;

      console.log("📋 [SHARE TASK] Sharing task to portfolio:", {
        taskId: task.id,
        title: portfolioTitle,
        includeProof,
        proofFilesCount: includeProof ? proofFiles.length : 0,
        hasProofText: includeProof && !!task.proofText,
        hasProofLink: includeProof && !!task.proofLink,
      });

      // ✅ FIXED: Use the corrected share-task endpoint with guaranteed title
      const response = await apiRequest("POST", "/api/portfolio/share-task", {
        taskId: task.id,
        title: portfolioTitle, // ✅ This will never be empty
        description: task.description || `Completed task: ${portfolioTitle}`,
        subject: task.subject || task.category || "General",
        proofFiles: includeProof ? proofFiles : [],
        proofText: includeProof ? task.proofText || "" : "",
        proofLink: includeProof ? task.proofLink || "" : "",
      });

      console.log("✅ [SHARE TASK] Share response:", response);

      if (response && response.success) {
        toast({
          title: "Success!",
          description:
            response.message || "Task shared to portfolio successfully",
        });
        onOpenChange(false);
      } else {
        throw new Error(
          response?.error ||
            response?.message ||
            "Failed to share to portfolio",
        );
      }
    } catch (error: any) {
      console.error("❌ [SHARE TASK] Error sharing to portfolio:", error);

      // ✅ FIXED: More specific error handling
      let errorMessage = "Failed to share task to portfolio. Please try again.";

      if (error.message.includes("Title is required")) {
        errorMessage =
          "Task title is required. Please make sure your task has a title.";
      } else if (error.message.includes("400")) {
        errorMessage =
          "Invalid request. Please check the task details and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSharingToPortfolio(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Accomplishment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Share your completed task to your portfolio or social media.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Information */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">Task Details</h3>
            <p className="text-blue-800 font-semibold">
              {task.title || "Untitled Task"}
            </p>
            {task.description && (
              <p className="text-blue-700 text-sm mt-1">{task.description}</p>
            )}
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="bg-white text-blue-700">
                {task.subject || task.category || "General"}
              </Badge>
            </div>
          </div>

          {/* Portfolio Sharing Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Share to Portfolio</h3>
            <p className="text-sm text-muted-foreground">
              Add this completed task to your learning portfolio to showcase
              your achievement.
            </p>

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
                    <div className="mb-3">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <File className="h-4 w-4 mr-1" />
                        <span>
                          {proofFiles.length} file
                          {proofFiles.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {proofFiles.slice(0, 3).map((file, index) => {
                          // Extract filename from URL or use index
                          let fileName = `proof-${index + 1}`;
                          if (file.includes("/")) {
                            fileName = file.split("/").pop() || fileName;
                          } else if (file.startsWith("data:")) {
                            fileName = `image-${index + 1}`;
                          }

                          return (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {fileName.length > 15
                                ? `${fileName.substring(0, 12)}...`
                                : fileName}
                            </Badge>
                          );
                        })}
                        {proofFiles.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{proofFiles.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Text Proof */}
                  {task.proofText && (
                    <div className="mb-3">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Text note</span>
                      </div>
                      <div className="text-xs text-gray-500 bg-white p-2 rounded border overflow-hidden">
                        {task.proofText.length > 100
                          ? `${task.proofText.substring(0, 100)}...`
                          : task.proofText}
                      </div>
                    </div>
                  )}

                  {/* Link Proof */}
                  {task.proofLink && (
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        <span>Link</span>
                      </div>
                      <div className="text-xs text-blue-600 bg-white p-2 rounded border overflow-hidden truncate">
                        {task.proofLink}
                      </div>
                    </div>
                  )}
                </div>
              )}

            <Button
              onClick={handleShareToPortfolio}
              disabled={isSharingToPortfolio || !task.title?.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              {isSharingToPortfolio
                ? "Sharing to Portfolio..."
                : "Share to Portfolio"}
              {!task.title?.trim() && " (Title Required)"}
            </Button>

            {/* Warning if no title */}
            {!task.title?.trim() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>Warning:</strong> This task doesn't have a title.
                  Please add a title before sharing to portfolio.
                </p>
              </div>
            )}
          </div>

          {/* Social Media Sharing Section */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Share on Social Media</h3>

            <div className="relative mb-4">
              <Textarea
                value={shareMessage}
                readOnly
                rows={3}
                className="pr-10 resize-none"
              />
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-2">Share via:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getTwitterShareUrl(), "_blank")}
                  className="flex-1 min-w-[120px]"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getFacebookShareUrl(), "_blank")}
                  className="flex-1 min-w-[120px]"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getLinkedInShareUrl(), "_blank")}
                  className="flex-1 min-w-[120px]"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getEmailShareUrl(), "_blank")}
                  className="flex-1 min-w-[120px]"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex-1 min-w-[120px]"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Direct Share
                </Button>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="pt-2 text-sm text-muted-foreground border-t">
            <p>
              💡 <strong>Tip:</strong> Sharing your completed tasks helps build
              your learning portfolio and motivates others!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTaskModal;
