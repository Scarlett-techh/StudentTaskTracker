// client/src/components/dashboard/share-task-modal.tsx (updated)
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Check, Copy, Facebook, Twitter, Linkedin, Mail, Link, FolderOpen, FileText, ExternalLink, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ShareTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    title: string;
    description?: string;
    category: string;
    proofFiles?: string[];
    proofText?: string;
    proofLink?: string;
  };
}

const ShareTaskModal = ({ open, onOpenChange, task }: ShareTaskModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [includeProof, setIncludeProof] = useState(true);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [isSharingToPortfolio, setIsSharingToPortfolio] = useState(false);

  // Get all proof files (support both single proofUrl and multiple proofFiles)
  const proofFiles = task.proofFiles && task.proofFiles.length > 0 
    ? task.proofFiles 
    : [];

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

  // Generate share message
  const shareMessage = `I just completed "${task.title}" in my ${task.category} category! #TaskCompleted`;

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
          title: 'Task Completed',
          text: shareMessage,
        });
        toast({
          title: "Shared!",
          description: "Content shared successfully",
        });
      } catch (error) {
        console.error('Error sharing:', error);
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

  // Handle sharing to portfolio
  const handleShareToPortfolio = async () => {
    if (selectedPortfolios.length === 0) {
      toast({
        title: "No portfolio selected",
        description: "Please select at least one portfolio to share to",
        variant: "destructive"
      });
      return;
    }

    setIsSharingToPortfolio(true);

    try {
      const response = await fetch('/api/portfolio/share-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          portfolioIds: selectedPortfolios,
          includeProof: includeProof,
          proofFiles: includeProof ? proofFiles : [],
          proofText: includeProof ? task.proofText : '',
          proofLink: includeProof ? task.proofLink : ''
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Task shared to portfolio successfully",
        });
        onOpenChange(false);
      } else {
        throw new Error('Failed to share to portfolio');
      }
    } catch (error) {
      console.error('Error sharing to portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to share task to portfolio",
        variant: "destructive"
      });
    } finally {
      setIsSharingToPortfolio(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Accomplishment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Share your completed task to your portfolio or social media.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Portfolio Sharing Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Share to Portfolio</h3>

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
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <File className="h-4 w-4 mr-1" />
                      <span>{proofFiles.length} file{proofFiles.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {proofFiles.slice(0, 3).map((file, index) => {
                        const fileName = file.split('/').pop() || `file-${index + 1}`;
                        return (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {fileName.length > 15 ? `${fileName.substring(0, 12)}...` : fileName}
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
                        : task.proofText
                      }
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

            {portfolios.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm">Select portfolios:</Label>
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
            ) : (
              <p className="text-sm text-muted-foreground">
                You don't have any portfolios yet. Create one in the Portfolio section.
              </p>
            )}

            <Button 
              onClick={handleShareToPortfolio} 
              disabled={isSharingToPortfolio || portfolios.length === 0}
              className="w-full"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              {isSharingToPortfolio ? "Sharing..." : "Share to Portfolio"}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Share on Social Media</h3>

            <div className="relative mb-4">
              <Textarea
                value={shareMessage}
                readOnly
                rows={3}
                className="pr-10"
              />
              <button 
                onClick={handleCopy} 
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-gray-100"
                aria-label="Copy to clipboard"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
              </button>
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-2">Share via:</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(getTwitterShareUrl(), '_blank')}>
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(getFacebookShareUrl(), '_blank')}>
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(getLinkedInShareUrl(), '_blank')}>
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(getEmailShareUrl(), '_blank')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Link className="h-4 w-4 mr-2" />
                  Direct Share
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-2 text-sm text-muted-foreground">
            <p>Sharing your completed tasks can help motivate others and track your own progress!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTaskModal;