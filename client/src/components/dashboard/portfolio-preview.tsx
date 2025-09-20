import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Link, Image, File, Download, ExternalLink } from "lucide-react";

interface PortfolioPreviewProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioPreview({ item, isOpen, onClose }: PortfolioPreviewProps) {
  // Function to render different types of attachments
  const renderAttachment = (attachment: any, index: number) => {
    switch (attachment.type) {
      case 'file':
        return (
          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center">
              <File className="h-5 w-5 mr-2 text-blue-500" />
              <div>
                <p className="font-medium">{attachment.name}</p>
                <p className="text-sm text-muted-foreground">
                  {attachment.size ? `Size: ${formatFileSize(attachment.size)}` : 'File'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(attachment.url, '_blank')}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        );

      case 'link':
        return (
          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center">
              <Link className="h-5 w-5 mr-2 text-green-500" />
              <div>
                <p className="font-medium">{attachment.title || 'External Link'}</p>
                <p className="text-sm text-muted-foreground truncate max-w-xs">
                  {attachment.url}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(attachment.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Visit
            </Button>
          </div>
        );

      case 'note':
        return (
          <div key={index} className="p-3 border rounded-md">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 mr-2 text-amber-500" />
              <p className="font-medium">Note</p>
            </div>
            <p className="text-sm whitespace-pre-wrap">{attachment.content}</p>
          </div>
        );

      case 'photo':
        return (
          <div key={index} className="p-3 border rounded-md">
            <div className="flex items-center mb-2">
              <Image className="h-5 w-5 mr-2 text-purple-500" />
              <p className="font-medium">{attachment.title || 'Photo'}</p>
            </div>
            <div className="mt-2">
              <img 
                src={attachment.url} 
                alt={attachment.title || 'Task photo'} 
                className="rounded-md max-h-64 object-contain"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper function to format file sizes
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Portfolio Item Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">{item?.title}</h2>
            {item?.description && (
              <p className="text-muted-foreground mt-1">{item.description}</p>
            )}
          </div>

          {item?.attachments && item.attachments.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-medium text-lg">Proof of Work</h3>
              {item.attachments.map((attachment: any, index: number) => 
                renderAttachment(attachment, index)
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No proof of work attached to this item.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}