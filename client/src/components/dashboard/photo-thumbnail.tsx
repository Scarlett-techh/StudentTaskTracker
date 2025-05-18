import { FC, useState } from "react";
import { ZoomIn, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface PhotoThumbnailProps {
  photo: {
    id: number;
    title: string;
    fileData: string;
    mimeType: string;
    subject?: string;
    createdAt: string;
  };
  onPhotoUpdate?: () => void;
}

const PhotoThumbnail: FC<PhotoThumbnailProps> = ({ photo, onPhotoUpdate }) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Format date for display
  let dateDisplay = "Unknown date";
  try {
    const date = new Date(photo.createdAt);
    dateDisplay = format(date, "MMM d");
  } catch (error) {
    // Keep the default
  }

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/photos/${photo.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      if (onPhotoUpdate) onPhotoUpdate();
      toast({
        title: "Photo deleted",
        description: "Photo has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting photo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeletePhoto = () => {
    deletePhotoMutation.mutate();
  };

  // Create data URL to display the image
  const photoSrc = `data:${photo.mimeType};base64,${photo.fileData}`;

  return (
    <>
      <div className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img 
          src={photoSrc} 
          alt={photo.title} 
          className="object-cover w-full h-full" 
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
          <div className="hidden group-hover:flex space-x-2">
            <button 
              className="p-1.5 bg-white rounded-full text-gray-800 shadow hover:bg-gray-100"
              onClick={() => setViewDialogOpen(true)}
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button 
              className="p-1.5 bg-white rounded-full text-gray-800 shadow hover:bg-gray-100"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs">
          {photo.title} - {dateDisplay}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this photo? This action cannot be undone.</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePhoto}
              disabled={deletePhotoMutation.isPending}
            >
              {deletePhotoMutation.isPending ? "Deleting..." : "Delete Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Photo Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{photo.title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img 
              src={photoSrc} 
              alt={photo.title} 
              className="max-h-[70vh] max-w-full object-contain" 
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {photo.subject && <span className="mr-2">{photo.subject}</span>}
              <span>{dateDisplay}</span>
            </p>
            <Button 
              variant="outline" 
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoThumbnail;
