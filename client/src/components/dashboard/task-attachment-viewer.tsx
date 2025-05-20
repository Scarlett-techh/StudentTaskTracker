import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Paperclip, Image, FileText, Upload, X } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface TaskAttachmentViewerProps {
  taskId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskAttachmentViewer({ 
  taskId, 
  open, 
  onOpenChange 
}: TaskAttachmentViewerProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch existing attachments
  const { data: attachments = [], refetch } = useQuery({
    queryKey: [`/api/tasks/${taskId}/attachments`],
    enabled: open,
  });

  // Delete attachment mutation
  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: number) => {
      return apiRequest("DELETE", `/api/task-attachments/${attachmentId}`);
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Attachment removed",
        description: "The attachment has been removed from this task."
      });
    }
  });

  // Upload file mutation
  const uploadFile = useMutation({
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
      refetch();
      setSelectedFile(null);
      toast({
        title: "File attached",
        description: "Your file has been attached to the task."
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    uploadFile.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Task Attachments</DialogTitle>
          <DialogDescription>
            Add files to your task or view existing attachments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File selector */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
            <Button onClick={triggerFileInput} variant="outline" size="sm">
              Select File
            </Button>
            {selectedFile ? (
              <div className="flex-1 text-sm truncate">{selectedFile.name}</div>
            ) : (
              <div className="text-sm text-gray-500">No file selected</div>
            )}
          </div>
          
          {selectedFile && (
            <div className="flex justify-end">
              <Button 
                onClick={handleUpload} 
                disabled={uploadFile.isPending}
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadFile.isPending ? 'Uploading...' : 'Upload & Attach'}
              </Button>
            </div>
          )}

          {/* Attachment list */}
          <div className="border rounded-md">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-medium text-sm">Current Attachments</h3>
            </div>
            
            <div className="max-h-[200px] overflow-y-auto p-1">
              {Array.isArray(attachments) && attachments.length > 0 ? (
                <div className="divide-y">
                  {attachments.map((attachment: any) => (
                    <div key={attachment.id} className="p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {attachment.attachmentType === 'photo' ? (
                          <Image className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm">
                          {attachment.attachmentType === 'photo' 
                            ? `Photo #${attachment.photoId}` 
                            : `Note #${attachment.noteId}`}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => deleteAttachment.mutate(attachment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-gray-500">
                  <Paperclip className="mx-auto h-5 w-5 text-gray-400 mb-1" />
                  <p>No attachments yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}