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

  // Count different types of attachments
  const countAttachments = () => {
    if (!item.attachments || item.attachments.length === 0) return 0;

    const files = item.attachments.filter((a: any) => a.type === 'file').length;
    const links = item.attachments.filter((a: any) => a.type === 'link').length;
    const notes = item.attachments.filter((a: any) => a.type === 'note').length;
    const photos = item.attachments.filter((a: any) => a.type === 'photo').length;

    return { files, links, notes, photos, total: item.attachments.length };
  };

  const attachments = countAttachments();

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