import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import PhotoThumbnail from "@/components/dashboard/photo-thumbnail";
import PhotoUpload from "@/components/forms/photo-upload";

const Photos = () => {
  const [photoUploadDialogOpen, setPhotoUploadDialogOpen] = useState(false);

  // Fetch photos
  const { data: photos, isLoading, refetch } = useQuery({
    queryKey: ["/api/photos"],
  });

  return (
    <>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Photos</h2>
          <Button onClick={() => setPhotoUploadDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Upload Photo
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">All Photos</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <span className="mr-1 text-sm">Filter</span>
                </Button>
                <Button variant="outline" size="sm">
                  <span className="mr-1 text-sm">Sort</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Photos Grid */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">Loading photos...</div>
            ) : photos && photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo: any) => (
                  <PhotoThumbnail 
                    key={photo.id} 
                    photo={photo} 
                    onPhotoUpdate={refetch}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  ></path>
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No photos yet</h3>
                <p className="text-gray-500 mt-1">Upload a photo to get started</p>
                <Button 
                  onClick={() => setPhotoUploadDialogOpen(true)}
                  className="mt-4"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Upload Dialog */}
      <Dialog open={photoUploadDialogOpen} onOpenChange={setPhotoUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          <PhotoUpload 
            onSuccess={() => {
              setPhotoUploadDialogOpen(false);
              refetch();
            }} 
            onCancel={() => setPhotoUploadDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Photos;
