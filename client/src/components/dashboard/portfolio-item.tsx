import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Link, Image } from "lucide-react";
import { PortfolioPreview } from "./portfolio-preview";

interface PortfolioItemProps {
  item: any;
  onPreview: () => void;
}

export function PortfolioItem({ item, onPreview }: PortfolioItemProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = () => {
    setIsPreviewOpen(true);
    onPreview();
  };

  // Get the first image from proof files to use as background
  const getBackgroundImage = () => {
    // Check if this is a task item with proof files
    if (item.type === 'task' && item.proofFiles && item.proofFiles.length > 0) {
      // Find the first image file
      const imageFile = item.proofFiles.find((file: string) => {
        return file.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
      });
      return imageFile;
    }

    // Check attachments for backwards compatibility
    if (item.attachments && item.attachments.length > 0) {
      const imageAttachment = item.attachments.find((att: any) => att.type === 'photo' || att.type === 'file');
      if (imageAttachment?.url) {
        return imageAttachment.url;
      }
    }

    // Check for manual portfolio items with file URLs
    if (item.fileUrl && (item.fileType === 'image' || item.type === 'photo')) {
      return item.fileUrl;
    }

    return null;
  };

  // Count different types of attachments
  const countAttachments = () => {
    let totalCount = 0;
    let files = 0, links = 0, notes = 0, photos = 0;

    // Count proof files for task items
    if (item.type === 'task') {
      if (item.proofFiles && item.proofFiles.length > 0) {
        files += item.proofFiles.length;
        totalCount += item.proofFiles.length;
      }
      if (item.proofText) {
        notes += 1;
        totalCount += 1;
      }
      if (item.proofLink) {
        links += 1;
        totalCount += 1;
      }
    }

    // Count attachments for backward compatibility
    if (item.attachments && item.attachments.length > 0) {
      const attachmentFiles = item.attachments.filter((a: any) => a.type === 'file').length;
      const attachmentLinks = item.attachments.filter((a: any) => a.type === 'link').length;
      const attachmentNotes = item.attachments.filter((a: any) => a.type === 'note').length;
      const attachmentPhotos = item.attachments.filter((a: any) => a.type === 'photo').length;
      
      files += attachmentFiles;
      links += attachmentLinks;
      notes += attachmentNotes;
      photos += attachmentPhotos;
      totalCount += item.attachments.length;
    }

    return { files, links, notes, photos, total: totalCount };
  };

  const attachments = countAttachments();
  const backgroundImage = getBackgroundImage();

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform duration-200" data-testid={`card-portfolio-${item.id}`}>
        {/* Background Image Section */}
        {backgroundImage ? (
          <div 
            className="relative h-48 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
            onClick={handlePreview}
          >
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <CardTitle className="text-lg font-bold text-white mb-2 line-clamp-2" data-testid={`text-title-${item.id}`}>
                {item.title}
              </CardTitle>
              
              {attachments.total > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.files > 0 && (
                    <div className="flex items-center text-sm text-white/90 bg-black/30 px-2 py-1 rounded">
                      <FileText className="h-3 w-3 mr-1" />
                      <span>{attachments.files} file{attachments.files !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {attachments.links > 0 && (
                    <div className="flex items-center text-sm text-white/90 bg-black/30 px-2 py-1 rounded">
                      <Link className="h-3 w-3 mr-1" />
                      <span>{attachments.links} link{attachments.links !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {attachments.notes > 0 && (
                    <div className="flex items-center text-sm text-white/90 bg-black/30 px-2 py-1 rounded">
                      <FileText className="h-3 w-3 mr-1" />
                      <span>{attachments.notes} note{attachments.notes !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {attachments.photos > 0 && (
                    <div className="flex items-center text-sm text-white/90 bg-black/30 px-2 py-1 rounded">
                      <Image className="h-3 w-3 mr-1" />
                      <span>{attachments.photos} photo{attachments.photos !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Preview button overlay */}
            <div className="absolute top-4 right-4">
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/20"
                data-testid={`button-preview-${item.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          // Fallback design for items without background images
          <>
            <CardHeader>
              <CardTitle className="text-lg" data-testid={`text-title-${item.id}`}>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {item.description && (
                <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`text-description-${item.id}`}>{item.description}</p>
              )}

              {attachments.total > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Proof of Work:</p>
                  <div className="flex flex-wrap gap-2">
                    {attachments.files > 0 && (
                      <div className="flex items-center text-sm text-blue-600">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>{attachments.files} file{attachments.files !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {attachments.links > 0 && (
                      <div className="flex items-center text-sm text-green-600">
                        <Link className="h-4 w-4 mr-1" />
                        <span>{attachments.links} link{attachments.links !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {attachments.notes > 0 && (
                      <div className="flex items-center text-sm text-amber-600">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>{attachments.notes} note{attachments.notes !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {attachments.photos > 0 && (
                      <div className="flex items-center text-sm text-purple-600">
                        <Image className="h-4 w-4 mr-1" />
                        <span>{attachments.photos} photo{attachments.photos !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handlePreview} className="w-full" data-testid={`button-preview-${item.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Item
              </Button>
            </CardFooter>
          </>
        )}
        
        {/* Description section for items with background images */}
        {backgroundImage && item.description && (
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm line-clamp-2" data-testid={`text-description-${item.id}`}>{item.description}</p>
          </CardContent>
        )}
      </Card>

      <PortfolioPreview
        item={item}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}