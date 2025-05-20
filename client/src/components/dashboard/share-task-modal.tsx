import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Facebook, Twitter, Linkedin, Mail, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    title: string;
    description?: string;
    category: string;
  };
}

const ShareTaskModal = ({ open, onOpenChange, task }: ShareTaskModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
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
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareMessage)}`;
  };
  
  const getLinkedInShareUrl = () => {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(shareMessage)}`;
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
          url: window.location.href,
        });
        toast({
          title: "Shared!",
          description: "Content shared successfully",
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback if Web Share API is not available
      handleCopy();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] dialog-content">
        <DialogHeader>
          <DialogTitle>Share Your Accomplishment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
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
          
          <div className="pt-2 text-sm text-gray-500">
            <p>Sharing your completed tasks can help motivate others and track your own progress!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTaskModal;