import { useState, useRef, FC } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, X, Image, FileText, Upload } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface TaskAttachmentProps {
  taskId: number;
  onAttachmentAdded?: () => void;
}

const TaskAttachment: FC<TaskAttachmentProps> = ({ taskId, onAttachmentAdded }) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Query existing photos for linking
  const { data: photos = [] } = useQuery({
    queryKey: ["/api/photos"],
  });

  // Query existing notes for linking
  const { data: notes = [] } = useQuery({
    queryKey: ["/api/notes"],
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "The maximum file size is 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload file mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return null;
      
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", selectedFile.name.split('.')[0] || 'Untitled attachment');
      formData.append("taskId", String(taskId));
      
      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      
      toast({
        title: "Attachment uploaded",
        description: "Your file has been attached to the task successfully.",
      });
      
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
      
      if (onAttachmentAdded) onAttachmentAdded();
    },
    onError: (error) => {
      setIsUploading(false);
      toast({
        title: "Error uploading attachment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Link existing photo mutation
  const linkPhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoId,
          attachmentType: "photo"
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      
      toast({
        title: "Photo linked",
        description: "Photo has been linked to the task successfully.",
      });
      
      if (onAttachmentAdded) onAttachmentAdded();
    },
    onError: (error) => {
      toast({
        title: "Error linking photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Link existing note mutation
  const linkNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId,
          attachmentType: "note"
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      
      toast({
        title: "Note linked",
        description: "Note has been linked to the task successfully.",
      });
      
      if (onAttachmentAdded) onAttachmentAdded();
    },
    onError: (error) => {
      toast({
        title: "Error linking note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    uploadAttachmentMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={triggerFileInput}
          className="flex items-center"
        >
          <Paperclip className="mr-2 h-4 w-4" />
          Attach File
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf"
        />
        
        <div className="flex-grow"></div>
      </div>
      
      {selectedFile && (
        <div className="bg-gray-50 p-3 rounded-md relative">
          <button 
            onClick={clearSelection}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
          
          {previewUrl && selectedFile.type.startsWith('image/') ? (
            <div className="flex flex-col items-center">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="h-28 w-auto object-contain mb-2" 
              />
              <span className="text-xs text-gray-500">{selectedFile.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FileText className="h-20 w-20 text-gray-400 mb-2" />
              <span className="text-xs text-gray-500">{selectedFile.name}</span>
            </div>
          )}
          
          <div className="mt-3 flex justify-center">
            <Button 
              onClick={handleUpload}
              disabled={isUploading}
              size="sm"
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Upload and Attach"}
              <Upload className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {!selectedFile && (
        <div className="text-xs text-gray-500 italic">
          Select a file to attach to this task.
        </div>
      )}
      
      {/* If there are existing photos/notes, show options to link them */}
      {(photos.length > 0 || notes.length > 0) && !selectedFile && (
        <div className="mt-2">
          <p className="text-sm font-medium mb-2">Or link existing items:</p>
          
          {photos.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Photos:</p>
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(0, 3).map((photo: any) => (
                  <div 
                    key={photo.id}
                    className="relative border rounded-md p-1 cursor-pointer hover:bg-gray-50"
                    onClick={() => linkPhotoMutation.mutate(photo.id)}
                  >
                    <div className="aspect-square bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {photo.thumbnailData ? (
                        <img 
                          src={`data:${photo.mimeType};base64,${photo.thumbnailData}`} 
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <p className="text-xs truncate mt-1">{photo.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {notes.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Notes:</p>
              <div className="space-y-1">
                {notes.slice(0, 3).map((note: any) => (
                  <div 
                    key={note.id}
                    className="border rounded-md p-2 cursor-pointer hover:bg-gray-50 flex items-center"
                    onClick={() => linkNoteMutation.mutate(note.id)}
                  >
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    <p className="text-xs truncate">{note.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskAttachment;