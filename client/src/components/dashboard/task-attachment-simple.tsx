import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Paperclip, Image, FileText, X, Upload } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import FilePreview from './file-preview';

interface TaskAttachmentSimpleProps {
  taskId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskAttachmentSimple({ 
  taskId, 
  open, 
  onOpenChange 
}: TaskAttachmentSimpleProps) {
  const { toast } = useToast();
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);

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
      if (!fileToUpload) return null;
      
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("title", fileToUpload.name.split('.')[0] || 'Attachment');
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
      setFileToUpload(null);
      toast({
        title: "File attached",
        description: "Your file has been attached to the task."
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
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
      <DialogContent className="bg-white border-0 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-heading">Task Attachments</DialogTitle>
          <DialogDescription className="text-gray-600">
            Add files to your task or view existing attachments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File selector */}
          <div className="flex flex-col gap-2">
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
            <div 
              className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:bg-primary/5 cursor-pointer transition-colors"
              onClick={triggerFileInput}
            >
              <Upload className="h-10 w-10 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-gray-700">Click to select a file</p>
              <p className="text-xs text-gray-500 mt-1">Upload photos, PDFs or documents</p>
            </div>
            {fileToUpload && (
              <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  {fileToUpload.type.includes('image') ? (
                    <Image className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-secondary" />
                  )}
                  <span className="text-sm font-medium truncate">{fileToUpload.name}</span>
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploadFile.isPending}
                  size="sm"
                  className="btn-bounce bg-primary hover:bg-primary/90"
                >
                  {uploadFile.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            )}
          </div>

          {/* File Preview Section */}
          {selectedAttachment && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-2 border-b flex justify-between items-center">
                <h3 className="font-medium text-sm">File Preview</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => setSelectedAttachment(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <FilePreview 
                attachmentId={selectedAttachment.id}
                photoId={selectedAttachment.photoId}
                noteId={selectedAttachment.noteId}
                attachmentType={selectedAttachment.attachmentType}
              />
            </div>
          )}

          {/* Attachment list */}
          <div className="border rounded-md">
            <h3 className="font-medium text-sm p-3 border-b bg-gray-50">Current Attachments</h3>
            
            <div className="max-h-[200px] overflow-y-auto">
              {Array.isArray(attachments) && attachments.length > 0 ? (
                <div className="divide-y">
                  {attachments.map((attachment: any) => (
                    <div key={attachment.id} className="p-2 flex items-center justify-between">
                      <div 
                        className="flex items-center gap-2 flex-1 cursor-pointer" 
                        onClick={() => setSelectedAttachment(attachment)}
                      >
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