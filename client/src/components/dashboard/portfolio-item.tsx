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

  // Count different types of proof and attachments
  const countProofItems = () => {
    let files = 0;
    let links = 0;
    let notes = 0;
    let photos = 0;

    // Count task proof items (for task-based portfolio items)
    if (item.type === 'task') {
      if (item.proofFiles && item.proofFiles.length > 0) {
        item.proofFiles.forEach((file: string) => {
          if (file.startsWith('data:image/')) {
            photos++;
          } else {
            files++;
          }
        });
      }
      if (item.proofText && item.proofText.trim()) {
        notes++;
      }
      if (item.proofLink && item.proofLink.trim()) {
        // Count multiple links separated by comma
        links += item.proofLink.split(',').filter((link: string) => link.trim()).length;
      }
    }

    // Count regular attachments (for other portfolio items)
    if (item.attachments && item.attachments.length > 0) {
      files += item.attachments.filter((a: any) => a.type === 'file').length;
      links += item.attachments.filter((a: any) => a.type === 'link').length;
      notes += item.attachments.filter((a: any) => a.type === 'note').length;
      photos += item.attachments.filter((a: any) => a.type === 'photo').length;
    }

    return { files, links, notes, photos, total: files + links + notes + photos };
  };

  const proofItems = countProofItems();

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">{item.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          {item.description && (
            <p className="text-muted-foreground mb-4 line-clamp-3">{item.description}</p>
          )}

          {proofItems.total > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Proof of Work:</p>
              <div className="flex flex-wrap gap-2">
                {proofItems.files > 0 && (
                  <div className="flex items-center text-sm text-blue-600">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>{proofItems.files} file{proofItems.files !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {proofItems.links > 0 && (
                  <div className="flex items-center text-sm text-green-600">
                    <Link className="h-4 w-4 mr-1" />
                    <span>{proofItems.links} link{proofItems.links !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {proofItems.notes > 0 && (
                  <div className="flex items-center text-sm text-amber-600">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>{proofItems.notes} note{proofItems.notes !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {proofItems.photos > 0 && (
                  <div className="flex items-center text-sm text-purple-600">
                    <Image className="h-4 w-4 mr-1" />
                    <span>{proofItems.photos} photo{proofItems.photos !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handlePreview} className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Preview Item
          </Button>
        </CardFooter>
      </Card>

      <PortfolioPreview
        item={item}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}