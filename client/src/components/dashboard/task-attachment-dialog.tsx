import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paperclip, Image, FileText, X, Upload, Camera, File } from 'lucide-react';

interface TaskAttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number;
}

const TaskAttachmentDialog = ({ open, onOpenChange, taskId }: TaskAttachmentDialogProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("current");
  const [photoNoteTab, setPhotoNoteTab] = useState<string>("photos");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch existing attachments for this task
  const { data: attachments = [], refetch: refetchAttachments } = useQuery({
    queryKey: [`/api/tasks/${taskId}/attachments`],
    enabled: open, // Only fetch when dialog is open
  });
  
  // Get photo details if needed
  const { data: photos = [] } = useQuery({
    queryKey: ['/api/photos'],
    enabled: open && activeTab === "existing" && photoNoteTab === "photos",
  });
  
  // Get note details if needed
  const { data: notes = [] } = useQuery({
    queryKey: ['/api/notes'],
    enabled: open && activeTab === "existing" && photoNoteTab === "notes",
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
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };
  
  // Upload attachment mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return null;
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", selectedFile.name.split('.')[0] || 'Attachment');
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
      refetchAttachments();
      
      toast({
        title: "File attached",
        description: "Your file has been attached to the task.",
      });
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error) => {
      toast({
        title: "Error attaching file",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Attach existing photo mutation
  const attachPhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      return apiRequest("POST", `/api/tasks/${taskId}/attachments`, {
        photoId,
        attachmentType: 'photo'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      refetchAttachments();
      
      toast({
        title: "Photo attached",
        description: "The selected photo has been attached to the task.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error attaching photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Attach existing note mutation
  const attachNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return apiRequest("POST", `/api/tasks/${taskId}/attachments`, {
        noteId,
        attachmentType: 'note'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      refetchAttachments();
      
      toast({
        title: "Note attached",
        description: "The selected note has been attached to the task.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error attaching note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      return apiRequest("DELETE", `/api/task-attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      refetchAttachments();
      
      toast({
        title: "Attachment removed",
        description: "The attachment has been removed from the task.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing attachment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleUpload = () => {
    uploadMutation.mutate();
  };
  
  const handleAttachPhoto = (photoId: number) => {
    attachPhotoMutation.mutate(photoId);
  };
  
  const handleAttachNote = (noteId: number) => {
    attachNoteMutation.mutate(noteId);
  };
  
  const handleDetach = (attachmentId: number) => {
    deleteAttachmentMutation.mutate(attachmentId);
  };
  
  // Find the associated photo or note for an attachment
  const getAttachmentDetails = (attachment: any) => {
    if (attachment.attachmentType === 'photo' && attachment.photoId) {
      const foundPhoto = photos.find((p: any) => p.id === attachment.photoId);
      return foundPhoto;
    } else if (attachment.attachmentType === 'note' && attachment.noteId) {
      const foundNote = notes.find((n: any) => n.id === attachment.noteId);
      return foundNote;
    }
    return null;
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Paperclip className="mr-2 h-5 w-5" />
            Task Attachments
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="current">Current Attachments</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
            <TabsTrigger value="existing">From Library</TabsTrigger>
          </TabsList>
          
          {/* Current Attachments Tab */}
          <TabsContent value="current">
            <div className="space-y-4">
              {Array.isArray(attachments) && attachments.length > 0 ? (
                <div className="max-h-[300px] overflow-y-scroll rounded-md border p-4">
                  <div className="space-y-3">
                    {attachments.map((attachment: any) => {
                      const details = getAttachmentDetails(attachment);
                      return (
                        <div 
                          key={attachment.id} 
                          className="flex items-center justify-between border rounded-md p-3"
                        >
                          <div className="flex items-center space-x-3">
                            {attachment.attachmentType === 'photo' ? (
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-50 flex items-center justify-center rounded">
                                <Image className="h-5 w-5 text-blue-500" />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 h-10 w-10 bg-green-50 flex items-center justify-center rounded">
                                <FileText className="h-5 w-5 text-green-500" />
                              </div>
                            )}
                            
                            <div>
                              <p className="font-medium text-sm">
                                {details?.title || `${attachment.attachmentType} #${attachment.photoId || attachment.noteId}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(attachment.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDetach(attachment.id)}
                            disabled={deleteAttachmentMutation.isPending}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Paperclip className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p>No attachments yet</p>
                  <p className="text-sm mt-1">
                    Add attachments by uploading files or selecting from your library
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Upload New Tab */}
          <TabsContent value="upload">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={triggerFileInput}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                />
                
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                
                <div className="text-sm">
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-gray-500 mt-1">
                    Support for images, PDFs, and documents (max 10MB)
                  </p>
                </div>
              </div>
              
              {selectedFile && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="h-16 w-16 object-cover rounded" 
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-100 flex items-center justify-center rounded">
                        <File className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                      className="flex items-center"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadMutation.isPending ? 'Uploading...' : 'Upload & Attach'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Existing Files Tab */}
          <TabsContent value="existing">
            <Tabs defaultValue="photos" value={photoNoteTab} onValueChange={setPhotoNoteTab}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="photos">
                {Array.isArray(photos) && photos.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-scroll rounded-md border p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {photos.map((photo: any) => (
                        <div 
                          key={photo.id} 
                          className="border rounded-md overflow-hidden"
                        >
                          <div className="bg-gray-100 aspect-video flex items-center justify-center">
                            {photo.fileData ? (
                              <img 
                                src={`data:${photo.mimeType};base64,${photo.fileData}`} 
                                alt={photo.title} 
                                className="max-h-full max-w-full object-contain" 
                              />
                            ) : (
                              <Image className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="p-3">
                            <p className="font-medium text-sm truncate">{photo.title}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(photo.createdAt)}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleAttachPhoto(photo.id)}
                              >
                                Attach
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No photos available</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="notes">
                {Array.isArray(notes) && notes.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-scroll rounded-md border p-4">
                    <div className="space-y-3">
                      {notes.map((note: any) => (
                        <div 
                          key={note.id} 
                          className="border rounded-md p-3"
                        >
                          <div className="flex justify-between">
                            <h4 className="font-medium">{note.title}</h4>
                            <Button
                              size="sm"
                              onClick={() => handleAttachNote(note.id)}
                            >
                              Attach
                            </Button>
                          </div>
                          {note.content && (
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                              {note.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(note.updatedAt || note.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No notes available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TaskAttachmentDialog;